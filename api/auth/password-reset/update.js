import DatabaseManager from '../../database/DatabaseManager.js';
import bcrypt from 'bcryptjs';
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

  const { dni, codigo, newPassword } = req.body;

  if (!dni || !codigo || !newPassword) {
    return res.status(400).json({ success: false, message: 'DNI, código y nueva contraseña son obligatorios' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    await DatabaseManager.connect();

    // Buscar el código más reciente no usado para ese DNI
    const results = await DatabaseManager.query(
      `SELECT "ID_RESET", "CODIGO", "EXPIRA_EN", "USADO"
       FROM "PASSWORD_RESET_CODES"
       WHERE "DNI" = $1 AND "USADO" = FALSE
       ORDER BY "CREADO_EN" DESC
       LIMIT 1`,
      dni
    );

    if (!results || results.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay código pendiente. Solicita uno nuevo.' });
    }

    const record = results[0];

    // Validar que el código coincida
    if (record.CODIGO !== codigo) {
      return res.status(400).json({ success: false, message: 'Código incorrecto' });
    }

    // Validar que no haya expirado
    const now = new Date();
    const expira = new Date(record.EXPIRA_EN);

    if (now > expira) {
      return res.status(400).json({ success: false, message: 'El código ha expirado. Solicita uno nuevo.' });
    }

    // Hashear nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña en USUARIOS usando update() de Supabase
    await DatabaseManager.update('USUARIOS', dni, {
      PASSWORD_HASH: passwordHash,
      REQUIERE_CAMBIO_PASSWORD: false,
    }, 'DNI');

    // Marcar código como usado usando update() de Supabase
    await DatabaseManager.update('PASSWORD_RESET_CODES', record.ID_RESET, { USADO: true, FECHA_USO: new Date().toISOString() }, 'ID_RESET');

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('[password-reset/update] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
