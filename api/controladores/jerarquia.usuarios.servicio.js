const repositorio = require('./jerarquia.usuarios.repositorio');
const { ErrorValidacion, ErrorAutorizacion, ErrorNoEncontrado, ErrorConflicto } = require('../errores/AppError');
const firebaseSync = require('../servicios/firebase.sync.servicio');

class JerarquiaUsuariosServicio {

  // ============================================
  // CREAR USUARIO HIJO - CON INSTITUCION, SALON Y SUSCRIPCION
  // ============================================
  async crearUsuarioHijo(datosEntrada, contexto) {
    const {
      email, nombre_rol, nombre_completo, nivel_jerarquico,
      superior_inmediato_id, superiores_adicionales,
      capacidades_ids, puede_crear_hijos,
      institucion_id, salon_ids,
      tipo_plan, duracion_dias, monto_pagado, fecha_vencimiento,
      comprobante_url, notas_pago,
      carrera_interes, cursos_enseña, nivel_academico,
      numero_celular, fecha_nacimiento, direccion, distrito,
      observaciones, etiquetas
    } = datosEntrada;

    const { 
      membresia_id: creador_membresia_id, 
      usuario_id: creador_usuario_id, 
      institucion_id: ctx_institucion_id 
    } = contexto;

    if (!email || !nombre_rol || nivel_jerarquico === undefined || !superior_inmediato_id) {
      throw new ErrorValidacion('Email, nombre_rol, nivel_jerarquico y superior_inmediato_id son obligatorios', 'CAMPOS_INCOMPLETOS');
    }

    const institucion_final = institucion_id || ctx_institucion_id;
    if (!institucion_final) {
      throw new ErrorValidacion('institucion_id requerido', 'SIN_INSTITUCION');
    }

    const tienePoder = await repositorio.verificarCapacidadCrearUsuarios(creador_membresia_id);
    if (!tienePoder) {
      throw new ErrorAutorizacion('No tienes permiso para crear usuarios', 'SIN_PODER_CREAR');
    }

    const infoCreador = await repositorio.obtenerInfoCreador(creador_membresia_id);
    if (!infoCreador?.puede_crear_hijos) {
      throw new ErrorAutorizacion('Creacion deshabilitada para tu cuenta', 'CREACION_DESHABILITADA');
    }

    const creador_nivel = infoCreador.nivel;

    if (parseInt(nivel_jerarquico) <= creador_nivel) {
      throw new ErrorAutorizacion(
        `El nivel del nuevo usuario (${nivel_jerarquico}) debe ser mayor que el tuyo (${creador_nivel})`,
        'NIVEL_INVALIDO'
      );
    }

    const infoSuperior = await repositorio.obtenerInfoSuperior(superior_inmediato_id, institucion_final);
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

    let uid_firebase = `bootstrap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const usuarioExistente = await repositorio.buscarUsuarioPorCorreo(email);

    if (usuarioExistente) {
      uid_firebase = usuarioExistente.usuario_id;
      if (usuarioExistente.estado_usuario !== 'active') {
        await repositorio.reactivarUsuario(email);
      }
    } else {
      await repositorio.crearUsuarioBootstrap(uid_firebase, email, nombre_completo);
      // Sincronizar con Firebase Auth (servicio independiente)
      await firebaseSync.crearUsuario(uid_firebase, email, nombre_completo);
    }

    await repositorio.actualizarCamposUsuario(uid_firebase, {
      carrera_interes, cursos_enseña, nivel_academico,
      numero_celular, fecha_nacimiento, direccion, distrito,
      observaciones, etiquetas: etiquetas ? JSON.stringify(etiquetas) : '[]'
    });

    const membresiaActiva = await repositorio.buscarMembresiaActiva(uid_firebase, institucion_final);
    if (membresiaActiva) {
      throw new ErrorConflicto('Ya tiene membresia activa', 'MEMBRESIA_EXISTENTE');
    }

    if (capacidades_ids && capacidades_ids.length > 0) {
      const idsCreador = await repositorio.obtenerCapacidadesDelegables(creador_membresia_id, capacidades_ids);
      const idsIlegales = capacidades_ids.filter(id => !idsCreador.includes(id));
      if (idsIlegales.length > 0) {
        throw new ErrorAutorizacion('No puedes delegar capacidades que no posees', 'DELEGACION_ILEGAL', { capacidades_ilegales: idsIlegales });
      }
    }

    const capCrearUsuarios = await repositorio.obtenerCapacidadCrearUsuarios();
    if (capacidades_ids?.includes(capCrearUsuarios)) {
      throw new ErrorAutorizacion('crear_usuarios no delegable directamente', 'CREAR_USUARIOS_NO_DELEGABLE');
    }

    const membresiaExistente = await repositorio.buscarMembresiaPorUsuarioInstitucion(uid_firebase, institucion_final);
    let nueva_membresia_id;

    const datosMembresia = {
      usuario_id: uid_firebase,
      institucion_id: institucion_final,
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

    if (salon_ids && salon_ids.length > 0) {
      for (const salon_id of salon_ids) {
        await repositorio.asignarSalonUsuario(salon_id, nueva_membresia_id, creador_membresia_id, 'miembro');
      }
    }

    let suscripcion_id = null;
    const dias = parseInt(duracion_dias) || 30;
    const monto = parseFloat(monto_pagado) || 0;
    const vencimiento = fecha_vencimiento || new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

    if (monto > 0 || tipo_plan) {
      suscripcion_id = await repositorio.crearSuscripcion({
        membresia_id: nueva_membresia_id,
        usuario_id: uid_firebase,
        institucion_id: institucion_final,
        tipo_plan: tipo_plan || 'mensual',
        duracion_dias: dias,
        monto_pagado: monto,
        moneda: 'PEN',
        fecha_inicio: new Date().toISOString(),
        fecha_vencimiento: vencimiento,
        fecha_pago: new Date().toISOString(),
        estado_suscripcion: 'activa',
        comprobante_url: comprobante_url || null,
        comprobante_tipo: comprobante_url ? 'recibo' : null,
        notas_pago: notas_pago || null,
        creado_por_membresia_id: creador_membresia_id
      });
    }

    await repositorio.registrarSuperiorInmediato(superior_inmediato_id, nueva_membresia_id, creador_membresia_id);

    if (superiores_adicionales && superiores_adicionales.length > 0) {
      for (const sup_id of superiores_adicionales) {
        const nivelSup = await repositorio.obtenerNivelSuperior(sup_id);
        if (nivelSup !== null && nivelSup < parseInt(nivel_jerarquico)) {
          await repositorio.registrarSuperiorAdicional(sup_id, nueva_membresia_id, creador_membresia_id);
        }
      }
    }

    if (capacidades_ids && capacidades_ids.length > 0) {
      await repositorio.asignarCapacidades(
        nueva_membresia_id, capacidades_ids,
        creador_membresia_id, creador_usuario_id, creador_nivel
      );
    }

    await repositorio.registrarLog(
      'crear_usuario', creador_membresia_id, creador_usuario_id,
      nueva_membresia_id, uid_firebase,
      {
        nombre_rol, nivel: nivel_jerarquico, superior_inmediato_id,
        superiores_adicionales: superiores_adicionales || [],
        capacidades_ids: capacidades_ids || [],
        puede_crear_hijos: puede_crear_hijos || false,
        institucion_id: institucion_final,
        salon_ids: salon_ids || [],
        suscripcion_id,
        monto_pagado: monto,
        fecha_vencimiento: vencimiento
      }
    );

    return {
      membresia_id: nueva_membresia_id,
      usuario_id: uid_firebase,
      email,
      nombre_rol,
      nivel: nivel_jerarquico,
      superior_inmediato_id,
      puede_crear_hijos: puede_crear_hijos || false,
      salon_ids: salon_ids || [],
      suscripcion_id,
      dias_restantes: dias,
      fecha_vencimiento: vencimiento,
      creado_en: new Date().toISOString()
    };
  }

  // ============================================
  // OBTENER SUBORDINADOS — SUPERADMIN VE TODOS
  // ============================================
  async obtenerMisSubordinados(membresiaId, institucionId) {
    const infoCreador = await repositorio.obtenerInfoCreador(membresiaId);
    const miNivel = infoCreador?.nivel;

    let subordinados;
    if (miNivel === 0) {
      subordinados = await repositorio.obtenerTodosSubordinadosTodasInstituciones();
    } else {
      subordinados = await repositorio.obtenerTodosSubordinadosInstitucion(institucionId);
    }

    const subordinadosEnriquecidos = await Promise.all(
      subordinados.map(async (sub) => {
        const capacidades = await repositorio.obtenerCapacidadesSubordinado(sub.sub_membresia_id);
        const salones = await repositorio.obtenerSalonesSubordinado(sub.sub_usuario_id, sub.sub_institucion_id || institucionId);
        const diasRestantes = await repositorio.obtenerDiasRestantes(sub.sub_membresia_id);
        const suscripcion = await repositorio.obtenerSuscripcionActiva(sub.sub_membresia_id);
        return { 
          ...sub, 
          capacidades, 
          salones,
          dias_restantes: diasRestantes,
          suscripcion: suscripcion || null
        };
      })
    );

    return { 
      total: subordinadosEnriquecidos.length, 
      subordinados: subordinadosEnriquecidos,
      mi_nivel: miNivel
    };
  }

  // ============================================
  // DESACTIVAR SUBORDINADO
  // ============================================
  async desactivarSubordinado(creadorMembresiaId, creadorUsuarioId, objetivoMembresiaId) {
    if (objetivoMembresiaId === creadorMembresiaId) {
      throw new ErrorAutorizacion('No puedes desactivarte a ti mismo', 'AUTO_DESACTIVACION');
    }

    const infoCreador = await repositorio.obtenerInfoCreador(creadorMembresiaId);
    
    let puedeDesactivar = false;
    if (infoCreador?.nivel === 0) {
      puedeDesactivar = true;
    } else {
      const esSubordinado = await repositorio.esSubordinadoDirecto(creadorMembresiaId, objetivoMembresiaId);
      puedeDesactivar = esSubordinado;
    }

    if (!puedeDesactivar) {
      throw new ErrorAutorizacion('No tienes permiso para desactivar este usuario', 'SIN_PERMISO_DESACTIVAR');
    }

    const infoObjetivo = await repositorio.obtenerInfoMembresia(objetivoMembresiaId);
    if (!infoObjetivo) {
      throw new ErrorNoEncontrado('Membresia objetivo no encontrada', 'MEMBRESIA_NO_ENCONTRADA');
    }

    if (infoObjetivo.nivel === 0) {
      throw new ErrorAutorizacion('No puedes desactivar nivel 0', 'PROTECCION_NIVEL_CERO');
    }

    const objetivoUsuarioId = infoObjetivo.usuario_id;

    await repositorio.suspenderMembresia(objetivoMembresiaId);
    await repositorio.limpiarSuperioresSubordinado(objetivoMembresiaId);
    await repositorio.suspenderUsuario(objetivoUsuarioId);

    await repositorio.registrarLog(
      'desactivar_usuario', creadorMembresiaId, creadorUsuarioId,
      objetivoMembresiaId, objetivoUsuarioId,
      { metodo: 'soft_delete', nivel_previo: infoObjetivo.nivel, sesion_revocada: true }
    );

    return { membresia_id: objetivoMembresiaId, estado: 'suspended' };
  }

  // ============================================
  // CAMBIAR ESTADO
  // ============================================
  async cambiarEstadoSubordinado(creadorMembresiaId, creadorUsuarioId, objetivoMembresiaId, estado) {
    if (objetivoMembresiaId === creadorMembresiaId) {
      throw new ErrorAutorizacion('No puedes modificarte a ti mismo', 'AUTO_MODIFICACION');
    }

    const infoCreador = await repositorio.obtenerInfoCreador(creadorMembresiaId);
    
    let puedeModificar = false;
    if (infoCreador?.nivel === 0) {
      puedeModificar = true;
    } else {
      const esSubordinado = await repositorio.esSubordinadoDirecto(creadorMembresiaId, objetivoMembresiaId);
      puedeModificar = esSubordinado;
    }

    if (!puedeModificar) {
      throw new ErrorAutorizacion('No tienes permiso para cambiar el estado de este usuario', 'SIN_PERMISO');
    }

    const infoObjetivo = await repositorio.obtenerInfoMembresia(objetivoMembresiaId);
    if (!infoObjetivo) {
      throw new ErrorNoEncontrado('Membresia objetivo no encontrada', 'MEMBRESIA_NO_ENCONTRADA');
    }

    if (infoObjetivo.nivel === 0) {
      throw new ErrorAutorizacion('No puedes modificar nivel 0', 'PROTECCION_NIVEL_CERO');
    }

    const objetivoUsuarioId = infoObjetivo.usuario_id;

    if (estado === 'active') {
      await repositorio.reactivarMembresia(objetivoMembresiaId, {
        nombre_rol: infoObjetivo.nombre_rol || 'Miembro',
        nivel: infoObjetivo.nivel,
        padre_membresia_id: infoObjetivo.padre_membresia_id || creadorMembresiaId,
        puede_crear_hijos: infoObjetivo.puede_crear_hijos || false,
        creado_por_usuario_id: creadorUsuarioId,
        creado_por_membresia_id: creadorMembresiaId
      });
      await repositorio.reactivarUsuarioPorId(objetivoUsuarioId);
    } else if (estado === 'suspended') {
      await repositorio.suspenderMembresia(objetivoMembresiaId);
      await repositorio.suspenderUsuario(objetivoUsuarioId);
    }

    await repositorio.registrarLog(
      'cambiar_estado', creadorMembresiaId, creadorUsuarioId,
      objetivoMembresiaId, objetivoUsuarioId,
      { estado_nuevo: estado, nivel_previo: infoObjetivo.nivel }
    );

    return { membresia_id: objetivoMembresiaId, estado };
  }

  // ============================================
  // ELIMINAR USUARIO COMPLETAMENTE - CASCADA
  // ============================================
  async eliminarUsuarioCompleto(creadorMembresiaId, creadorUsuarioId, objetivoMembresiaId) {
    if (objetivoMembresiaId === creadorMembresiaId) {
      throw new ErrorAutorizacion('No puedes eliminarte a ti mismo', 'AUTO_ELIMINACION');
    }

    const infoCreador = await repositorio.obtenerInfoCreador(creadorMembresiaId);
    if (infoCreador?.nivel !== 0) {
      throw new ErrorAutorizacion('Solo superadmin puede eliminar permanentemente', 'SIN_PERMISO_ELIMINAR');
    }

    const infoObjetivo = await repositorio.obtenerInfoMembresia(objetivoMembresiaId);
    if (!infoObjetivo) {
      throw new ErrorNoEncontrado('Membresia objetivo no encontrada', 'MEMBRESIA_NO_ENCONTRADA');
    }

    if (infoObjetivo.nivel === 0) {
      throw new ErrorAutorizacion('No puedes eliminar nivel 0', 'PROTECCION_NIVEL_CERO');
    }

    const objetivoUsuarioId = infoObjetivo.usuario_id;

    // USAR NUEVO MÉTODO DE CASCADA COMPLETA
    const resultado = await repositorio.eliminarUsuarioCompleto(objetivoUsuarioId, objetivoMembresiaId);

    // Sincronizar eliminación con Firebase Auth (servicio independiente)
    await firebaseSync.eliminarUsuario(objetivoUsuarioId);

    await repositorio.registrarLog(
      'eliminar_usuario', creadorMembresiaId, creadorUsuarioId,
      objetivoMembresiaId, objetivoUsuarioId,
      { metodo: 'hard_delete', nivel_previo: infoObjetivo.nivel, usuario_completo: resultado.usuario_completo }
    );

    return { usuario_id: objetivoUsuarioId, eliminado: true, usuario_completo: resultado.usuario_completo };
  }

  // ============================================
  // OBTENER SUPERIORES
  // ============================================
  async obtenerSuperiores(membresiaId) {
    return await repositorio.obtenerSuperioresMembresia(membresiaId);
  }


  // ============================================
  // EDITAR USUARIO (CAMPOS OPCIONALES)
  // ============================================
  async editarUsuario(datosEntrada, contexto) {
    const {
      usuario_id, membresia_id,
      nombre_completo, carrera_interes, nivel_academico,
      numero_celular, observaciones, avatar_url,
      nombre_rol, nivel_jerarquico, superior_inmediato_id, puede_crear_hijos,
      salon_ids
    } = datosEntrada;

    const { membresia_id: creador_membresia_id } = contexto;

    if (!usuario_id && !membresia_id) {
      throw new ErrorValidacion('usuario_id o membresia_id requerido', 'ID_REQUERIDO');
    }

    const infoCreador = await repositorio.obtenerInfoCreador(creador_membresia_id);
    if (infoCreador?.nivel !== 0) {
      throw new ErrorAutorizacion('Solo superadmin puede editar usuarios', 'SIN_PERMISO_EDITAR');
    }

    let uid = usuario_id;
    let mid = membresia_id;
    if (!uid && mid) {
      const info = await repositorio.obtenerInfoMembresia(mid);
      if (!info) throw new ErrorNoEncontrado('Membresia no encontrada', 'MEMBRESIA_NO_ENCONTRADA');
      uid = info.usuario_id;
    }
    if (uid && !mid) {
      // Buscar membresia activa del usuario para obtener el membresia_id
      const info = await repositorio.obtenerInfoMembresiaPorUsuario(uid);
      if (info) mid = info.membresia_id;
    }

    // Actualizar campos de usuario
    const camposUsuario = {};
    if (nombre_completo !== undefined) camposUsuario.nombre_completo = nombre_completo;
    if (carrera_interes !== undefined) camposUsuario.carrera_interes = carrera_interes;
    if (nivel_academico !== undefined) camposUsuario.nivel_academico = nivel_academico;
    if (numero_celular !== undefined) camposUsuario.numero_celular = numero_celular;
    if (observaciones !== undefined) camposUsuario.observaciones = observaciones;
    if (avatar_url !== undefined) camposUsuario.avatar_url = avatar_url;

    let resultadoUsuario = null;
    if (Object.keys(camposUsuario).length > 0) {
      resultadoUsuario = await repositorio.actualizarCamposUsuario(uid, camposUsuario);
    }

    // Actualizar campos de membresia
    const camposMembresia = {};
    if (nombre_rol !== undefined) camposMembresia.nombre_rol = nombre_rol;
    if (nivel_jerarquico !== undefined) camposMembresia.nivel = parseInt(nivel_jerarquico);
    if (superior_inmediato_id !== undefined) camposMembresia.padre_membresia_id = parseInt(superior_inmediato_id);
    if (puede_crear_hijos !== undefined) camposMembresia.puede_crear_hijos = puede_crear_hijos;

    let resultadoMembresia = null;
    if (mid && Object.keys(camposMembresia).length > 0) {
      resultadoMembresia = await repositorio.actualizarCamposMembresia(mid, camposMembresia);
    }

    // Sincronizar salones
    let resultadoSalones = null;
    if (mid && salon_ids !== undefined) {
      await repositorio.sincronizarSalonesMembresia(mid, salon_ids, creador_membresia_id, null);
      resultadoSalones = { salon_ids };
    }

    const camposActualizados = [
      ...Object.keys(camposUsuario),
      ...(resultadoMembresia?.campos || []),
      ...(resultadoSalones ? ['salones'] : [])
    ];

    await repositorio.registrarLog(
      'editar_usuario', creador_membresia_id, contexto.usuario_id,
      mid || null, uid,
      { campos_actualizados: camposActualizados }
    );

    return { 
      usuario_id: uid, 
      membresia_id: mid,
      actualizado: true, 
      campos: camposActualizados,
      usuario: resultadoUsuario,
      membresia: resultadoMembresia
    };
  }
}

module.exports = new JerarquiaUsuariosServicio();
