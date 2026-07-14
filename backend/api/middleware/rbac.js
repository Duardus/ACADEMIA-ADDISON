const JERARQUIA = {
  superadmin: 5,
  director: 4,
  auxiliary: 3,
  professor: 2,
  student: 1
};

function requerirRol(...rolesPermitidos) {
  return (req, res, next) => {
    const ctx = req.contexto_institucion;
    if (!ctx) return res.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });
    if (!rolesPermitidos.includes(ctx.tipo_rol)) {
      return res.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });
    }
    next();
  };
}

function requerirRolMinimo(rolMinimo) {
  return (req, res, next) => {
    const ctx = req.contexto_institucion;
    if (!ctx) return res.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });
    const nivelActual = JERARQUIA[ctx.tipo_rol] || 0;
    const nivelReq = JERARQUIA[rolMinimo] || 0;
    if (nivelActual < nivelReq) {
      return res.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });
    }
    next();
  };
}

function requerirLlave(nombreLlave) {
  return (req, res, next) => {
    const ctx = req.contexto_institucion;
    if (!ctx) return res.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });
    if (ctx.tipo_rol !== 'auxiliary') return next();
    const llaves = ctx.metadata_rol?.llaves || [];
    if (!llaves.includes(nombreLlave)) {
      return res.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });
    }
    next();
  };
}

module.exports = { requerirRol, requerirRolMinimo, requerirLlave };
