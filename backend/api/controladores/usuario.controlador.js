const usuarioServicio = require('../servicios/usuario.servicio');
const { exito, respuestaError, paginado } = require('../utilidades/respuesta');

async function listar(req, res, next) {
  try {
    const pagina = parseInt(req.query.pagina, 10) || 1;
    const porPagina = parseInt(req.query.por_pagina, 10) || 20;
    const institucionId = req.query.institucion_id || null;
    const resultado = await usuarioServicio.listarUsuarios(institucionId, pagina, porPagina);
    res.status(200).json(paginado(resultado.usuarios, pagina, porPagina, resultado.total));
  } catch (err) {
    next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const { id } = req.params;
    const usuario = await usuarioServicio.obtenerUsuario(id);
    res.status(200).json(exito(usuario, 'Usuario obtenido'));
  } catch (err) {
    next(err);
  }
}

async function actualizarRol(req, res, next) {
  try {
    const { id } = req.params;
    const { rol } = req.body;
    if (!rol) {
      return res.status(400).json(respuestaError('Rol requerido', 400));
    }
    const usuario = await usuarioServicio.actualizarRol(id, rol);
    res.status(200).json(exito(usuario, 'Rol actualizado'));
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtener, actualizarRol };
