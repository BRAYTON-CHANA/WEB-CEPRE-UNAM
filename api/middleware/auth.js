import jwt from 'jsonwebtoken';
import 'dotenv/config';

export function verifyToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('No token provided');
    error.code = 401;
    throw error;
  }

  const token = authHeader.split(' ')[1];

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const error = new Error('Token inválido o expirado');
    error.code = 401;
    throw error;
  }
}

export function withAuth(handler) {
  return async (req, res) => {
    try {
      const decoded = verifyToken(req);
      req.user = decoded;
      return handler(req, res);
    } catch (error) {
      return res.status(error.code || 401).json({
        success: false,
        message: error.message
      });
    }
  };
}
