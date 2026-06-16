const express = require('express');
const router = express.Router();
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');
const { requerirRol } = require('../middleware/rbac');
const { listarExamenes, crearExamen, publicarExamen, cerrarExamen } = require('../controladores/examen.controlador');

router.get('/', middlewareAutenticar, middlewareContexto, listarExamenes);
router.post('/', middlewareAutenticar, middlewareContexto, requerirRol('superadmin', 'director', 'professor'), crearExamen);
router.post('/:examen_id/publicar', middlewareAutenticar, middlewareContexto, requerirRol('superadmin', 'director', 'professor'), publicarExamen);
router.post('/:examen_id/cerrar', middlewareAutenticar, middlewareContexto, requerirRol('superadmin', 'director', 'professor'), cerrarExamen);

module.exports = router;
