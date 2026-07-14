#!/bin/bash
echo "=========================================="
echo "DIAGNOSTICO COMPLETO - ACADEMIA ADDISON"
echo "=========================================="

echo ""
echo "1. USUARIOS EN LA BASE DE DATOS:"
docker exec postgres-academia psql -U addison -d academia_addison -c "
SELECT m.membresia_id, m.usuario_id, m.nivel, m.nombre_rol, m.estado_membresia, 
       u.nombre_completo, u.correo_electronico, u.creado_en
FROM membresias m
JOIN usuarios u ON m.usuario_id = u.usuario_id
WHERE m.institucion_id = 2
ORDER BY m.nivel, u.nombre_completo;
"

echo ""
echo "2. CAPACIDADES DISPONIBLES:"
docker exec postgres-academia psql -U addison -d academia_addison -c "
SELECT capacidad_id, codigo, nombre, categoria FROM capacidades ORDER BY categoria, nombre;
"

echo ""
echo "3. CAPACIDADES DEL SUPERADMIN (membresia_id=1):"
docker exec postgres-academia psql -U addison -d academia_addison -c "
SELECT mc.capacidad_id, c.codigo, c.nombre 
FROM membresia_capacidades mc
JOIN capacidades c ON mc.capacidad_id = c.capacidad_id
WHERE mc.membresia_id = 1;
"

echo ""
echo "4. VERIFICAR RUTAS DEL BACKEND:"
curl -s http://localhost:3000/api/v1/jerarquia/mis-subordinados -X GET -H "Authorization: Bearer test" 2>&1 | head -c 100
echo ""
curl -s http://localhost:3000/api/v1/jerarquia/mis-capacidades -X GET -H "Authorization: Bearer test" 2>&1 | head -c 100
echo ""

echo ""
echo "5. ESTADO DEL BACKEND:"
pm2 status | grep api-addison

echo ""
echo "=========================================="
echo "FIN DEL DIAGNOSTICO"
echo "=========================================="
