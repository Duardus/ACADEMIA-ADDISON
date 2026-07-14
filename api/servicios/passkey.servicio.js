// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Servicio de Autenticacion Passkeys (WebAuthn)
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

// Configuración WebAuthn
const RP_NAME = 'Academia Addison';
const RP_ID = 'academia-addison.duckdns.org';
const ORIGIN = 'https://academia-addison.pages.dev';

class PasskeyServicio {

  // ═════════════════════════════════════════════════════════════════
  // REGISTRO: Generar opciones para crear passkey
  // ═════════════════════════════════════════════════════════════════
  async generarOpcionesRegistro(correo, nombre) {
    let usuario = await passkeyRepositorio.buscarUsuarioPorCorreo(correo);

    // Si no existe, crear usuario temporal
    if (!usuario) {
      usuario = await passkeyRepositorio.crearUsuario(correo, nombre);
    }

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: Buffer.from(usuario.usuario_id),
      userName: correo,
      userDisplayName: nombre || correo,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform'
      }
    });

    // Guardar challenge temporal (en producción usar Redis, aquí memoria simple)
    global.challenges = global.challenges || {};
    global.challenges[correo] = options.challenge;

    return {
      exito: true,
      options,
      usuario_id: usuario.usuario_id,
      es_nuevo: !usuario.passkey_registrado
    };
  }

  // ═════════════════════════════════════════════════════════════════
  // REGISTRO: Verificar respuesta del navegador
  // ═════════════════════════════════════════════════════════════════
  async verificarRegistro(correo, respuesta) {
    const expectedChallenge = global.challenges?.[correo];
    if (!expectedChallenge) {
      throw new Error('Challenge expirado o invalido');
    }

    const verification = await verifyRegistrationResponse({
      response: respuesta,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID
    });

    if (!verification.verified) {
      throw new Error('Verificacion de passkey fallida');
    }

    const { credential } = verification;
    const usuario = await passkeyRepositorio.buscarUsuarioPorCorreo(correo);

    // Guardar passkey en BD
    await passkeyRepositorio.guardarPasskey(
      usuario.usuario_id,
      Buffer.from(credential.id),
      Buffer.from(credential.publicKey),
      'Dispositivo Principal',
      'mobile'
    );

    // Marcar como registrado
    await passkeyRepositorio.actualizarPasskeyRegistrado(usuario.usuario_id);

    // Limpiar challenge
    delete global.challenges[correo];

    // Generar tokens
    const tokenSesion = this._generarTokenSesion(usuario);
    const refreshToken = crypto.randomBytes(32).toString('hex');

    await passkeyRepositorio.guardarSesion(
      usuario.usuario_id,
      crypto.createHash('sha256').update(refreshToken).digest('hex'),
      'Dispositivo Principal',
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

  // ═════════════════════════════════════════════════════════════════
  // LOGIN: Generar opciones de autenticacion
  // ═════════════════════════════════════════════════════════════════
  async generarOpcionesLogin(correo) {
    const usuario = await passkeyRepositorio.buscarUsuarioPorCorreo(correo);
    
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    if (!usuario.passkey_registrado) {
      throw new Error('Usuario sin passkey registrado');
    }

    // Buscar passkeys del usuario
    const passkeys = await passkeyRepositorio.listarPasskeysPorUsuario(usuario.usuario_id);
    
    if (passkeys.length === 0) {
      throw new Error('No hay passkeys activos');
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: passkeys.map(pk => ({
        id: pk.credential_id,
        type: 'public-key'
      })),
      userVerification: 'preferred'
    });

    global.challenges = global.challenges || {};
    global.challenges[correo] = options.challenge;

    return {
      exito: true,
      options
    };
  }

  // ═════════════════════════════════════════════════════════════════
  // LOGIN: Verificar autenticacion
  // ═════════════════════════════════════════════════════════════════
  async verificarLogin(correo, respuesta) {
    const expectedChallenge = global.challenges?.[correo];
    if (!expectedChallenge) {
      throw new Error('Challenge expirado');
    }

    const usuario = await passkeyRepositorio.buscarUsuarioPorCorreo(correo);
    const passkey = await passkeyRepositorio.buscarPasskeyPorCredentialId(
      Buffer.from(respuesta.id, 'base64')
    );

    if (!passkey || passkey.usuario_id !== usuario.usuario_id) {
      throw new Error('Passkey no encontrado o no pertenece al usuario');
    }

    const verification = await verifyAuthenticationResponse({
      response: respuesta,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: passkey.credential_id,
        credentialPublicKey: passkey.public_key,
        counter: passkey.sign_count
      }
    });

    if (!verification.verified) {
      throw new Error('Autenticacion fallida');
    }

    // Actualizar contador
    await passkeyRepositorio.actualizarSignCount(passkey.credential_id, verification.authenticationInfo.newCounter);

    // Limpiar challenge
    delete global.challenges[correo];

    // Generar tokens
    const tokenSesion = this._generarTokenSesion(usuario);
    const refreshToken = crypto.randomBytes(32).toString('hex');

    await passkeyRepositorio.guardarSesion(
      usuario.usuario_id,
      crypto.createHash('sha256').update(refreshToken).digest('hex'),
      passkey.nombre_dispositivo || 'Dispositivo',
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

  // ═════════════════════════════════════════════════════════════════
  // RECUPERACION: Generar magic link
  // ═════════════════════════════════════════════════════════════════
  async generarMagicLink(correo) {
    const usuario = await passkeyRepositorio.buscarUsuarioPorCorreo(correo);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiraEn = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await passkeyRepositorio.guardarMagicLink(usuario.usuario_id, tokenHash, expiraEn);

    return {
      token,
      tokenHash,
      expiraEn
    };
  }

  // ═════════════════════════════════════════════════════════════════
  // RECUPERACION: Verificar magic link
  // ═════════════════════════════════════════════════════════════════
  async verificarMagicLink(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const magicLink = await passkeyRepositorio.buscarMagicLink(tokenHash);

    if (!magicLink) {
      throw new Error('Link invalido o expirado');
    }

    await passkeyRepositorio.marcarMagicLinkUsado(magicLink.id);

    return {
      usuario_id: magicLink.usuario_id,
      correo: magicLink.correo_electronico
    };
  }

  // ═════════════════════════════════════════════════════════════════
  // UTILIDAD: Generar token JWT
  // ═════════════════════════════════════════════════════════════════
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
