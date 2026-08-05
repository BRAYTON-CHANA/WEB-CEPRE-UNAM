import crypto from 'crypto';
import 'dotenv/config';

/**
 * Servicio de encriptación AES-256-GCM.
 * Usa ENCRYPTION_KEY del .env (32 bytes en hex).
 *
 * Formato almacenado:
 * - encrypted: base64 del texto encriptado
 * - iv: base64 del IV (12 bytes)
 * - authTag: base64 del tag de autenticación (16 bytes)
 */

function getKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) throw new Error('ENCRYPTION_KEY no configurada en .env');
  return Buffer.from(keyHex, 'hex');
}

/**
 * Encriptar un texto.
 * @param {string} text
 * @returns {{ encrypted: string, iv: string, authTag: string }}
 */
export function encrypt(text) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

/**
 * Desencriptar.
 * @param {string} encrypted - base64
 * @param {string} iv - base64
 * @param {string} authTag - base64
 * @returns {string} texto plano
 */
export function decrypt(encrypted, iv, authTag) {
  const key = getKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export default { encrypt, decrypt };
