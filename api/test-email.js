import { sendEmail } from './shared/emailService.js';
import 'dotenv/config';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { to } = req.body;

  if (!to) {
    return res.status(400).json({ success: false, message: 'Falta el parámetro "to"' });
  }

  try {
    const result = await sendEmail({
      to,
      subject: 'Prueba de correo - CEPRE UNAM',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #2D366F;">CEPRE UNAM - Prueba de correo</h2>
          <p>Este es un correo de prueba para verificar que la configuración SMTP funciona correctamente.</p>
          <p>Si recibes este correo, el servicio de envío está operativo.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">CEPRE - Universidad Nacional de Moquegua</p>
        </div>
      `,
      text: 'CEPRE UNAM - Prueba de correo. Si recibes este correo, el servicio de envío está operativo.',
    });

    res.json({
      success: true,
      message: 'Correo enviado correctamente',
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('[test-email] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar el correo',
      error: error.message,
    });
  }
}
