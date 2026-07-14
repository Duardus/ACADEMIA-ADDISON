// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Servicio de Autenticacion
// Regla Oro 5: Asignacion directa sin invitaciones.
// 404 para no autorizado. Modo fantasma recv-only.
// FIX CRITICO: Siempre retorna la propiedad 'rol' en la respuesta.
// ═══════════════════════════════════════════════════════════════════════════

const { verificarTokenFirebase } = require('../config/firebase');
const usuarioRepositorio = require('../repositorios/usuario.repositorio');
const { ErrorAutenticacion, ErrorValidacion } = require('../utilidades/errores');

async function loginConFirebase(tokenId) {
  if (!tokenId || typeof tokenId !== 'string') {
    throw new ErrorValidacion('Token de Firebase requerido');
  }

  // Verificar token con Firebase
  const resultadoFirebase = await verificarTokenFirebase(tokenId);

  if (!resultadoFirebase.valido) {
    throw new ErrorAutenticacion('Token de Firebase invalido: ' + resultadoFirebase.error);
  }

  const datosFirebase = resultadoFirebase;

  // Buscar usuario en PostgreSQL
  let usuario = await usuarioRepositorio.obtenerPorUid(datosFirebase.uid);

  // Si no existe, crear automaticamente (modo fantasma recv-only)
  if (!usuario) {
    console.log('[AUTH] Usuario nuevo detectado, creando automaticamente:', datosFirebase.email);
    usuario = await usuarioRepositorio.crearDesdeFirebase({
      uid: datosFirebase.uid,
      email: datosFirebase.email,
      nombre: datosFirebase.nombre,
      foto: datosFirebase.foto,
      rol: 'estudiante', // Rol por defecto
    });
  }

  // FIX CRITICO: Asegurar que 'rol' siempre este presente
  if (!usuario.rol) {
    usuario.rol = 'estudiante';
  }

  return {
    exito: true,
    mensaje: 'Autenticacion exitosa',
    datos: {
      usuario: {
        id: usuario.id,
        uid_firebase: usuario.uid_firebase,
        email: usuario.email,
        nombre: usuario.nombre,
        foto_url: usuario.foto_url,
        rol: usuario.rol, // <-- FIX: Siempre retornado
        institucion_id: usuario.institucion_id,
        activo: usuario.activo,
      },
      sesion: {
        autenticado: true,
        proveedor: 'firebase_google',
      },
    },
  };
}

async function obtenerPerfil(uidFirebase) {
  if (!uidFirebase) {
    throw new ErrorValidacion('UID de Firebase requerido');
  }

  const usuario = await usuarioRepositorio.obtenerPorUid(uidFirebase);

  if (!usuario) {
    throw new ErrorAutenticacion('Usuario no encontrado');
  }

  return {
    exito: true,
    mensaje: 'Perfil obtenido',
    datos: {
      id: usuario.id,
      uid_firebase: usuario.uid_firebase,
      email: usuario.email,
      nombre: usuario.nombre,
      foto_url: usuario.foto_url,
      rol: usuario.rol,
      institucion_id: usuario.institucion_id,
      activo: usuario.activo,
      creado_en: usuario.creado_en,
    },
  };
}

module.exports = {
  loginConFirebase,
  obtenerPerfil,
};
