/* ============================================
   📁 ARCHIVO: permisos.config.js
   📂 CAPA: 00-config
   🔗 DEPENDENCIAS: NINGUNA
   📝 CONTRATO:
     - Exporta MAPA_PERMISOS: objeto plano
     - Cada rol tiene array de strings de permisos
   🚫 NO TOCAR: Lógica de negocio, UI, API calls
   ============================================ */

const MAPA_PERMISOS = {
  superadmin: [
    'ver_dashboard', 'ver_jerarquia', 'ver_instituciones',
    'ver_finanzas_globales', 'ver_auditoria', 'crear_institucion',
    'editar_institucion', 'eliminar_institucion', 'ver_usuarios_todos',
    'gestionar_roles', 'ver_arbol_global'
  ],
  director: [
    'ver_dashboard', 'ver_arbol', 'editar_arbol',
    'ver_usuarios', 'crear_usuario', 'editar_usuario',
    'ver_finanzas', 'ver_calendario', 'ver_clases_vivo',
    'iniciar_clase_vivo'
  ],
  profesor: [
    'ver_dashboard', 'ver_examenes', 'crear_examen',
    'ver_teorias', 'crear_teoria', 'ver_notas',
    'ver_clases_vivo', 'iniciar_clase_vivo'
  ],
  estudiante: [
    'ver_dashboard', 'ver_cursos', 'ver_progreso',
    'hacer_examen', 'ver_teoria', 'ver_clases_vivo'
  ]
};

// Helper: verificar si un rol tiene un permiso
function tienePermiso(rol, permiso) {
  const permisos = MAPA_PERMISOS[rol] || [];
  return permisos.includes(permiso);
}
