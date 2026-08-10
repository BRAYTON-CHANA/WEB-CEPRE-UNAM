import DatabaseManager from '../../../database/DatabaseManager.js';
import { createEmail } from '../../../shared/emailService.js';
import fs from 'fs/promises';
import path from 'path';
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

  const { dni, email } = req.body;

  if (!dni || !email) {
    return res.status(400).json({ success: false, message: 'DNI y email son obligatorios' });
  }

  try {
    await DatabaseManager.connect();

    // Validar que exista usuario con ese DNI y que el email coincida
    const users = await DatabaseManager.query(
      'SELECT "ID_USUARIO", "DNI", "EMAIL" FROM "USUARIOS" WHERE "DNI" = $1 AND "ACTIVO" = TRUE',
      dni
    );

    // Por seguridad, siempre retornamos success: true (no revelar si el email existe)
    if (!users || users.length === 0) {
      return res.json({ success: true, message: 'Si el correo coincide, recibirás un código de recuperación' });
    }

    const user = users[0];

    // Cargar logos en base64 para incrustar en el HTML
    let unamLogo = '';
    let cepreLogo = '';
    try {
      const [unamBuf, cepreBuf] = await Promise.all([
        fs.readFile(path.join(process.cwd(), 'public', 'unam-logo.png')),
        fs.readFile(path.join(process.cwd(), 'public', 'logo.jpg')),
      ]);
      unamLogo = `data:image/png;base64,${unamBuf.toString('base64')}`;
      cepreLogo = `data:image/jpeg;base64,${cepreBuf.toString('base64')}`;
    } catch (e) {
      console.error('[password-reset/request] No se pudieron cargar los logos:', e);
    }

    if (!user.EMAIL || user.EMAIL.toLowerCase() !== email.toLowerCase()) {
      return res.json({ success: true, message: 'Si el correo coincide, recibirás un código de recuperación' });
    }

    // Rate limit: máximo 3 solicitudes por DNI en 15 minutos
    const recentRequests = await DatabaseManager.query(
      `SELECT COUNT(*) as total FROM "PASSWORD_RESET_CODES" WHERE "DNI" = $1 AND "CREADO_EN" > NOW() - INTERVAL '15 minutes'`,
      dni
    );

    if (recentRequests && recentRequests[0] && parseInt(recentRequests[0].TOTAL, 10) >= 3) {
      return res.status(429).json({ success: false, message: 'Has solicitado demasiados códigos. Intenta nuevamente en 15 minutos.' });
    }

    // Generar código de 6 dígitos
    const codigo = String(Math.floor(100000 + Math.random() * 900000));

    // Calcular expiración (5 minutos)
    const expiraEn = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Crear correo en la cola (tipo password_reset = envío automático)
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="margin-bottom: 16px;">
            ${unamLogo ? `<img src="${unamLogo}" alt="UNAM" style="height: 56px; width: auto; object-fit: contain; margin-right: 16px;">` : ''}
            ${cepreLogo ? `<img src="${cepreLogo}" alt="CEPRE" style="height: 56px; width: auto; object-fit: contain;">` : ''}
          </div>
          <h2 style="color: #2D366F; margin: 0;">CEPRE UNAM</h2>
          <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">Universidad Nacional de Moquegua</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <h3 style="color: #1e293b;">Recuperación de Contraseña</h3>
        <p style="color: #374151; font-size: 15px;">Has solicitado recuperar tu contraseña. Usa el siguiente código:</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2D366F; background: #f1f5f9; padding: 16px 32px; border-radius: 12px; display: inline-block;">${codigo}</span>
        </div>
        <p style="color: #6b7280; font-size: 13px; text-align: center;">Este código expira en <strong>5 minutos</strong>.</p>
        <p style="color: #6b7280; font-size: 13px;">Si no solicitaste este código, puedes ignorar este correo.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">CEPRE - Universidad Nacional de Moquegua</p>
      </div>
    `;

    const emailText = `CEPRE UNAM - Recuperación de Contraseña. Tu código es: ${codigo}. Expira en 5 minutos. Si no solicitaste este código, ignora este correo.`;

    let idCorreo = null;
    try {
      const emailResult = await createEmail({
        tipo: 'password_reset',
        idUsuarios: [user.ID_USUARIO],
        to: [email],
        subject: 'Código de recuperación de contraseña - CEPRE UNAM',
        html: emailHtml,
        text: emailText,
        creadoPor: dni,
      });
      idCorreo = emailResult.idCorreo;
    } catch (emailError) {
      console.error('[password-reset/request] Email error:', emailError);
      return res.status(500).json({ success: false, message: 'Error al enviar el correo. Intenta nuevamente.' });
    }

    // Guardar código de reset vinculado al correo
    await DatabaseManager.insert('PASSWORD_RESET_CODES', {
      ID_CORREO: idCorreo,
      DNI: dni,
      EMAIL: email.toLowerCase(),
      CODIGO: codigo,
      EXPIRA_EN: expiraEn,
    });

    res.json({ success: true, message: 'Si el correo coincide, recibirás un código de recuperación' });
  } catch (error) {
    console.error('[password-reset/request] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
