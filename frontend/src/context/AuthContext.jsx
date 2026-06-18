import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiCall } from '../utils/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate session on page reload
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('aegis_token');
      if (token) {
        try {
          const profile = await apiCall('/auth/me');
          setUser(profile);
        } catch (error) {
          console.error('Session verification failed:', error);
          localStorage.removeItem('aegis_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    verifySession();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      localStorage.setItem('aegis_token', data.token);
      setUser(data.user);
      setLoading(false);
      return { success: true, user: data.user };
    } catch (error) {
      setLoading(false);
      return { success: false, message: error.message };
    }
  };

  // Register handler
  const register = async (name, email, role, password) => {
    try {
      await apiCall('/auth/register', {
        method: 'POST',
        body: { name, email, role, password }
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('aegis_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
