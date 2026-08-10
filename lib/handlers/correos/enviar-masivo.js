import { createMassEmail } from '../../shared/emailService.js';
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

  const payload = req.body || {};

  try {
    const results = await createMassEmail({
      tipo: payload.tipo,
      viewName: payload.viewName,
      idField: payload.idField,
      recipients: payload.recipients || [],
      cc: payload.cc || [],
      bcc: payload.bcc || [],
      subject: payload.asunto,
      html: payload.cuerpoHtml,
      text: payload.cuerpoHtml ? payload.cuerpoHtml.replace(/<[^>]*>/g, '') : '',
      attachments: payload.adjuntos || [],
      creadoPor: payload.creadoPor || 'sistema',
      prioridad: payload.prioridad || 'normal',
      fechaProgramada: payload.fechaProgramada || null,
      metadatos: { id_cuenta: payload.idCuenta || null },
      idCuenta: payload.idCuenta || null,
      remitente: payload.remitente,
    });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('[correos/enviar-masivo] Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error guardando correos masivos' });
  }
}

export default withAuth(handler);
