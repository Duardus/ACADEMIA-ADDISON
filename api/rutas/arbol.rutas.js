const express = require('express');
const router = express.Router();
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');
const { requerirRol } = require('../middleware/rbac');
const { obtenerArbol, crearGrupo, crearCurso } = require('../controladores/arbol.controlador');

router.get('/', middlewareAutenticar, middlewareContexto, obtenerArbol);
router.post('/grupos', middlewareAutenticar, middlewareContexto, requerirRol('superadmin', 'director'), crearGrupo);
router.post('/cursos', middlewareAutenticar, middlewareContexto, requerirRol('superadmin', 'director'), crearCurso);

module.exports = router;
