const express = require('express');
const router = express.Router();
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');
const {
  listarSalones, obtenerSalon, crearSalon, editarSalon, eliminarSalon,
  asignarUsuario, quitarUsuario, asignarCurso, quitarCurso,
  listarUsuariosDisponibles, listarCursosDisponibles
} = require('../controladores/salones.controlador');

router.use(middlewareAutenticar);
router.use(middlewareContexto);

// CRUD salones
router.get('/', listarSalones);
router.get('/:salon_id', obtenerSalon);
router.post('/', crearSalon);
router.put('/:salon_id', editarSalon);
router.delete('/:salon_id', eliminarSalon);

// Listar disponibles por institucion
router.get('/usuarios/disponibles', listarUsuariosDisponibles);
router.get('/cursos/disponibles', listarCursosDisponibles);

// Gestion usuarios en salon
router.post('/:salon_id/usuarios', asignarUsuario);
router.delete('/:salon_id/usuarios/:membresia_id', quitarUsuario);

// Gestion cursos en salon
router.post('/:salon_id/cursos', asignarCurso);
router.delete('/:salon_id/cursos/:curso_id', quitarCurso);

module.exports = router;
