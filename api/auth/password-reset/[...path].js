import passwordResetRequest from '../../../../lib/handlers/auth/password-reset/request.js';
import passwordResetVerify from '../../../../lib/handlers/auth/password-reset/verify.js';
import passwordResetUpdate from '../../../../lib/handlers/auth/password-reset/update.js';

const passwordResetHandlers = {
  request: passwordResetRequest,
  verify: passwordResetVerify,
  update: passwordResetUpdate,
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
  path = path.filter(Boolean);

  if (path.length === 1 && passwordResetHandlers[path[0]]) {
    return passwordResetHandlers[path[0]](req, res);
  }

  return res.status(404).json({ success: false, message: 'Ruta no encontrada', debug: { url: req.url, query: req.query, parsedPath: path } });
}
