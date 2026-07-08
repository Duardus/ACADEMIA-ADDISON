# 📋 CONTRATO API - ACADEMIA ADDISON v3.0

## Formato de respuesta estandar

TODOS los endpoints devuelven:
```json
{
  "exito": true|false,
  "mensaje": "string",
  "datos": { ... },
  "error": "string",
  "codigo": "CODIGO_ERROR",
  "timestamp": "ISO8601"
}
```

## Autenticacion

Header obligatorio en endpoints protegidos:
```
Authorization: Bearer <token_sesion>
```

## Endpoints

### POST /auth/login
Entrada: `{ token_firebase: string }`
Salida OK: `{ tipo, token_sesion, usuario: { rol, nivel, nombre_rol, ... }, institucion }`
Salida selector: `{ tipo: "selector_requerido", token_preliminar, membresias: [...] }`

### POST /auth/seleccionar-contexto
Entrada: `{ token_preliminar, membresia_id }`
Salida: `{ token_sesion, usuario, institucion }`

### POST /auth/switch-context
Entrada: `{ membresia_id }`
Salida: `{ token_sesion, rol, nivel, institucion }`

### GET /arbol
Salida: `{ datos: [ { grupo_id, nombre_grupo, hijos: [cursos...] } ] }`

### GET /jerarquia/mis-subordinados
Salida: `{ datos: { total, subordinados: [...] } }`

### POST /jerarquia/crear
Entrada: `{ email, nombre_rol, nivel_jerarquico, superior_inmediato_id, ... }`
Salida: `{ datos: { membresia_id, usuario_id, email, ... } }`

### DELETE /jerarquia/subordinado/:membresia_id
Salida: `{ datos: { membresia_id } }`

## Roles validos
superadmin, director, professor, auxiliary, student, miembro

## Codigos de error comunes
AUTENTICACION_FALLIDA, SIN_MEMBRESIA, MEMBRESIA_EXISTENTE
NIVEL_INVALIDO, SIN_PODER_CREAR, DELEGACION_ILEGAL
