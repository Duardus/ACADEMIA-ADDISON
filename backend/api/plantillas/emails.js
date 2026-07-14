/* ============================================
   🎨 PLANTILLAS DE EMAIL
   ============================================ */

function plantillaBase({ titulo, contenido, botonTexto, botonUrl, footer }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .body { padding: 40px 30px; }
    .body p { color: #333; font-size: 16px; line-height: 1.6; }
    .boton { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; }
    .alerta { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Academia Addison</h1>
    </div>
    <div class="body">
      ${contenido}
      ${botonUrl ? `<a href="${botonUrl}" class="boton">${botonTexto}</a>` : ''}
      ${footer || ''}
    </div>
    <div class="footer">
      <p>Este email fue enviado automáticamente por Academia Addison.</p>
      <p>Si no reconoces esta actividad, ignora este mensaje.</p>
    </div>
  </div>
</body>
</html>`;
}

function emailRecuperacion({ nombre, urlMagicLink, expiraEn }) {
  return plantillaBase({
    titulo: 'Recuperar acceso - Academia Addison',
    contenido: `
      <h2>¡Hola ${nombre}!</h2>
      <p>Alguien (esperamos que tú) solicitó recuperar el acceso a tu cuenta desde un nuevo dispositivo.</p>
      <div class="alerta">
        <strong>⚠️ Este link expira en ${expiraEn} minutos.</strong><br>
        Solo puede usarse una vez.
      </div>
      <p>Haz clic en el botón de abajo para crear un nuevo acceso seguro en tu dispositivo:</p>
    `,
    botonTexto: '✅ Crear nuevo acceso seguro',
    botonUrl: urlMagicLink,
    footer: `
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        Si el botón no funciona, copia y pega este link:<br>
        <code style="background: #f5f5f5; padding: 8px; border-radius: 4px; word-break: break-all;">${urlMagicLink}</code>
      </p>
    `
  });
}

function emailBienvenida({ nombre }) {
  return plantillaBase({
    titulo: 'Bienvenido a Academia Addison',
    contenido: `
      <h2>¡Bienvenido, ${nombre}!</h2>
      <p>Tu cuenta ha sido creada exitosamente en <strong>Academia Addison</strong>.</p>
      <p>Ahora puedes acceder a todos nuestros cursos y materiales educativos.</p>
      <div class="alerta">
        <strong>💡 Consejo de seguridad:</strong><br>
        Tu acceso seguro está vinculado a este dispositivo. Si cambias de celular, usa "Recuperar cuenta" en la página de login.
      </div>
    `,
    botonTexto: '📚 Ir a la plataforma',
    botonUrl: 'https://academia-addison.pages.dev'
  });
}

function emailMembresiaVencida({ nombre, fechaVencimiento }) {
  return plantillaBase({
    titulo: 'Membresía vencida - Academia Addison',
    contenido: `
      <h2>Hola ${nombre}</h2>
      <p>Tu membresía venció el <strong>${fechaVencimiento}</strong>.</p>
      <p>Tu acceso a cursos y materiales está pausado temporalmente.</p>
      <div class="alerta">
        <strong>ℹ️ Puedes seguir viendo:</strong><br>
        ✅ Tu perfil<br>
        ✅ Historial de pagos<br>
        ❌ Cursos y materiales (hasta que renueves)
      </div>
    `,
    botonTexto: '💳 Renovar membresía',
    botonUrl: 'https://academia-addison.pages.dev/pagos'
  });
}

module.exports = { emailRecuperacion, emailBienvenida, emailMembresiaVencida };
