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
    dni_fecha_vencimiento, codigo_ubigeo_nacimiento,
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

    // Convertir id_roles a formato PostgreSQL array literal
    const rolesArr = id_roles && Array.isArray(id_roles)
      ? '{' + id_roles.map(Number).filter(Boolean).join(',') + '}'
      : null;

    // Llamar a upsert_usuario(NULL, ...) — modo crear (maneja USUARIOS + USUARIO_ROL)
    const result = await DatabaseManager.query(
      `SELECT upsert_usuario(NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)`,
      dni,
      apellido_paterno,
      apellido_materno || null,
      nombres,
      passwordHash,
      email || null,
      telefono || null,
      telefono_opcional || null,
      fecha_nacimiento || null,
      sexo || null,
      direccion || null,
      departamento || null,
      provincia || null,
      distrito || null,
      codigo_ubigeo_nacimiento || null,
      ref_dom || null,
      discapacidad || false,
      tipo_discapacidad || null,
      nro_conadis || null,
      dni_fecha_vencimiento || null,
      null,  // dni_storage_path
      null,  // dni_filename
      null,  // dni_content_type
      null,  // dni_tamano_bytes
      null,  // conadis_storage_path
      null,  // conadis_filename
      null,  // conadis_content_type
      null,  // conadis_tamano_bytes
      true,  // activo
      true,  // requiere_cambio_password
      rolesArr
    );

    const idUsuario = result[0]?.upsert_usuario;
    if (!idUsuario) {
      throw new Error('No se pudo registrar el usuario');
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({
      success: true,
      data: { id_usuario: idUsuario }
    });
  } catch (error) {
    console.error('[auth/register] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
