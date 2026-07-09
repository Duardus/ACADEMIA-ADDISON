#!/bin/bash
cd ~/ACADEMIA-ADDISON
DESCRIPCION="${1:-Cambio no especificado}"
ARCHIVOS="${2:-Varios}"
FECHA=$(date +%Y-%m-%d)
HORA=$(date +%H:%M)
sed -i "s/^> Ultima actualizacion:.*/> Ultima actualizacion: ${FECHA} ${HORA} UTC/" DOCUMENTACION_MAESTRA.md
sed -i "/^| 2026-07-09 | 3.3.1 | Fix: Arbol UI limpio/i\\
| ${FECHA} | v3.x | ${DESCRIPCION} | ${ARCHIVOS} |" DOCUMENTACION_MAESTRA.md
git add DOCUMENTACION_MAESTRA.md
git commit -m "docs: ${DESCRIPCION}"
git push origin main
echo "Documentacion actualizada: https://github.com/Duardus/ACADEMIA-ADDISON/blob/main/DOCUMENTACION_MAESTRA.md"
