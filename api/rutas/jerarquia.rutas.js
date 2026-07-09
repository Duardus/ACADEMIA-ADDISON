const express = require('express');
const router = express.Router();
const usuariosControlador = require('../controladores/jerarquia.usuarios.controlador');
const capacidadesControlador = require('../controladores/jerarquia.capacidades.controlador');
const arbolControlador = require('../controladores/jerarquia.arbol.controlador');
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');

router.use(middlewareAutenticar);
router.use(middlewareContexto);

// USUARIOS
router.post('/crear', (req, res, next) => usuariosControlador.crearUsuarioHijo(req, res, next));
router.get('/mis-subordinados', (req, res, next) => usuariosControlador.obtenerMisSubordinados(req, res, next));
router.post('/cambiar-estado/:membresia_id', (req, res, next) => usuariosControlador.cambiarEstado(req, res, next));
router.delete('/subordinado/:membresia_id', (req, res, next) => usuariosControlador.desactivarSubordinado(req, res, next));
router.delete('/subordinado/:membresia_id/eliminar', (req, res, next) => usuariosControlador.eliminarUsuarioCompleto(req, res, next));
router.get('/superiores/:membresia_id', (req, res, next) => usuariosControlador.obtenerSuperiores(req, res, next));

// CAPACIDADES
router.get('/mis-capacidades', (req, res, next) => capacidadesControlador.obtenerMisCapacidadesDelegables(req, res, next));
router.put('/subordinado/:membresia_id/capacidades', (req, res, next) => capacidadesControlador.modificarCapacidadesSubordinado(req, res, next));
router.get('/etiquetas', (req, res, next) => capacidadesControlador.obtenerEtiquetasFrecuentes(req, res, next));

// ARBOL
router.get('/arbol-completo', (req, res, next) => arbolControlador.arbolCompletoInstitucion(req, res, next));
router.post('/grupos', (req, res, next) => arbolControlador.crearGrupoColaborativo(req, res, next));

module.exports = router;
