// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Servicio de Autenticacion Passkeys v3
// Compatible con usuarios.usuario_id = VARCHAR
// ═══════════════════════════════════════════════════════════════════════════

const { 
  generateRegistrationOptions, 
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse 
} = require('@simplewebauthn/server');
const passkeyRepositorio = require('../repositorios/passkey.repositorio');
const { generarToken } = require('../utilidades/jwt');
const crypto = require('crypto');

const RP_NAME = 'Academia Addison';
const RP_ID_DEFAULT = 'academia-addison.pages.dev';
const ORIGIN_DEFAULT = 'https://academia-addison.pages.dev';

class PasskeyServicio {

  _getRPConfig(reqOrigen) {
    let rpID = RP_ID_DEFAULT;
    let origin = ORIGIN_DEFAULT;
    if (reqOrigen) {
      try {
        const url = new URL(reqOrigen);
        rpID = url.hostname;
        origin = url.origin;
      } catch(e) {}
    }
    return { rpID, origin };
  }

  async generarOpcionesRegistro(correo, nombre, reqOrigen) {
    const { rpID, origin } = this._getRPConfig(reqOrigen);
    let usuario = await passkeyRepositorio.buscarUsuarioPorCorreo(correo);
    if (!usuario) {
      usuario = await passkeyRepositorio.crearUsuario(correo, nombre);
    }

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: rpID,
      userID: Buffer.from(String(usuario.usuario_id)),
      userName: correo,
      userDisplayName: nombre || correo,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform'
      },
      extensions: { credProps: true }
    });

    await passkeyRepositorio.guardarChallenge(correo, options.challenge, 'registro');

    return {
      exito: true,
      options,
      usuario_id: usuario.usuario_id,
      es_nuevo: !usuario.passkey_registrado
    };
  }

  async verificarRegistro(correo, respuesta, reqOrigen) {
    const { rpID, origin } = this._getRPConfig(reqOrigen);
    
    let expectedChallenge;
    try {
      const clientDataJSON = Buffer.from(respuesta.response.clientDataJSON, 'base64url').toString('utf8');
      const clientData = JSON.parse(clientDataJSON);
      expectedChallenge = clientData.challenge;
    } catch (e) {
      throw new Error('No se pudo extraer challenge de la respuesta del navegador');
    }

    const challengeGuardado = await passkeyRepositorio.buscarChallenge(correo, 'registro');
    if (!challengeGuardado) {
      throw new Error('Challenge expirado o invalido. Intenta de nuevo.');
    }

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: respuesta,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID
      });
    } catch (err) {
      console.error('[PASSKEY] Error en verifyRegistrationResponse:', err.message);
      throw new Error('Verificacion de passkey fallida: ' + err.message);
    }

    if (!verification.verified) {
      throw new Error('Verificacion de passkey no exitosa');
    }

    const credential = verification.registrationInfo?.credential;
    if (!credential) {
      throw new Error('No se pudo obtener credential del passkey');
    }

    const usuario = await passkeyRepositorio.buscarUsuarioPorCorreo(correo);

    await passkeyRepositorio.guardarPasskey(
      String(usuario.usuario_id),
      Buffer.from(credential.id),
      Buffer.from(credential.publicKey),
      'Dispositivo Local',
      'platform'
    );

    await passkeyRepositorio.actualizarPasskeyRegistrado(usuario.usuario_id);
    await passkeyRepositorio.eliminarChallenge(correo);

    const tokenSesion = this._generarTokenSesion(usuario);
    const refreshToken = crypto.randomBytes(32).toString('hex');

    await passkeyRepositorio.guardarSesion(
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
    const { rpID, origin } = this._getRPConfig(reqOrigen);
    const usuario = await passkeyRepositorio.buscarUsuarioPorCorreo(correo);
    if (!usuario) throw new Error('Usuario no encontrado');
    if (!usuario.passkey_registrado) throw new Error('Usuario sin passkey registrado');

    const passkeys = await passkeyRepositorio.listarPasskeysPorUsuario(String(usuario.usuario_id));
    if (passkeys.length === 0) throw new Error('No hay passkeys activos');

    const allowCredentials = passkeys.map(pk => ({
      id: Buffer.from(pk.credential_id).toString('base64url'),
      type: 'public-key'
    }));

    const options = await generateAuthenticationOptions({
      rpID: rpID,
      allowCredentials,
      userVerification: 'preferred'
    });

    await passkeyRepositorio.guardarChallenge(correo, options.challenge, 'login');

    return { exito: true, options };
  }

  async verificarLogin(correo, respuesta, reqOrigen) {
    const { rpID, origin } = this._getRPConfig(reqOrigen);
    
    let expectedChallenge;
    try {
      const clientDataJSON = Buffer.from(respuesta.response.clientDataJSON, 'base64url').toString('utf8');
      const clientData = JSON.parse(clientDataJSON);
      expectedChallenge = clientData.challenge;
    } catch (e) {
      throw new Error('No se pudo extraer challenge de la respuesta');
    }

    const challengeGuardado = await passkeyRepositorio.buscarChallenge(correo, 'login');
    if (!challengeGuardado) throw new Error('Challenge expirado');

    const usuario = await passkeyRepositorio.buscarUsuarioPorCorreo(correo);
    
    const credentialIdBuffer = Buffer.from(respuesta.id, 'base64url');
    const passkey = await passkeyRepositorio.buscarPasskeyPorCredentialId(credentialIdBuffer);

    if (!passkey || String(passkey.usuario_id) !== String(usuario.usuario_id)) {
      throw new Error('Passkey no encontrado');
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: respuesta,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator: {
          credentialID: passkey.credential_id,
          credentialPublicKey: passkey.public_key,
          counter: passkey.sign_count
        }
      });
    } catch (err) {
      throw new Error('Autenticacion fallida: ' + err.message);
    }

    if (!verification.verified) {
      throw new Error('Autenticacion no exitosa');
    }

    await passkeyRepositorio.actualizarSignCount(passkey.credential_id, verification.authenticationInfo.newCounter);
    await passkeyRepositorio.eliminarChallenge(correo);

    const tokenSesion = this._generarTokenSesion(usuario);
    const refreshToken = crypto.randomBytes(32).toString('hex');

    await passkeyRepositorio.guardarSesion(
      String(usuario.usuario_id),
      crypto.createHash('sha256').update(refreshToken).digest('hex'),
      passkey.nombre_dispositivo || 'Dispositivo Local',
      'Navegador',
      null,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    await passkeyRepositorio.actualizarUltimoLogin(correo);

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
    const usuario = await passkeyRepositorio.buscarUsuarioPorCorreo(correo);
    if (!usuario) throw new Error('Usuario no encontrado');

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiraEn = new Date(Date.now() + 15 * 60 * 1000);

    await passkeyRepositorio.guardarMagicLink(String(usuario.usuario_id), tokenHash, expiraEn);
    return { token, tokenHash, expiraEn };
  }

  async verificarMagicLink(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const magicLink = await passkeyRepositorio.buscarMagicLink(tokenHash);
    if (!magicLink) throw new Error('Link invalido o expirado');

    await passkeyRepositorio.marcarMagicLinkUsado(magicLink.id);
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
