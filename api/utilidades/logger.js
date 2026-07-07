/* ============================================
   📝 LOGGER ESTRUCTURADO
   Logging con formato JSON para producción
   Sin dependencias externas
   ============================================ */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Genera un ID único para trazabilidad
 */
function generarRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Formatea un log entry
 */
function formatearLog(nivel, mensaje, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    nivel,
    mensaje,
    ...meta
  };
  
  if (isProduction) {
    // En producción: JSON para parsing automático
    console.log(JSON.stringify(entry));
  } else {
    // En desarrollo: formato legible
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    console.log(`[${entry.timestamp}] ${nivel.padEnd(7)} │ ${mensaje} ${metaStr}`);
  }
}

const logger = {
  info: (mensaje, meta) => formatearLog('INFO', mensaje, meta),
  warn: (mensaje, meta) => formatearLog('WARN', mensaje, meta),
  error: (mensaje, meta) => formatearLog('ERROR', mensaje, meta),
  debug: (mensaje, meta) => {
    if (!isProduction) formatearLog('DEBUG', mensaje, meta);
  },
  
  // Logger específico para requests HTTP
  request: (req, meta = {}) => {
    const requestId = req.requestId || generarRequestId();
    req.requestId = requestId;
    formatearLog('REQUEST', `${req.method} ${req.path}`, {
      requestId,
      ip: req.ip,
      usuario: req.usuario_autenticado?.usuario_id || 'anonimo',
      ...meta
    });
    return requestId;
  },
  
  // Logger para respuestas
  response: (req, res, duracionMs, meta = {}) => {
    formatearLog('RESPONSE', `${req.method} ${req.path} ${res.statusCode}`, {
      requestId: req.requestId,
      duracion_ms: duracionMs,
      ...meta
    });
  }
};

module.exports = { logger, generarRequestId };
