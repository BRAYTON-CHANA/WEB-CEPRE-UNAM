import { API_BASE_URL } from '../../../shared/config/api';

export const authService = {
  login: async (dni, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni, password })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  verify: async (token) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  changePassword: async (dni, newPassword, token) => {
    const response = await fetch(`${API_BASE_URL}/auth/cambiar-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ dni, newPassword })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result;
  },

  resetPasswordAdmin: async (dni, token) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ dni })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result;
  }
};
