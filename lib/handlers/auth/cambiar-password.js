import DatabaseManager from '../../database/DatabaseManager.js';
import bcrypt from 'bcryptjs';
import { withAuth } from '../../middleware/auth.js';
import 'dotenv/config';

async function handler(req, res) {
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

  const { dni, newPassword } = req.body;

  if (!dni || !newPassword) {
    return res.status(400).json({ success: false, message: 'DNI y nueva contraseña son obligatorios' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  if (dni === newPassword) {
    return res.status(400).json({ success: false, message: 'La contraseña no puede ser igual al DNI' });
  }

  try {
    await DatabaseManager.connect();

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await DatabaseManager.update('USUARIOS', dni, {
      PASSWORD_HASH: passwordHash,
      REQUIERE_CAMBIO_PASSWORD: false,
    }, 'DNI');

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('[auth/cambiar-password] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export default withAuth(handler);
