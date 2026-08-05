import DatabaseManager from '../database/DatabaseManager.js';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { dni, nombres, apellidos, password, email, telefono, direccion, fecha_nacimiento, sexo, id_roles } = req.body;

  if (!dni || !nombres || !apellidos || !password) {
    return res.status(400).json({
      success: false,
      message: 'DNI, nombres, apellidos y contraseña son obligatorios'
    });
  }

  try {
    await DatabaseManager.connect();

    const existing = await DatabaseManager.query(
      'SELECT "ID_USUARIO" FROM "USUARIOS" WHERE "DNI" = $1',
      dni
    );

    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un usuario con ese DNI'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const rolesArray = id_roles && Array.isArray(id_roles) && id_roles.length > 0
      ? `ARRAY[${id_roles.join(',')}]::INTEGER[]`
      : `'{}'::INTEGER[]`;

    const result = await DatabaseManager.query(
      `INSERT INTO "USUARIOS" ("DNI", "APELLIDOS", "NOMBRES", "EMAIL", "TELEFONO", "DIRECCION", "FECHA_NACIMIENTO", "SEXO", "PASSWORD_HASH", "ID_ROLES", "ACTIVO") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ${rolesArray}, TRUE) RETURNING "ID_USUARIO"`,
      dni, apellidos, nombres, email || null, telefono || null, direccion || null, fecha_nacimiento || null, sexo || null, passwordHash
    );

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({
      success: true,
      data: { id_usuario: result[0]?.ID_USUARIO }
    });
  } catch (error) {
    console.error('[auth/register] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
