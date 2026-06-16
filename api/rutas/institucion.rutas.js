const express = require('express');
const router = express.Router();
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');
const { requerirRol } = require('../middleware/rbac');
const { crearInstitucion, listarInstituciones } = require('../controladores/institucion.controlador');

router.post('/', middlewareAutenticar, requerirRol('superadmin'), crearInstitucion);
router.get('/', middlewareAutenticar, listarInstituciones);

module.exports = router;
