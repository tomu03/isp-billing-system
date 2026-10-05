import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('isp_user');
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('isp_token', data.token);
    localStorage.setItem('isp_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('isp_token');
    localStorage.removeItem('isp_user');
    setUser(null);
  }, []);

  const can = useCallback((...roles) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
