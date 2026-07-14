const express = require('express');
const router = express.Router();
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');
const { requerirRol } = require('../middleware/rbac');
const { listarTeorias, crearTeoria, actualizarTeoria } = require('../controladores/teoria.controlador');

router.get('/', middlewareAutenticar, middlewareContexto, listarTeorias);
router.post('/', middlewareAutenticar, middlewareContexto, requerirRol('superadmin', 'director', 'professor'), crearTeoria);
router.put('/:teoria_id', middlewareAutenticar, middlewareContexto, requerirRol('superadmin', 'director', 'professor'), actualizarTeoria);

module.exports = router;
