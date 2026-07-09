const repositorio = require('./jerarquia.usuarios.repositorio');
const { ErrorValidacion, ErrorAutorizacion, ErrorNoEncontrado, ErrorConflicto } = require('../errores/AppError');

class JerarquiaUsuariosServicio {

  // ============================================
  // CREAR USUARIO HIJO
  // ============================================
  async crearUsuarioHijo(datosEntrada, contexto) {
    const {
      email, nombre_rol, nombre_completo, nivel_jerarquico,
      superior_inmediato_id, superiores_adicionales,
      capacidades_ids, puede_crear_hijos
    } = datosEntrada;

    const { membresia_id: creador_membresia_id, usuario_id: creador_usuario_id, institucion_id } = contexto;

    // Validaciones de campos
    if (!email || !nombre_rol || nivel_jerarquico === undefined || !superior_inmediato_id) {
      throw new ErrorValidacion('Email, nombre_rol, nivel_jerarquico y superior_inmediato_id son obligatorios', 'CAMPOS_INCOMPLETOS');
    }

    // Verificar capacidad de crear usuarios
    const tienePoder = await repositorio.verificarCapacidadCrearUsuarios(creador_membresia_id);
    if (!tienePoder) {
      throw new ErrorAutorizacion('No tienes permiso para crear usuarios', 'SIN_PODER_CREAR');
    }

    // Verificar que puede crear hijos
    const infoCreador = await repositorio.obtenerInfoCreador(creador_membresia_id);
    if (!infoCreador?.puede_crear_hijos) {
      throw new ErrorAutorizacion('Creacion deshabilitada para tu cuenta', 'CREACION_DESHABILITADA');
    }

    const creador_nivel = infoCreador.nivel;

    // REGLA: Nuevo usuario debe tener nivel MAYOR que creador
    if (parseInt(nivel_jerarquico) <= creador_nivel) {
      throw new ErrorAutorizacion(
        `El nivel del nuevo usuario (${nivel_jerarquico}) debe ser mayor que el tuyo (${creador_nivel})`,
        'NIVEL_INVALIDO'
      );
    }

    // REGLA: Superior inmediato debe existir y tener nivel MENOR
    const infoSuperior = await repositorio.obtenerInfoSuperior(superior_inmediato_id, institucion_id);
    if (!infoSuperior) {
      throw new ErrorNoEncontrado('Superior inmediato no encontrado', 'SUPERIOR_NO_EXISTE');
    }
    if (infoSuperior.estado_membresia !== 'active') {
      throw new ErrorAutorizacion('Superior inmediato no esta activo', 'SUPERIOR_INACTIVO');
    }
    if (infoSuperior.nivel >= parseInt(nivel_jerarquico)) {
      throw new ErrorAutorizacion(
        `El superior (${infoSuperior.nivel}) debe tener nivel menor que el nuevo (${nivel_jerarquico})`,
        'SUPERIOR_NIVEL_INVALIDO'
      );
    }

    // Pre-registro usuario
    let uid_firebase = `bootstrap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const usuarioExistente = await repositorio.buscarUsuarioPorCorreo(email);

    if (usuarioExistente) {
      uid_firebase = usuarioExistente.usuario_id;
      if (usuarioExistente.estado_usuario !== 'active') {
        await repositorio.reactivarUsuario(email);
      }
    } else {
      await repositorio.crearUsuarioBootstrap(uid_firebase, email, nombre_completo);
    }

    // Verificar membresia activa existente
    const membresiaActiva = await repositorio.buscarMembresiaActiva(uid_firebase, institucion_id);
    if (membresiaActiva) {
      throw new ErrorConflicto('Ya tiene membresia activa', 'MEMBRESIA_EXISTENTE');
    }

    // Validar capacidades delegables
    if (capacidades_ids && capacidades_ids.length > 0) {
      const idsCreador = await repositorio.obtenerCapacidadesDelegables(creador_membresia_id, capacidades_ids);
      const idsIlegales = capacidades_ids.filter(id => !idsCreador.includes(id));
      if (idsIlegales.length > 0) {
        throw new ErrorAutorizacion('No puedes delegar capacidades que no posees', 'DELEGACION_ILEGAL', { capacidades_ilegales: idsIlegales });
      }
    }

    // No permitir delegar 'crear_usuarios'
    const capCrearUsuarios = await repositorio.obtenerCapacidadCrearUsuarios();
    if (capacidades_ids?.includes(capCrearUsuarios)) {
      throw new ErrorAutorizacion('crear_usuarios no delegable directamente', 'CREAR_USUARIOS_NO_DELEGABLE');
    }

    // Crear o reactivar membresia
    const membresiaExistente = await repositorio.buscarMembresiaPorUsuarioInstitucion(uid_firebase, institucion_id);
    let nueva_membresia_id;

    const datosMembresia = {
      usuario_id: uid_firebase,
      institucion_id,
      tipo_rol: 'miembro',
      nombre_rol,
      nivel: nivel_jerarquico,
      padre_membresia_id: superior_inmediato_id,
      puede_crear_hijos: puede_crear_hijos || false,
      creado_por_usuario_id: creador_usuario_id,
      creado_por_membresia_id: creador_membresia_id,
      estado_membresia: 'active'
    };

    if (membresiaExistente) {
      nueva_membresia_id = membresiaExistente.membresia_id;
      await repositorio.reactivarMembresia(nueva_membresia_id, datosMembresia);
      await repositorio.limpiarCapacidadesMembresia(nueva_membresia_id);
      await repositorio.limpiarSuperioresSubordinado(nueva_membresia_id);
    } else {
      nueva_membresia_id = await repositorio.crearMembresia(datosMembresia);
    }

    // Registrar superior inmediato
    await repositorio.registrarSuperiorInmediato(superior_inmediato_id, nueva_membresia_id, creador_membresia_id);

    // Registrar superiores adicionales
    if (superiores_adicionales && superiores_adicionales.length > 0) {
      for (const sup_id of superiores_adicionales) {
        const nivelSup = await repositorio.obtenerNivelSuperior(sup_id);
        if (nivelSup !== null && nivelSup < parseInt(nivel_jerarquico)) {
          await repositorio.registrarSuperiorAdicional(sup_id, nueva_membresia_id, creador_membresia_id);
        }
      }
    }

    // Asignar capacidades (BUG 08P01 CORREGIDO: protegido en repositorio)
    if (capacidades_ids && capacidades_ids.length > 0) {
      await repositorio.asignarCapacidades(
        nueva_membresia_id, capacidades_ids,
        creador_membresia_id, creador_usuario_id, creador_nivel
      );
    }

    // Log
    await repositorio.registrarLog(
      'crear_usuario', creador_membresia_id, creador_usuario_id,
      nueva_membresia_id, uid_firebase,
      {
        nombre_rol, nivel: nivel_jerarquico, superior_inmediato_id,
        superiores_adicionales: superiores_adicionales || [],
        capacidades_ids: capacidades_ids || [],
        puede_crear_hijos: puede_crear_hijos || false,
        institucion_id
      }
    );

    return {
      membresia_id: nueva_membresia_id,
      usuario_id: uid_firebase,
      email,
      nombre_rol,
      nivel: nivel_jerarquico,
      superior_inmediato_id,
      puede_crear_hijos: puede_crear_hijos || false
    };
  }

  // ============================================
  // OBTENER SUBORDINADOS
  // ============================================
  async obtenerMisSubordinados(membresiaId, institucionId) {
    const infoCreador = await repositorio.obtenerInfoCreador(membresiaId);
    const miNivel = infoCreador?.nivel;

    let subordinados;
    if (miNivel === 0) {
      subordinados = await repositorio.obtenerTodosSubordinadosInstitucion(institucionId);
    } else {
      subordinados = await repositorio.obtenerSubordinadosPorMembresia(membresiaId);
    }

    // Enriquecer con capacidades
    const subordinadosConCapacidades = await Promise.all(
      subordinados.map(async (sub) => {
        const capacidades = await repositorio.obtenerCapacidadesSubordinado(sub.sub_membresia_id);
        return { ...sub, capacidades };
      })
    );

    return { total: subordinadosConCapacidades.length, subordinados: subordinadosConCapacidades };
  }

  // ============================================
  // DESACTIVAR SUBORDINADO
  // ============================================
  async desactivarSubordinado(creadorMembresiaId, creadorUsuarioId, objetivoMembresiaId) {
    // Proteccion: no auto-desactivacion
    if (objetivoMembresiaId === creadorMembresiaId) {
      throw new ErrorAutorizacion('No puedes desactivarte a ti mismo', 'AUTO_DESACTIVACION');
    }

    // Verificar subordinancia
    const esSubordinado = await repositorio.esSubordinadoDirecto(creadorMembresiaId, objetivoMembresiaId);
    if (!esSubordinado) {
      throw new ErrorAutorizacion('No es tu subordinado', 'NO_ES_SUBORDINADO');
    }

    const infoObjetivo = await repositorio.obtenerInfoMembresia(objetivoMembresiaId);
    if (!infoObjetivo) {
      throw new ErrorNoEncontrado('Membresia objetivo no encontrada', 'MEMBRESIA_NO_ENCONTRADA');
    }

    // Proteccion: no desactivar nivel 0
    if (infoObjetivo.nivel === 0) {
      throw new ErrorAutorizacion('No puedes desactivar nivel 0', 'PROTECCION_NIVEL_CERO');
    }

    const objetivoUsuarioId = infoObjetivo.usuario_id;

    // Ejecutar desactivacion
    await repositorio.suspenderMembresia(objetivoMembresiaId);
    await repositorio.limpiarSuperioresSubordinado(objetivoMembresiaId);
    await repositorio.suspenderUsuario(objetivoUsuarioId);

    // Log
    await repositorio.registrarLog(
      'desactivar_usuario', creadorMembresiaId, creadorUsuarioId,
      objetivoMembresiaId, objetivoUsuarioId,
      { metodo: 'soft_delete', nivel_previo: infoObjetivo.nivel, sesion_revocada: true }
    );

    return { membresia_id: objetivoMembresiaId };
  }

  // ============================================
  // OBTENER SUPERIORES
  // ============================================
  async obtenerSuperiores(membresiaId) {
    return await repositorio.obtenerSuperioresMembresia(membresiaId);
  }
}

module.exports = new JerarquiaUsuariosServicio();
