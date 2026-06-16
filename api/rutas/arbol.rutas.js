const express = require('express');
const router = express.Router();
const { obtenerArbol, crearGrupo, crearCurso, crearTema, crearSubtema, actualizar, eliminar } = require('../controladores/arbol.controlador');
const { verificarToken } = require('../utilidades/jwt');

function autenticar(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token requerido' });
    const token = authHeader.split(' ')[1];
    const payload = verificarToken(token);
    req.usuario_id = payload.usuario_id;
    req.institucion_id = payload.institucion_id;
    req.tipo_rol = payload.tipo_rol;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

router.get('/', autenticar, obtenerArbol);
router.post('/grupos', autenticar, crearGrupo);
router.post('/cursos', autenticar, crearCurso);
router.post('/temas', autenticar, crearTema);
router.post('/subtemas', autenticar, crearSubtema);
router.put('/:tipo/:id', autenticar, actualizar);
router.delete('/:tipo/:id', autenticar, eliminar);

module.exports = router;
