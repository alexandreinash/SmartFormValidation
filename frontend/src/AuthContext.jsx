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
    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.data.success && res.data.data) {
        const { token: t, user: u } = res.data.data;
        localStorage.setItem('sfv_token', t);
        localStorage.setItem('sfv_user', JSON.stringify(u));
        setToken(t);
        setUser(u);
        return u;
      } else {
        throw new Error(res.data.message || 'Login failed');
      }
    } catch (error) {
      // Re-throw with proper error structure
      if (error.response) {
        throw error;
      }
      throw new Error('Network error: Could not reach the server');
    }
  };

  const register = async (email, password, role) => {
    await api.post('/api/auth/register', { email, password, role });
  };

  const logout = () => {
    try {
      // Clear localStorage - remove all authentication data
      localStorage.removeItem('sfv_token');
      localStorage.removeItem('sfv_user');

      // Clear state immediately
      setToken(null);
      setUser(null);

      // Clear any other potential stored data
      sessionStorage.clear();

      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, try to clear state
      setToken(null);
      setUser(null);
      return false;
    }
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




