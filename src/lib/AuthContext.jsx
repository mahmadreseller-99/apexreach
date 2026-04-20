import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Read from localStorage on mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await api.auth.login(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    window.location.href = '/dashboard';
    return data;
  };

  const signup = async (name, email, password) => {
    const data = await api.auth.signup(name, email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    window.location.href = '/dashboard';
    return data;
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
  };

  // Mocked state attributes for legacy compatibility with protected routes in App.jsx
  const isAuthenticated = !!user;
  const isLoadingAuth = isLoading;
  const authChecked = !isLoading;

  return (
    <AuthContext.Provider value={{ 
      user, login, signup, logout, isLoading,
      isAuthenticated, isLoadingAuth, authChecked, isLoadingPublicSettings: false,
      checkUserAuth: () => {} 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
