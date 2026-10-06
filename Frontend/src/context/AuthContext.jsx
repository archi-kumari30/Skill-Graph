import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('skillgraph_token') || localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (err) {
          // Clear corrupt storage
          localStorage.removeItem('skillgraph_token');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        // Attempt silent cookie recovery if token is absent
        try {
          const res = await api.post('/auth/refresh');
          const resData = res.data?.data || res.data;
          const refreshedToken = resData?.accessToken || resData?.token;
          const refreshedUser = resData?.user;
          if (refreshedToken && refreshedUser) {
            localStorage.setItem('skillgraph_token', refreshedToken);
            localStorage.setItem('token', refreshedToken);
            localStorage.setItem('user', JSON.stringify(refreshedUser));
            setToken(refreshedToken);
            setUser(refreshedUser);
          }
        } catch (e) {
          // No active session cookie; continue as guest
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const resData = response.data?.data || response.data;
    const loggedUser = resData?.user || response.user;
    const loggedToken = resData?.accessToken || resData?.token || response.token;

    if (loggedToken) {
      localStorage.setItem('skillgraph_token', loggedToken);
      localStorage.setItem('token', loggedToken);
    }
    if (loggedUser) localStorage.setItem('user', JSON.stringify(loggedUser));

    setToken(loggedToken);
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    const resData = response.data?.data || response.data;
    const registeredUser = resData?.user || response.user;
    const registeredToken = resData?.accessToken || resData?.token || response.token;

    if (registeredToken) {
      localStorage.setItem('skillgraph_token', registeredToken);
      localStorage.setItem('token', registeredToken);
    }
    if (registeredUser) localStorage.setItem('user', JSON.stringify(registeredUser));

    setToken(registeredToken);
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Swallowed on network failure
    }
    localStorage.removeItem('skillgraph_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const forgotPassword = async (email) => {
    return await api.post('/auth/forgot-password', { email });
  };

  const resetPassword = async (resetToken, password) => {
    return await api.post(`/auth/reset-password/${resetToken}`, { password });
  };

  const updateUserProfile = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
