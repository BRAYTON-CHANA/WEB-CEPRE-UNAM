import { tokenUtils } from '@/shared/utils/tokenUtils';

const API_URL = '/api/correos/cuentas-smtp';

async function fetchWithAuth(url, options = {}) {
  const token = tokenUtils.getToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || 'Error en la operación');
  }
  return result.data;
}

export const cuentasSmtpService = {
  create: async (data) => {
    return fetchWithAuth(API_URL, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  update: async (id, data) => {
    return fetchWithAuth(API_URL, {
      method: 'PUT',
      body: JSON.stringify({ id, data, idColumn: 'ID_CUENTA' })
    });
  },

  remove: async (id) => {
    return fetchWithAuth(API_URL, {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  }
};
