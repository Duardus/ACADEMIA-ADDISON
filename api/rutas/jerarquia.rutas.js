const express = require('express');
const router = express.Router();
const controlador = require('../controladores/jerarquia.controlador');
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');

// Todas las rutas requieren autenticacion y contexto
router.use(middlewareAutenticar);
router.use(middlewareContexto);

// Crear usuario hijo
router.post('/crear', (req, res) => controlador.crearUsuarioHijo(req, res));

// Obtener mis subordinados (reemplaza mis-hijos)
router.get('/mis-subordinados', (req, res) => controlador.obtenerMisSubordinados(req, res));
router.post('/cambiar-estado/:membresia_id', (req, res) => controlador.cambiarEstado(req, res));

// Obtener capacidades que puedo delegar
router.get('/mis-capacidades', (req, res) => controlador.obtenerMisCapacidadesDelegables(req, res));

// Modificar capacidades de subordinado
router.put('/subordinado/:membresia_id/capacidades', (req, res) => controlador.modificarCapacidadesSubordinado(req, res));

// Desactivar subordinado
router.delete('/subordinado/:membresia_id', (req, res) => controlador.desactivarSubordinado(req, res));

// Obtener etiquetas de cargo frecuentes
router.get('/etiquetas', (req, res) => controlador.obtenerEtiquetasFrecuentes(req, res));

// Obtener superiores de una membresia
router.get('/superiores/:membresia_id', (req, res) => controlador.obtenerSuperiores(req, res));

// Arbol completo (solo nivel 0)
router.get('/arbol-completo', (req, res) => controlador.arbolCompletoInstitucion(req, res));

// Grupos colaborativos
router.post('/grupos', (req, res) => controlador.crearGrupoColaborativo(req, res));

module.exports = router;
