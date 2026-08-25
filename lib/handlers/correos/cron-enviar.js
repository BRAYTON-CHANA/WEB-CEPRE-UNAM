import { processScheduledEmails } from '../../shared/emailService.js';
import 'dotenv/config';

/**
 * Handler del cron de envío automático de correos programados.
 * Protegido con CRON_SECRET (no usa JWT porque lo ejecuta un cron, no un usuario).
 * Endpoint: POST /api/correos/cron-enviar?secret=XXX
 *            o header x-cron-secret: XXX
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, x-cron-secret');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Verificar secret
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.error('[cron-enviar] CRON_SECRET no configurado en variables de entorno');
    return res.status(500).json({ success: false, message: 'Cron no configurado' });
  }

  if (secret !== expectedSecret) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }

  try {
    const result = await processScheduledEmails(10);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[cron-enviar] Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error procesando correos programados' });
  }
}
