import enviar from '../../lib/handlers/correos/enviar.js';
import enviarMasivo from '../../lib/handlers/correos/enviar-masivo.js';
import enviarId from '../../lib/handlers/correos/enviar-id.js';
import cuentasSmtp from '../../lib/handlers/correos/cuentas-smtp.js';
import cronEnviar from '../../lib/handlers/correos/cron-enviar.js';

const handlers = {
  enviar,
  'enviar-masivo': enviarMasivo,
  'enviar-id': enviarId,
  'cuentas-smtp': cuentasSmtp,
  'cron-enviar': cronEnviar,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const rawPath = req.query['...path'] || req.query.path;
  let path = [];
  if (Array.isArray(rawPath)) {
    path = rawPath;
  } else if (typeof rawPath === 'string' && rawPath) {
    path = rawPath.split('/');
  }

  if (!path.length && req.url) {
    const urlParts = req.url.split('?')[0].split('/').filter(Boolean);
    const correosIdx = urlParts.indexOf('correos');
    path = correosIdx >= 0 ? urlParts.slice(correosIdx + 1) : urlParts;
  }

  path = path.filter(Boolean);

  console.log('[correos] req.url:', req.url, 'query:', req.query, 'path:', path);

  if (path.length === 1 && handlers[path[0]]) {
    return handlers[path[0]](req, res);
  }

  return res.status(404).json({ success: false, message: 'Ruta no encontrada', debug: { url: req.url, query: req.query, parsedPath: path } });
}
