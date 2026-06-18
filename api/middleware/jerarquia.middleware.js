const { consulta } = require('../configuracion/base_de_datos');

class JerarquiaMiddleware {
  verificarCapacidad(capacidadCodigo) {
    return async (req, res, next) => {
      try {
        const membresia_id = req.contexto_institucion?.membresia_id;
        if (!membresia_id) return res.status(401).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
        const resultado = await consulta(`SELECT 1 FROM membresia_capacidades mc INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id WHERE mc.membresia_id = $1 AND c.codigo = $2`, [membresia_id, capacidadCodigo]);
        if (resultado.rows.length === 0) return res.status(403).json({ error: `Capacidad requerida: ${capacidadCodigo}`, codigo: 'CAPACIDAD_REQUERIDA' });
        next();
      } catch (error) { res.status(500).json({ error: 'Error', codigo: 'ERROR_VERIFICACION' }); }
    };
  }

  verificarPuedeCrearUsuarios() {
    return async (req, res, next) => {
      try {
        const membresia_id = req.contexto_institucion?.membresia_id;
        if (!membresia_id) return res.status(401).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
        const tieneCap = await consulta(`SELECT 1 FROM membresia_capacidades mc INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id WHERE mc.membresia_id = $1 AND c.codigo = 'crear_usuarios'`, [membresia_id]);
        if (tieneCap.rows.length === 0) return res.status(403).json({ error: 'Sin capacidad crear_usuarios', codigo: 'SIN_CAPACIDAD_CREAR' });
        const puedeCrear = await consulta('SELECT puede_crear_hijos FROM membresias WHERE membresia_id = $1', [membresia_id]);
        if (!puedeCrear.rows[0]?.puede_crear_hijos) return res.status(403).json({ error: 'Creacion deshabilitada', codigo: 'CREACION_DESHABILITADA' });
        next();
      } catch (error) { res.status(500).json({ error: 'Error', codigo: 'ERROR_VERIFICACION' }); }
    };
  }

  verificarEsDescendiente() {
    return async (req, res, next) => {
      try {
        const creador_membresia_id = req.contexto_institucion?.membresia_id;
        const objetivo_membresia_id = parseInt(req.params.membresia_id);
        if (!creador_membresia_id) return res.status(401).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
        const esSuperadmin = await consulta('SELECT 1 FROM membresias WHERE membresia_id = $1 AND nivel = 0', [creador_membresia_id]);
        if (esSuperadmin.rows.length > 0) return next();
        const esDescendiente = await consulta('SELECT 1 FROM obtener_descendientes_membresia($1) WHERE membresia_id = $2', [creador_membresia_id, objetivo_membresia_id]);
        if (esDescendiente.rows.length === 0) return res.status(403).json({ error: 'No es descendiente', codigo: 'NO_ES_DESCENDIENTE' });
        next();
      } catch (error) { res.status(500).json({ error: 'Error', codigo: 'ERROR_VERIFICACION' }); }
    };
  }

  verificarSuperadmin() {
    return async (req, res, next) => {
      try {
        const membresia_id = req.contexto_institucion?.membresia_id;
        if (!membresia_id) return res.status(401).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
        const resultado = await consulta('SELECT 1 FROM membresias WHERE membresia_id = $1 AND nivel = 0', [membresia_id]);
        if (resultado.rows.length === 0) return res.status(403).json({ error: 'Requiere superadmin', codigo: 'REQUIERE_SUPERADMIN' });
        next();
      } catch (error) { res.status(500).json({ error: 'Error', codigo: 'ERROR_VERIFICACION' }); }
    };
  }

  verificarNoAutoModificacion() {
    return async (req, res, next) => {
      const membresia_id = req.contexto_institucion?.membresia_id;
      const objetivo_membresia_id = parseInt(req.params.membresia_id);
      if (membresia_id === objetivo_membresia_id) return res.status(403).json({ error: 'No auto-modificacion', codigo: 'AUTO_MODIFICACION_PROHIBIDA' });
      next();
    };
  }
}

module.exports = new JerarquiaMiddleware();
