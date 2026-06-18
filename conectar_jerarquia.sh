#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  CONECTANDO JERARQUÍA A TU PLATAFORMA                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# ───────────────────────────────────────────────────────────────
# 1. ARREGLAR SERVIDOR.JS (error de finanzas/auditoria)
# ───────────────────────────────────────────────────────────────
echo "🔧 1. Arreglando servidor.js..."
cd ~/ACADEMIA-ADDISON/api
cp servidor.js servidor.js.BAK2

# Reemplazar las rutas mal escritas que causan reinicios
sed -i "s|/api/v1/finanzas/\*pathpath|/api/v1/finanzas/*|g" servidor.js
sed -i "s|/api/v1/auditoria/\*path|/api/v1/auditoria/*|g" servidor.js

echo "✅ servidor.js arreglado"

# ───────────────────────────────────────────────────────────────
# 2. AGREGAR SCRIPTS A INDEX.HTML
# ───────────────────────────────────────────────────────────────
echo "📄 2. Conectando scripts en index.html..."
cd ~/ACADEMIA-ADDISON
cp index.html index.html.BAK

# Buscar donde está api.servicio.js y agregar los nuevos debajo
if grep -q "api.servicio.js" index.html; then
    sed -i '/api.servicio.js/a \    <script src="js/servicios/jerarquia.servicio.js"></script>\n    <script src="js/jerarquia.gestion.js"></script>' index.html
    echo "✅ Scripts agregados a index.html"
else
    echo "⚠️  No encontré api.servicio.js en index.html. Buscando alternativa..."
    # Si no encuentra, agregar antes del cierre de </body>
    if grep -q "</body>" index.html; then
        sed -i '/<<\/body>/i \    <script src="js/servicios/jerarquia.servicio.js"></script>\n    <script src="js/jerarquia.gestion.js"></script>' index.html
        echo "✅ Scripts agregados antes de </body>"
    else
        echo "❌ No pude agregar scripts automáticamente. Revisa index.html manualmente."
    fi
fi

# ───────────────────────────────────────────────────────────────
# 3. AGREGAR BOTÓN Y NAVEGACIÓN AL MENÚ
# ───────────────────────────────────────────────────────────────
echo "🎛️  3. Buscando archivo de menú/navegación..."

# Buscar el archivo que contiene GestionUsuarios
ARCHIVO_MENU=$(grep -rl "GestionUsuarios" js/ 2>/dev/null | head -1)

if [ -z "$ARCHIVO_MENU" ]; then
    echo "⚠️  No encontré archivo con GestionUsuarios. Buscando 'gestion-usuarios'..."
    ARCHIVO_MENU=$(grep -rl "gestion-usuarios" js/ 2>/dev/null | head -1)
fi

if [ -z "$ARCHIVO_MENU" ]; then
    echo "⚠️  No encontré archivo de menú automáticamente."
    echo "    Debes agregar manualmente en tu app.js:"
    echo "    case 'gestion-jerarquia': GestionJerarquia.iniciar(); break;"
else
    cp "$ARCHIVO_MENU" "$ARCHIVO_MENU.BAK"
    echo "    Archivo encontrado: $ARCHIVO_MENU"
    
    # Agregar navegación: si alguien va a 'gestion-jerarquia', ejecuta GestionJerarquia
    if grep -q "case 'gestion-usuarios'" "$ARCHIVO_MENU"; then
        sed -i "/case 'gestion-usuarios'/i \      case 'gestion-jerarquia':\\n        GestionJerarquia.iniciar();\\n        break;" "$ARCHIVO_MENU"
        echo "✅ Navegación agregada"
    elif grep -q "GestionUsuarios.iniciar" "$ARCHIVO_MENU"; then
        sed -i "/GestionUsuarios.iniciar/i \      case 'gestion-jerarquia':\\n        GestionJerarquia.iniciar();\\n        break;" "$ARCHIVO_MENU"
        echo "✅ Navegación agregada"
    else
        echo "⚠️  No pude insertar navegación automáticamente. Revisa $ARCHIVO_MENU"
    fi
    
    # Agregar botón en el menú/dashboard si existe patrón
    if grep -q "GestionUsuarios" "$ARCHIVO_MENU" && grep -q "onclick" "$ARCHIVO_MENU"; then
        # Buscar línea que menciona gestion-usuarios y clonarla para jerarquía
        sed -i 's|gestion-usuarios|gestion-jerarquia|g' "$ARCHIVO_MENU"
        echo "✅ Botón de navegación actualizado"
    fi
fi

# ───────────────────────────────────────────────────────────────
# 4. REINICIAR SERVIDOR
# ───────────────────────────────────────────────────────────────
echo "🚀 4. Reiniciando servidor..."
cd ~/ACADEMIA-ADDISON/api
pm2 restart api-addison

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ CONEXIÓN COMPLETADA                                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Backups creados:"
echo "  - api/servidor.js.BAK2"
echo "  - index.html.BAK"
echo "  - $ARCHIVO_MENU.BAK (si se encontró)"
echo ""
echo "Ahora puedes probar:"
echo "  1. Entra a tu plataforma normalmente"
echo "  2. Busca el botón 'Gestión de Jerarquía' (o 'Gestión de Usuarios')"
echo "  3. Si no aparece, revisa el menú manualmente"
echo ""
echo "Si algo falló, restaura con:"
echo "  cp index.html.BAK index.html"
echo "  cp api/servidor.js.BAK2 api/servidor.js"

