import login from '../../lib/handlers/auth/login.js';
import register from '../../lib/handlers/auth/register.js';
import verify from '../../lib/handlers/auth/verify.js';
import cambiarPassword from '../../lib/handlers/auth/cambiar-password.js';
import resetPasswordAdmin from '../../lib/handlers/auth/reset-password-admin.js';
import passwordResetRequest from '../../lib/handlers/auth/password-reset/request.js';
import passwordResetVerify from '../../lib/handlers/auth/password-reset/verify.js';
import passwordResetUpdate from '../../lib/handlers/auth/password-reset/update.js';

const handlers = {
  login,
  register,
  verify,
  'cambiar-password': cambiarPassword,
  'reset-password-admin': resetPasswordAdmin,
};

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

  if (!path.length && req.url) {
    const urlParts = req.url.split('?')[0].split('/').filter(Boolean);
    const authIdx = urlParts.indexOf('auth');
    path = authIdx >= 0 ? urlParts.slice(authIdx + 1) : urlParts;
  }

  path = path.filter(Boolean);

  console.log('[auth] req.url:', req.url, 'query:', req.query, 'path:', path);

  if (path.length === 1 && handlers[path[0]]) {
    return handlers[path[0]](req, res);
  }

  if (path.length >= 2 && path[0] === 'password-reset' && passwordResetHandlers[path[1]]) {
    return passwordResetHandlers[path[1]](req, res);
  }

  return res.status(404).json({ success: false, message: 'Ruta no encontrada', debug: { url: req.url, query: req.query, parsedPath: path } });
}
