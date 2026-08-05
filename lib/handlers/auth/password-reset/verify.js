import DatabaseManager from '../../../database/DatabaseManager.js';
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

  const { dni, codigo } = req.body;

  if (!dni || !codigo) {
    return res.status(400).json({ success: false, message: 'DNI y código son obligatorios' });
  }

  try {
    await DatabaseManager.connect();

    // Buscar el código más reciente no usado para ese DNI
    const results = await DatabaseManager.query(
      `SELECT "ID_RESET", "CODIGO", "EXPIRA_EN", "USADO", "CREADO_EN"
       FROM "PASSWORD_RESET_CODES"
       WHERE "DNI" = $1 AND "USADO" = FALSE
       ORDER BY "CREADO_EN" DESC
       LIMIT 1`,
      dni
    );

    if (!results || results.length === 0) {
      return res.json({ success: true, valid: false, message: 'No hay código pendiente. Solicita uno nuevo.' });
    }

    const record = results[0];

    // Validar que el código coincida
    if (record.CODIGO !== codigo) {
      return res.json({ success: true, valid: false, message: 'Código incorrecto' });
    }

    // Validar que no haya expirado
    const now = new Date();
    const expira = new Date(record.EXPIRA_EN);

    if (now > expira) {
      return res.json({ success: true, valid: false, message: 'El código ha expirado. Solicita uno nuevo.' });
    }

    res.json({ success: true, valid: true, message: 'Código válido' });
  } catch (error) {
    console.error('[password-reset/verify] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
