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

  const path = Array.isArray(req.query.path)
    ? req.query.path
    : (req.query.path ? [req.query.path] : []);

  if (path.length === 1 && handlers[path[0]]) {
    return handlers[path[0]](req, res);
  }

  if (path.length === 2 && path[0] === 'password-reset' && passwordResetHandlers[path[1]]) {
    return passwordResetHandlers[path[1]](req, res);
  }

  return res.status(404).json({ success: false, message: 'Ruta no encontrada' });
}
