const repositorio = require('./jerarquia.capacidades.repositorio');
const { ErrorValidacion, ErrorAutorizacion, ErrorNoEncontrado } = require('../errores/AppError');

class JerarquiaCapacidadesServicio {

  async obtenerMisCapacidadesDelegables(membresiaId) {
    const capacidades = await repositorio.obtenerCapacidadesDelegables(membresiaId);
    const puedeCrear = await repositorio.obtenerPuedeCrearHijos(membresiaId);
    return { puede_crear_hijos: puedeCrear, capacidades_delegables: capacidades };
  }

  async modificarCapacidadesSubordinado(creadorMembresiaId, creadorUsuarioId, objetivoMembresiaId, capacidadesIds, puedeCrearHijos) {
    // Proteccion: no auto-modificacion
    if (objetivoMembresiaId === creadorMembresiaId) {
      throw new ErrorAutorizacion('No puedes modificarte a ti mismo', 'AUTO_MODIFICACION');
    }

    // Verificar subordinancia
    const esSubordinado = await repositorio.esSubordinadoDirecto(creadorMembresiaId, objetivoMembresiaId);
    if (!esSubordinado) {
      throw new ErrorAutorizacion('No es tu subordinado', 'NO_ES_SUBORDINADO');
    }

    // Verificar niveles
    const niveles = await repositorio.obtenerNiveles([creadorMembresiaId, objetivoMembresiaId]);
    const nivelCreador = niveles[creadorMembresiaId];
    const nivelObjetivo = niveles[objetivoMembresiaId];

    if (nivelCreador === undefined || nivelObjetivo === undefined) {
      throw new ErrorNoEncontrado('Membresia no encontrada', 'MEMBRESIA_NO_ENCONTRADA');
    }

    if (nivelCreador >= nivelObjetivo) {
      throw new ErrorAutorizacion(
        'No puedes modificar a alguien de nivel igual o superior',
        'NIVEL_INSUFICIENTE'
      );
    }

    // Validar capacidades
    if (capacidadesIds && capacidadesIds.length > 0) {
      const idsCreador = await repositorio.obtenerCapacidadesDelCreador(creadorMembresiaId, capacidadesIds);
      const idsIlegales = capacidadesIds.filter(id => !idsCreador.includes(id));
      if (idsIlegales.length > 0) {
        throw new ErrorAutorizacion(
          'No puedes asignar capacidades que no posees',
          'ASIGNACION_ILEGAL',
          { capacidades_ilegales: idsIlegales }
        );
      }
    }

    // Obtener nivel del creador para asignacion
    const creadorNivel = await repositorio.obtenerNivelMembresia(creadorMembresiaId);

    // Ejecutar cambios
    await repositorio.limpiarCapacidadesSubordinado(objetivoMembresiaId);

    if (capacidadesIds && capacidadesIds.length > 0) {
      await repositorio.asignarCapacidades(
        objetivoMembresiaId, capacidadesIds,
        creadorMembresiaId, creadorUsuarioId, creadorNivel
      );
    }

    if (puedeCrearHijos !== undefined) {
      await repositorio.actualizarPuedeCrearHijos(objetivoMembresiaId, puedeCrearHijos);
    }

    // Log
    await repositorio.registrarLog(
      'modificar_capacidades', creadorMembresiaId, creadorUsuarioId, objetivoMembresiaId,
      { nuevas_capacidades: capacidadesIds, puede_crear_hijos: puedeCrearHijos }
    );

    return {
      membresia_id: objetivoMembresiaId,
      capacidades_asignadas: capacidadesIds?.length || 0
    };
  }

  async obtenerEtiquetasFrecuentes(institucionId) {
    if (!institucionId) {
      throw new ErrorValidacion('Sin institucion', 'SIN_INSTITUCION');
    }
    return await repositorio.obtenerEtiquetasFrecuentes(institucionId);
  }
}

module.exports = new JerarquiaCapacidadesServicio();
