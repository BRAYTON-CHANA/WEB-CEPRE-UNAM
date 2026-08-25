import DatabaseManager from '../../database/DatabaseManager.js';
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

  const {
    dni, nombres, apellido_paterno, apellido_materno, password,
    email, telefono, telefono_opcional, direccion,
    departamento, provincia, distrito, ref_dom,
    fecha_nacimiento, sexo, discapacidad, tipo_discapacidad, nro_conadis,
    id_roles
  } = req.body;

  if (!dni || !nombres || !apellido_paterno || !password) {
    return res.status(400).json({
      success: false,
      message: 'DNI, nombres, apellido paterno y contraseña son obligatorios'
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

    const newUser = {
      DNI: dni,
      APELLIDO_PATERNO: apellido_paterno,
      APELLIDO_MATERNO: apellido_materno || null,
      NOMBRES: nombres,
      EMAIL: email || null,
      TELEFONO: telefono || null,
      TELEFONO_OPCIONAL: telefono_opcional || null,
      DIRECCION: direccion || null,
      DEPARTAMENTO: departamento || null,
      PROVINCIA: provincia || null,
      DISTRITO: distrito || null,
      REF_DOM: ref_dom || null,
      FECHA_NACIMIENTO: fecha_nacimiento || null,
      SEXO: sexo || null,
      DISCAPACIDAD: discapacidad || false,
      TIPO_DISCAPACIDAD: tipo_discapacidad || null,
      NRO_CONADIS: nro_conadis || null,
      PASSWORD_HASH: passwordHash,
      ID_ROLES: id_roles && Array.isArray(id_roles) ? id_roles.map(Number) : []
    };

    const result = await DatabaseManager.insert('USUARIOS', newUser);

    if (!result || result.length === 0) {
      throw new Error('No se pudo registrar el usuario');
    }

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
