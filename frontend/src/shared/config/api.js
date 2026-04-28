/**
 * URL base de la API.
 * - En producción (Vercel): undefined → usa '/api' relativo (mismo dominio).
 * - En dev local: define VITE_API_URL=http://localhost:3001/api en .env.development
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || '/api';
