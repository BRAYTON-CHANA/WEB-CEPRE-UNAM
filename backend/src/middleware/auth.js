/**
 * Middleware de autenticación básico
 * Verifica si el usuario tiene un token válido
 */

const authMiddleware = (req, res, next) => {
  // Obtener token del header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. Se requiere token de autenticación.'
    });
  }
  
  // Validación básica del token (en producción usar JWT)
  if (token === 'token-secreto-temporal') {
    req.user = { id: 1, name: 'Usuario Temporal' };
    next();
  } else {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

module.exports = authMiddleware;
