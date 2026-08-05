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

  const { dni } = req.body;

  if (!dni) {
    return res.status(400).json({ success: false, message: 'DNI es obligatorio' });
  }

  const userRoles = req.user?.roles || [];
  if (!userRoles.includes('admin')) {
    return res.status(403).json({ success: false, message: 'Solo el administrador puede resetear contraseñas' });
  }

  try {
    await DatabaseManager.connect();

    const users = await DatabaseManager.query(
      'SELECT "ID_USUARIO", "DNI" FROM "USUARIOS" WHERE "DNI" = $1 AND "ACTIVO" = TRUE',
      dni
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const passwordHash = await bcrypt.hash(dni, 10);

    await DatabaseManager.update('USUARIOS', dni, {
      PASSWORD_HASH: passwordHash,
      REQUIERE_CAMBIO_PASSWORD: true,
    }, 'DNI');

    res.json({
      success: true,
      message: `Contraseña reseteada. El usuario debe iniciar sesión con su DNI (${dni}) como contraseña y cambiarla.`
    });
  } catch (error) {
    console.error('[auth/reset-password-admin] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export default withAuth(handler);
