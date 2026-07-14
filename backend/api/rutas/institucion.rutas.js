const express = require('express');
const router = express.Router();
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');
const { requerirRol } = require('../middleware/rbac');
const { 
  listarInstituciones, 
  obtenerInstitucion,
  crearInstitucion, 
  editarInstitucion,
  eliminarInstitucion 
} = require('../controladores/institucion.controlador');

// Todas las rutas requieren autenticacion
router.use(middlewareAutenticar);

// Listar (cualquier usuario autenticado ve las suyas, superadmin ve todas)
router.get('/', listarInstituciones);

// Obtener una institucion por ID
router.get('/:institucion_id', obtenerInstitucion);

// Crear (solo superadmin)
router.post('/', requerirRol('superadmin'), crearInstitucion);

// Editar (superadmin o creador)
router.put('/:institucion_id', editarInstitucion);

// Eliminar soft (superadmin o creador)
router.delete('/:institucion_id', eliminarInstitucion);

module.exports = router;
