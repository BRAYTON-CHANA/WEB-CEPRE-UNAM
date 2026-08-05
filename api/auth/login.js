import DatabaseManager from '../database/DatabaseManager.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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

  const { dni, password } = req.body;

  if (!dni || !password) {
    return res.status(400).json({
      success: false,
      message: 'DNI y contraseña son obligatorios'
    });
  }

  try {
    await DatabaseManager.connect();

    const result = await DatabaseManager.query(
      'SELECT u."ID_USUARIO", u."DNI", u."NOMBRES", u."APELLIDOS", u."PASSWORD_HASH", u."ID_ROLES", u."ACTIVO", u."REQUIERE_CAMBIO_PASSWORD" FROM "USUARIOS" u WHERE u."DNI" = $1 AND u."ACTIVO" = TRUE',
      dni
    );

    if (!result || result.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'DNI no encontrado o usuario inactivo'
      });
    }

    const user = result[0];

    if (!user.PASSWORD_HASH) {
      return res.status(401).json({
        success: false,
        message: 'Usuario sin contraseña configurada. Contacte al administrador.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.PASSWORD_HASH);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }

    const rolesResult = await DatabaseManager.query(
      `SELECT r."NOMBRE_ROL", r."NIVEL_ACCESO" FROM "ROLES" r WHERE r."NOMBRE_ROL" = ANY(obtener_roles_usuario(${user.ID_USUARIO})) ORDER BY r."NIVEL_ACCESO" DESC`
    );

    const roles = (rolesResult || []).map(r => ({
      nombre: r.NOMBRE_ROL,
      nivel: r.NIVEL_ACCESO
    }));

    const token = jwt.sign(
      {
        id_usuario: user.ID_USUARIO,
        dni: user.DNI,
        nombres: user.NOMBRES,
        apellidos: user.APELLIDOS,
        roles: roles.map(r => r.nombre)
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.ID_USUARIO,
          dni: user.DNI,
          nombres: user.NOMBRES,
          apellidos: user.APELLIDOS,
          roles,
          requiereCambioPassword: user.REQUIERE_CAMBIO_PASSWORD || false
        }
      }
    });
  } catch (error) {
    console.error('[auth/login] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
