import DatabaseManager from '../../database/DatabaseManager.js';
import { encrypt } from '../../shared/cryptoService.js';
import { withAuth } from '../../middleware/auth.js';
import 'dotenv/config';

function buildSmtpPayload(input) {
  const { SMTP_PASSWORD, ...rest } = input;
  const payload = { ...rest };

  if (SMTP_PASSWORD && SMTP_PASSWORD.trim() !== '') {
    const { encrypted, iv, authTag } = encrypt(SMTP_PASSWORD);
    payload.SMTP_PASS_ENCRYPTED = encrypted;
    payload.SMTP_PASS_IV = iv;
    payload.SMTP_PASS_TAG = authTag;
  }

  return payload;
}

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await DatabaseManager.connect();

    if (req.method === 'POST') {
      const data = buildSmtpPayload(req.body);
      const result = await DatabaseManager.insert('CUENTAS_SMTP', data);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({ success: true, data: result });
    } else if (req.method === 'PUT') {
      const { id, data, idColumn = 'ID_CUENTA' } = req.body;
      if (!id) {
        return res.status(400).json({ success: false, message: 'ID es obligatorio' });
      }
      const updateData = buildSmtpPayload(data);
      const result = await DatabaseManager.update('CUENTAS_SMTP', id, updateData, idColumn);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({ success: true, data: result });
    } else if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ success: false, message: 'ID es obligatorio' });
      }
      await DatabaseManager.delete('CUENTAS_SMTP', id, 'ID_CUENTA');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({ success: true, data: { deleted: true } });
    }
  } catch (error) {
    console.error('[correos/cuentas-smtp] Error:', error);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

export default withAuth(handler);
