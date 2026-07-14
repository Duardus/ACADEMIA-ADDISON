/* ============================================
   📧 CONFIGURACIÓN EMAIL - Resend API
   ============================================ */

const nodemailer = require('nodemailer');

// Resend SMTP (más compatible que API directa)
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: {
    user: 'resend',           // Siempre 'resend'
    pass: process.env.RESEND_API_KEY  // Tu API key
  }
});

// Verificar conexión al iniciar
transporter.verify()
  .then(() => console.log('[EMAIL] ✅ Resend SMTP conectado'))
  .catch(err => console.error('[EMAIL] ❌ Error Resend:', err.message));

async function enviarEmail({ para, asunto, html, texto }) {
  try {
    const info = await transporter.sendMail({
      from: '"Academia Addison" <noreply@academia-addison.duckdns.org>',
      to: para,
      subject: asunto,
      text: texto,
      html: html
    });
    console.log('[EMAIL] ✅ Enviado a', para, '- ID:', info.messageId);
    return { exito: true, messageId: info.messageId };
  } catch (err) {
    console.error('[EMAIL] ❌ Error enviando a', para, ':', err.message);
    return { exito: false, error: err.message };
  }
}

module.exports = { enviarEmail, transporter };
