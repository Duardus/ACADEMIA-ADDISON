const { obtenerAuth } = require('../configuracion/firebase');
const { generarToken, verificarToken } = require('../utilidades/jwt');
const authRepositorio = require('./auth.repositorio');
const { 
  ErrorValidacion, 
  ErrorAutenticacion, 
  ErrorAutorizacion,
  ErrorNoEncontrado 
} = require('../errores/AppError');

class AuthServicio {

  async verificarTokenFirebase(tokenFirebase) {
    if (!tokenFirebase) {
      throw new ErrorValidacion('Token no proporcionado', 'SIN_TOKEN');
    }

    try {
      const auth = obtenerAuth();
      return await auth.verifyIdToken(tokenFirebase);
    } catch (error) {
      throw new ErrorAutenticacion('Token de Firebase invalido', 'TOKEN_FIREBASE_INVALIDO');
    }
  }

  async autenticarUsuario(uid, correo, nombre) {
    let usuario = await authRepositorio.buscarUsuarioPorCorreo(correo);

    if (usuario) {
      if (usuario.auth_provider === 'bootstrap') {
        await authRepositorio.migrarUsuarioBootstrap(uid, correo);
        usuario = await authRepositorio.buscarUsuarioPorCorreo(correo);
      } else {
        await authRepositorio.actualizarUltimoLogin(correo);
      }
    } else {
      await authRepositorio.crearUsuario(uid, correo, nombre);
      usuario = await authRepositorio.buscarUsuarioPorCorreo(correo);
    }

    return usuario;
  }

  validarEstadoUsuario(usuario) {
    const estados = {
      deleted: { mensaje: 'Tu cuenta ha sido eliminada. Contacta al administrador para matricularte nuevamente.', codigo: 'USUARIO_ELIMINADO' },
      suspended: { mensaje: 'Tu cuenta esta suspendida. Contacta al administrador para renovar tu matricula.', codigo: 'USUARIO_SUSPENDIDO' },
      banned: { mensaje: 'Tu cuenta ha sido bloqueada permanentemente.', codigo: 'BLOQUEADO' }
    };

    if (estados[usuario.estado_usuario]) {
      const e = estados[usuario.estado_usuario];
      throw new ErrorAutorizacion(e.mensaje, e.codigo);
    }
  }

  async obtenerMembresias(usuarioId) {
    const membresias = await authRepositorio.obtenerMembresiasActivas(usuarioId);

    if (membresias.length === 0) {
      const tieneSuspendidas = await authRepositorio.obtenerMembresiasSuspendidas(usuarioId);
      if (tieneSuspendidas) {
        throw new ErrorAutorizacion('Tu membresia esta suspendida. Contacta al administrador para renovar tu matricula.', 'MEMBRESIA_SUSPENDIDA');
      }
      throw new ErrorAutorizacion('No tienes membresia activa. Contacta al administrador para que te asigne una membresia.', 'SIN_MEMBRESIA');
    }

    return membresias;
  }

  generarRespuestaLogin(usuario, membresia, nombre) {
    const tokenSesion = generarToken({
      usuario_id: usuario.usuario_id,
      membresia_id: membresia.membresia_id,
      institucion_id: membresia.institucion_id,
      tipo_rol: membresia.tipo_rol,
      nivel: membresia.nivel,
      correo: usuario.correo_electronico
    });

    return {
      tipo: 'login_directo',
      token_sesion: tokenSesion,
      usuario: {
        nombre: usuario.nombre_completo || nombre,
        correo: usuario.correo_electronico,
        rol: membresia.tipo_rol,
        nivel: membresia.nivel,
        nombre_rol: membresia.nombre_rol,
        avatar: usuario.avatar_url || null
      },
      institucion: {
        id: membresia.institucion_id,
        nombre: membresia.nombre_institucion,
        slug: membresia.institucion_slug
      },
      membresia_id: membresia.membresia_id
    };
  }

  generarRespuestaSelector(usuario, membresias, nombre) {
    const tokenPreliminar = generarToken({ 
      usuario_id: usuario.usuario_id, 
      correo: usuario.correo_electronico 
    });

    return {
      tipo: 'selector_requerido',
      token_preliminar: tokenPreliminar,
      usuario: {
        nombre: usuario.nombre_completo || nombre,
        correo: usuario.correo_electronico,
        avatar: usuario.avatar_url || null
      },
      membresias: membresias.map(m => ({
        membresia_id: m.membresia_id,
        institucion_id: m.institucion_id,
        nombre_institucion: m.nombre_institucion,
        slug: m.institucion_slug,
        rol: m.tipo_rol,
        nivel: m.nivel,
        nombre_rol: m.nombre_rol
      }))
    };
  }

  async login(tokenFirebase) {
    const decoded = await this.verificarTokenFirebase(tokenFirebase);
    const usuario = await this.autenticarUsuario(decoded.uid, decoded.email, decoded.name || 'Usuario');
    
    this.validarEstadoUsuario(usuario);
    
    const membresias = await this.obtenerMembresias(usuario.usuario_id);

    if (membresias.length === 1) {
      return this.generarRespuestaLogin(usuario, membresias[0], decoded.name || 'Usuario');
    }

    return this.generarRespuestaSelector(usuario, membresias, decoded.name || 'Usuario');
  }

  async seleccionarContexto(tokenPreliminar, membresiaId) {
    if (!tokenPreliminar || !membresiaId) {
      throw new ErrorValidacion('token_preliminar y membresia_id requeridos', 'CAMPOS_INCOMPLETOS');
    }

    const payload = verificarToken(tokenPreliminar);
    const membresia = await authRepositorio.obtenerMembresiaPorId(membresiaId, payload.usuario_id);

    if (!membresia) {
      throw new ErrorNoEncontrado('Membresia', 'MEMBRESIA_NO_ENCONTRADA');
    }

    return this.generarRespuestaLogin(
      { usuario_id: payload.usuario_id, correo_electronico: payload.correo }, 
      membresia, 
      payload.nombre || 'Usuario'
    );
  }

  async switchContext(usuarioId, membresiaId) {
    const membresia = await authRepositorio.obtenerMembresiaPorId(membresiaId, usuarioId);

    if (!membresia) {
      throw new ErrorNoEncontrado('Membresia', 'MEMBRESIA_NO_ENCONTRADA');
    }

    const tokenSesion = generarToken({
      usuario_id: usuarioId,
      membresia_id: membresia.membresia_id,
      institucion_id: membresia.institucion_id,
      tipo_rol: membresia.tipo_rol,
      nivel: membresia.nivel
    });

    return {
      token_sesion: tokenSesion,
      institucion: {
        id: membresia.institucion_id,
        nombre: membresia.nombre_institucion,
        slug: membresia.institucion_slug
      },
      rol: membresia.tipo_rol,
      nivel: membresia.nivel,
      nombre_rol: membresia.nombre_rol
    };
  }
}

module.exports = new AuthServicio();
