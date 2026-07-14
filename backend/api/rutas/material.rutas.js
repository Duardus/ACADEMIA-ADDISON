const express = require('express');
const router = express.Router();
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');
const { requerirRol } = require('../middleware/rbac');
const { listarMateriales, crearMaterial } = require('../controladores/material.controlador');

router.get('/', middlewareAutenticar, middlewareContexto, listarMateriales);
router.post('/', middlewareAutenticar, middlewareContexto, requerirRol('superadmin', 'director', 'professor'), crearMaterial);

module.exports = router;
