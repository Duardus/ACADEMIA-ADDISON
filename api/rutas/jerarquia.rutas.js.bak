const express = require('express');
const router = express.Router();
const usuariosControlador = require('../controladores/jerarquia.usuarios.controlador');
const capacidadesControlador = require('../controladores/jerarquia.capacidades.controlador');
const arbolControlador = require('../controladores/jerarquia.arbol.controlador');
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');

// Todas las rutas requieren autenticacion y contexto
router.use(middlewareAutenticar);
router.use(middlewareContexto);

// ============================================
// USUARIOS (jerarquia.usuarios.controlador)
// ============================================

// Crear usuario hijo
router.post('/crear', (req, res) => usuariosControlador.crearUsuarioHijo(req, res));

// Obtener mis subordinados
router.get('/mis-subordinados', (req, res) => usuariosControlador.obtenerMisSubordinados(req, res));

// Cambiar estado de subordinado
router.post('/cambiar-estado/:membresia_id', (req, res) => usuariosControlador.cambiarEstado(req, res));

// Desactivar subordinado
router.delete('/subordinado/:membresia_id', (req, res) => usuariosControlador.desactivarSubordinado(req, res));

// Obtener superiores de una membresia
router.get('/superiores/:membresia_id', (req, res) => usuariosControlador.obtenerSuperiores(req, res));

// ============================================
// CAPACIDADES (jerarquia.capacidades.controlador)
// ============================================

// Obtener capacidades que puedo delegar
router.get('/mis-capacidades', (req, res) => capacidadesControlador.obtenerMisCapacidadesDelegables(req, res));

// Modificar capacidades de subordinado
router.put('/subordinado/:membresia_id/capacidades', (req, res) => capacidadesControlador.modificarCapacidadesSubordinado(req, res));

// Obtener etiquetas de cargo frecuentes
router.get('/etiquetas', (req, res) => capacidadesControlador.obtenerEtiquetasFrecuentes(req, res));

// ============================================
// ARBOL/GRUPOS (jerarquia.arbol.controlador)
// ============================================

// Arbol completo de la institucion
router.get('/arbol-completo', (req, res) => arbolControlador.arbolCompletoInstitucion(req, res));

// Crear grupo colaborativo
router.post('/grupos', (req, res) => arbolControlador.crearGrupoColaborativo(req, res));

module.exports = router;
