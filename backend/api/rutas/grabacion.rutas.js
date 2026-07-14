const express = require('express');
const router = express.Router();
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');
const { requerirRol } = require('../middleware/rbac');
const { iniciarGrabacion, detenerGrabacion, listarGrabaciones, descargarGrabacion } = require('../controladores/grabacion.controlador');

router.post('/iniciar', middlewareAutenticar, middlewareContexto, requerirRol('superadmin', 'director', 'professor'), iniciarGrabacion);
router.post('/detener', middlewareAutenticar, middlewareContexto, requerirRol('superadmin', 'director', 'professor'), detenerGrabacion);
router.get('/', middlewareAutenticar, middlewareContexto, listarGrabaciones);
router.get('/:grabacion_id/descargar', middlewareAutenticar, middlewareContexto, requerirRol('superadmin'), descargarGrabacion);

module.exports = router;
