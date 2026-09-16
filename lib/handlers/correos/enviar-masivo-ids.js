import { sendEmailNow } from '../../shared/emailService.js';
import { withAuth } from '../../middleware/auth.js';
import 'dotenv/config';

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { ids } = req.body || {};

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'ids debe ser un array no vacío' });
  }

  const enviados = [];
  const fallidos = [];

  for (const id of ids) {
    try {
      const result = await sendEmailNow(Number(id), null, req.user.id_usuario);
      enviados.push(result);
    } catch (error) {
      fallidos.push({ idCorreo: id, error: error.message || 'Error enviando el correo' });
    }
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({
    success: true,
    data: {
      total: ids.length,
      enviados,
      fallidos,
      errores: fallidos
    }
  });
}

export default withAuth(handler);
