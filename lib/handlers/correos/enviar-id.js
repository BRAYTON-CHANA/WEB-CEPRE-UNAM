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

  const { idCorreo } = req.body || {};

  if (!idCorreo) {
    return res.status(400).json({ success: false, message: 'idCorreo es obligatorio' });
  }

  try {
    const result = await sendEmailNow(idCorreo);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[correos/enviar-id] Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error enviando el correo' });
  }
}

export default withAuth(handler);
