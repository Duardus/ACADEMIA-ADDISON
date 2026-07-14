// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Servicio de Autenticacion Passkeys v15
// Fix: rpID forzado a academia-addison.pages.dev (dominio del frontend)
// ═══════════════════════════════════════════════════════════════════════════

const { 
  generateRegistrationOptions, 
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse 
} = require('@simplewebauthn/server');
const usuariosRepositorio = require('../repositorios/usuarios.repositorio')
const { generarToken } = require('../utilidades/jwt');
const { ErrorApp } = require('../utilidades/errores');
const crypto = require('crypto');

const RP_NAME = 'Academia Addison';
// FORZADO: rpID debe ser el dominio donde corre el frontend
const RP_ID = 'academia-addison.pages.dev';
const ORIGIN = 'https://academia-addison.pages.dev';

class PasskeyServicio {

  async generarOpcionesRegistro(correo, nombre, reqOrigen) {
    let usuario = await usuariosRepositorio.buscarUsuarioPorCorreo(correo);
    if (!usuario) {
      if (!nombre || nombre.trim() === '') {
        throw new ErrorApp('Nombre requerido para crear cuenta', 400, 'NOMBRE_REQUERIDO');
      }
      usuario = await usuariosRepositorio.crearUsuario(correo, nombre);
    }

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: Buffer.from(String(usuario.usuario_id)),
      userName: correo,
      userDisplayName: usuario.nombre_completo || nombre || correo,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred'
      },
      extensions: { credProps: true }
    });

    const passkeysExistentes = await usuariosRepositorio.listarPasskeysPorUsuario(String(usuario.usuario_id));
    if (passkeysExistentes.length > 0) {
      options.excludeCredentials = passkeysExistentes.map(pk => ({
        id: Buffer.from(pk.credential_id).toString('base64url'),
        type: 'public-key'
      }));
    }

    const challengeString = options.challenge;
    await usuariosRepositorio.guardarChallenge(correo, challengeString, 'registro');

    return {
      exito: true,
      options,
      usuario_id: usuario.usuario_id,
      es_nuevo: !usuario.passkey_registrado,
      tiene_passkeys: passkeysExistentes.length
    };
  }

  async verificarRegistro(correo, respuesta, reqOrigen) {
    const challengeGuardado = await usuariosRepositorio.buscarChallenge(correo, 'registro');
    if (!challengeGuardado) {
      throw new ErrorApp('Challenge expirado o invalido. Intenta de nuevo.', 400, 'CHALLENGE_EXPIRADO');
    }

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: respuesta,
        expectedChallenge: challengeGuardado,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID
      });
    } catch (err) {
      console.error('[PASSKEY] Error verifyRegistrationResponse:', err.message);
      throw new ErrorApp('Verificacion de passkey fallida: ' + err.message, 400, 'VERIFICACION_FALLIDA');
    }

    if (!verification.verified) {
      throw new ErrorApp('Verificacion de passkey no exitosa', 400, 'VERIFICACION_FALLIDA');
    }

    const credential = verification.registrationInfo?.credential;
    if (!credential) {
      throw new ErrorApp('No se pudo obtener credential del passkey', 500, 'CREDENTIAL_NO_OBTENIDO');
    }

    const usuario = await usuariosRepositorio.buscarUsuarioPorCorreo(correo);

    await usuariosRepositorio.guardarPasskey(
      String(usuario.usuario_id),
      Buffer.from(credential.id),
      Buffer.from(credential.publicKey),
      'Dispositivo Local',
      'cross-platform'
    );

    await usuariosRepositorio.actualizarPasskeyRegistrado(usuario.usuario_id);
    await usuariosRepositorio.eliminarChallenge(correo);

    const tokenSesion = this._generarTokenSesion(usuario);
    const refreshToken = crypto.randomBytes(32).toString('hex');

    await usuariosRepositorio.guardarSesion(
      String(usuario.usuario_id),
      crypto.createHash('sha256').update(refreshToken).digest('hex'),
      'Dispositivo Local',
      'Navegador',
      null,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    return {
      exito: true,
      mensaje: 'Passkey registrado exitosamente',
      token_sesion: tokenSesion,
      refresh_token: refreshToken,
      usuario: {
        usuario_id: usuario.usuario_id,
        correo: usuario.correo_electronico,
        nombre: usuario.nombre_completo,
        estado: usuario.estado_usuario
      }
    };
  }

  async generarOpcionesLogin(correo, reqOrigen) {
    const usuario = await usuariosRepositorio.buscarUsuarioPorCorreo(correo);
    
    if (!usuario) {
      throw new ErrorApp('Usuario no encontrado. Crea una cuenta primero.', 404, 'USUARIO_NO_ENCONTRADO');
    }

    const passkeys = await usuariosRepositorio.listarPasskeysPorUsuario(String(usuario.usuario_id));
    
    if (passkeys.length === 0) {
      return {
        exito: true,
        requiere_registro: true,
        mensaje: 'No tienes passkeys registrados. Registra uno ahora.',
        usuario_id: usuario.usuario_id,
        correo: usuario.correo_electronico,
        nombre: usuario.nombre_completo
      };
    }

    const allowCredentials = passkeys.map(pk => ({
      id: Buffer.from(pk.credential_id).toString('base64url'),
      type: 'public-key'
    }));

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials,
      userVerification: 'preferred'
    });

    const challengeString = options.challenge;
    await usuariosRepositorio.guardarChallenge(correo, challengeString, 'login');

    return { 
      exito: true, 
      requiere_registro: false,
      options 
    };
  }

  async verificarLogin(correo, respuesta, reqOrigen) {
    const challengeGuardado = await usuariosRepositorio.buscarChallenge(correo, 'login');
    if (!challengeGuardado) throw new ErrorApp('Challenge expirado', 400, 'CHALLENGE_EXPIRADO');

    const usuario = await usuariosRepositorio.buscarUsuarioPorCorreo(correo);
    
    const credentialIdBuffer = Buffer.from(respuesta.id, 'base64url');
    const passkey = await usuariosRepositorio.buscarPasskeyPorCredentialId(credentialIdBuffer);

    if (!passkey || String(passkey.usuario_id) !== String(usuario.usuario_id)) {
      throw new ErrorApp('Passkey no encontrado', 404, 'PASSKEY_NO_ENCONTRADO');
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: respuesta,
        expectedChallenge: challengeGuardado,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        authenticator: {
          credentialID: passkey.credential_id,
          credentialPublicKey: passkey.public_key,
          counter: passkey.sign_count
        }
      });
    } catch (err) {
      throw new ErrorApp('Autenticacion fallida: ' + err.message, 400, 'AUTENTICACION_FALLIDA');
    }

    if (!verification.verified) {
      throw new ErrorApp('Autenticacion no exitosa', 400, 'AUTENTICACION_FALLIDA');
    }

    await usuariosRepositorio.actualizarSignCount(passkey.credential_id, verification.authenticationInfo.newCounter);
    await usuariosRepositorio.eliminarChallenge(correo);

    const tokenSesion = this._generarTokenSesion(usuario);
    const refreshToken = crypto.randomBytes(32).toString('hex');

    await usuariosRepositorio.guardarSesion(
      String(usuario.usuario_id),
      crypto.createHash('sha256').update(refreshToken).digest('hex'),
      passkey.nombre_dispositivo || 'Dispositivo Local',
      'Navegador',
      null,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    await usuariosRepositorio.actualizarUltimoLogin(correo);

    return {
      exito: true,
      mensaje: 'Autenticacion exitosa',
      token_sesion: tokenSesion,
      refresh_token: refreshToken,
      usuario: {
        usuario_id: usuario.usuario_id,
        correo: usuario.correo_electronico,
        nombre: usuario.nombre_completo,
        estado: usuario.estado_usuario
      }
    };
  }

  async generarMagicLink(correo) {
    const usuario = await usuariosRepositorio.buscarUsuarioPorCorreo(correo);
    if (!usuario) throw new ErrorApp('Usuario no encontrado', 404, 'USUARIO_NO_ENCONTRADO');

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiraEn = new Date(Date.now() + 15 * 60 * 1000);

    await usuariosRepositorio.guardarMagicLink(String(usuario.usuario_id), tokenHash, expiraEn);
    return { token, tokenHash, expiraEn };
  }

  async verificarMagicLink(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const magicLink = await usuariosRepositorio.buscarMagicLink(tokenHash);
    if (!magicLink) throw new ErrorApp('Link invalido o expirado', 400, 'MAGIC_LINK_INVALIDO');

    await usuariosRepositorio.marcarMagicLinkUsado(magicLink.id);
    return { usuario_id: magicLink.usuario_id, correo: magicLink.correo_electronico };
  }

  _generarTokenSesion(usuario) {
    return generarToken({
      usuario_id: usuario.usuario_id,
      correo: usuario.correo_electronico,
      estado: usuario.estado_usuario,
      rol: usuario.etiquetas?.rol || 'estudiante'
    });
  }
}

module.exports = new PasskeyServicio();
