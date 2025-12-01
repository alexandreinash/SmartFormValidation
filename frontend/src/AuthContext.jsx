import React, { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('sfv_token');
    const storedUser = localStorage.getItem('sfv_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { token: t, user: u } = res.data.data;
    localStorage.setItem('sfv_token', t);
    localStorage.setItem('sfv_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  };

  const register = async (email, password, role) => {
    await api.post('/api/auth/register', { email, password, role });
  };

  const logout = () => {
    localStorage.removeItem('sfv_token');
    localStorage.removeItem('sfv_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}




