const express = require('express');
const router = express.Router();
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');
const { requerirRol } = require('../middleware/rbac');
const { crearUsuario, listarUsuarios } = require('../controladores/usuario.controlador');

router.post('/', middlewareAutenticar, middlewareContexto, requerirRol('superadmin', 'director'), crearUsuario);
router.get('/', middlewareAutenticar, middlewareContexto, requerirRol('superadmin', 'director', 'auxiliary'), listarUsuarios);

module.exports = router;
