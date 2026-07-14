#!/usr/bin/env node
/* ============================================
   🔍 SCRIPT DE VALIDACIÓN - ACADEMIA ADDISON
   Prueba que todas las rutas críticas funcionen
   ============================================ */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const RUTAS = [
  { metodo: 'GET',  ruta: '/api/v1/salud',                    nombre: 'Salud del servidor' },
  { metodo: 'GET',  ruta: '/api/v1/arbol',                    nombre: 'Árbol académico (requiere auth)' },
  { metodo: 'POST', ruta: '/api/v1/auth/login',               nombre: 'Login (token inválido esperado)' },
  { metodo: 'GET',  ruta: '/api/v1/usuarios',                 nombre: 'Lista de usuarios (requiere auth)' },
  { metodo: 'GET',  ruta: '/api/v1/instituciones',            nombre: 'Lista de instituciones (requiere auth)' },
  { metodo: 'GET',  ruta: '/api/v1/jerarquia/mis-capacidades', nombre: 'Capacidades (requiere auth)' },
];

let pasaron = 0;
let fallaron = 0;

function hacerPeticion(metodo, ruta) {
  return new Promise((resolve) => {
    const opciones = {
      hostname: 'localhost',
      port: 3000,
      path: ruta,
      method: metodo,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(opciones, (res) => {
      let datos = '';
      res.on('data', (chunk) => { datos += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          datos: datos,
          ok: res.statusCode < 500
        });
      });
    });

    req.on('error', (error) => {
      resolve({ status: 0, datos: error.message, ok: false });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, datos: 'Timeout', ok: false });
    });

    if (metodo === 'POST' && ruta.includes('login')) {
      req.write(JSON.stringify({ token_firebase: 'token_falso_de_prueba' }));
    }
    req.end();
  });
}

async function validar() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     🔍 VALIDACIÓN DE API - ACADEMIA ADDISON v3.0.1       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const inicio = Date.now();

  for (const prueba of RUTAS) {
    process.stdout.write(`  ⏳ ${prueba.nombre}... `.padEnd(55));
    
    const resultado = await hacerPeticion(prueba.metodo, prueba.ruta);
    
    if (resultado.ok) {
      console.log(`✅ ${resultado.status}`);
      pasaron++;
    } else {
      console.log(`❌ ${resultado.status} - ${resultado.datos.substring(0, 60)}`);
      fallaron++;
    }
  }

  const duracion = Date.now() - inicio;

  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log(`│  Resultado: ${pasaron} pasaron | ${fallaron} fallaron | ${duracion}ms           │`);
  
  if (fallaron === 0) {
    console.log('│  🎉 TODAS LAS PRUEBAS PASARON - Sistema saludable        │');
  } else {
    console.log('│  ⚠️  ALGUNAS PRUEBAS FALLARON - Revisar logs             │');
  }
  
  console.log('└────────────────────────────────────────────────────────────┘\n');

  process.exit(fallaron > 0 ? 1 : 0);
}

validar();
