import { useState, useCallback } from 'react';
import { authService } from '@/features/login/services/authService';
import { db } from '@/shared/api';
import { tokenUtils } from '@/shared/utils/tokenUtils';

const ACTIVE_ROLE_KEY = 'auth_active_role';

export const useAuth = () => {
  const [user, setUser] = useState(() => {
    const storedToken = tokenUtils.getToken();
    if (!storedToken || !tokenUtils.isTokenValid(storedToken)) {
      tokenUtils.clear();
      localStorage.removeItem(ACTIVE_ROLE_KEY);
      return null;
    }
    return tokenUtils.getUser();
  });
  const [token, setToken] = useState(() => tokenUtils.getToken());
  const [activeRole, setActiveRoleState] = useState(() => {
    const currentToken = tokenUtils.getToken();
    if (!currentToken) return null;
    const savedRole = localStorage.getItem(ACTIVE_ROLE_KEY);
    if (savedRole) return savedRole;
    const savedUser = tokenUtils.getUser();
    if (savedUser?.roles?.length > 0) {
      const firstRole = savedUser.roles[0];
      const defaultRole = typeof firstRole === 'string' ? firstRole : firstRole?.nombre;
      if (defaultRole) {
        localStorage.setItem(ACTIVE_ROLE_KEY, defaultRole);
        return defaultRole;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setActiveRole = useCallback((roleNombre) => {
    setActiveRoleState(roleNombre);
    localStorage.setItem(ACTIVE_ROLE_KEY, roleNombre);
  }, []);

  const login = useCallback(async (dni, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(dni, password);
      const token = data.token ?? data.TOKEN;
      const payload = data.user ?? data;
      let user = payload;

      if (token && payload?.id_usuario) {
        try {
          const dbUsers = await db.select('VW_USUARIOS', { ID_USUARIO: payload.id_usuario });
          const dbUser = dbUsers?.[0];
          if (dbUser) {
            user = { ...payload, ...dbUser, roles: dbUser.ROLES_NOMBRES || payload.roles || [] };
          }
        } catch {
          // conservar el payload si falla la consulta
        }
      }

      tokenUtils.setToken(token);
      tokenUtils.setUser(user);
      setToken(token);
      setUser(user);
      if (user.roles && user.roles.length > 0) {
        const firstRole = user.roles[0];
        const defaultRole = typeof firstRole === 'string' ? firstRole : firstRole?.nombre;
        if (defaultRole) {
          setActiveRoleState(defaultRole);
          localStorage.setItem(ACTIVE_ROLE_KEY, defaultRole);
        }
      }
      return { token, user };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    tokenUtils.clear();
    localStorage.removeItem(ACTIVE_ROLE_KEY);
    setToken(null);
    setUser(null);
    setActiveRoleState(null);
  }, []);

  return { user, token, activeRole, setActiveRole, loading, error, login, logout, isAuthenticated: tokenUtils.isTokenValid(token) };
};
