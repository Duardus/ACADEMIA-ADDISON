const express = require('express');
const router = express.Router();
const { generarDocumentacionViva } = require('../controladores/docs.controlador');

// Documentacion viva - publica, no requiere auth
router.get('/', generarDocumentacionViva);

module.exports = router;
