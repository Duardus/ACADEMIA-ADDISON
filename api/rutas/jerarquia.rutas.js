const express = require('express');
const router = express.Router();
const jerarquiaControlador = require('../controladores/jerarquia.controlador');
const jerarquiaMiddleware = require('../middleware/jerarquia.middleware');
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');

router.use(middlewareAutenticar);
router.use(middlewareContexto);

router.post('/crear', jerarquiaMiddleware.verificarPuedeCrearUsuarios(), jerarquiaControlador.crearUsuarioHijo);
router.get('/mis-hijos', jerarquiaControlador.obtenerMisHijos);
router.get('/mis-capacidades', jerarquiaControlador.obtenerMisCapacidades);
router.get('/capacidades-delegables', jerarquiaControlador.capacidadesDisponiblesParaDelegar);
router.put('/:membresia_id/capacidades', jerarquiaMiddleware.verificarEsDescendiente(), jerarquiaMiddleware.verificarNoAutoModificacion(), jerarquiaControlador.modificarCapacidadesHijo);
router.delete('/:membresia_id', jerarquiaMiddleware.verificarEsDescendiente(), jerarquiaMiddleware.verificarNoAutoModificacion(), jerarquiaControlador.eliminarHijo);
router.get('/arbol-completo', jerarquiaMiddleware.verificarSuperadmin(), jerarquiaControlador.arbolCompletoInstitucion);

module.exports = router;
