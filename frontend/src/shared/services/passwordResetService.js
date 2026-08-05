import { API_BASE_URL } from '@/shared/config/api';

export const passwordResetService = {
  request: async (dni, email) => {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni, email }),
    });
    const result = await response.json();
    if (!result.success && response.status !== 429) {
      throw new Error(result.message);
    }
    if (!result.success && response.status === 429) {
      throw new Error(result.message);
    }
    return result;
  },

  verify: async (dni, codigo) => {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni, codigo }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result;
  },

  update: async (dni, codigo, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni, codigo, newPassword }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result;
  },
};
