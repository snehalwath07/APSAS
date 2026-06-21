import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('apsas_token') || null);
  const [loading, setLoading] = useState(true);

  // Set default API URL (Render or local backend)
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
  axios.defaults.baseURL = API_URL;

  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await axios.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error('Session validation failed:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const login = async (email, password, role = 'citizen') => {
    const res = await axios.post(`/auth/login/${role}`, { email, password, full_name: 'test', role });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('apsas_token', access_token);
    setToken(access_token);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    return userData;
  };

  const signup = async (email, password, fullName, role, phone) => {
    const res = await axios.post('/auth/signup', {
      email,
      password,
      full_name: fullName,
      role: 'citizen', // enforce citizen role on frontend signup payload too
      phone
    });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('apsas_token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (fullName, phone, password) => {
    const res = await axios.put('/auth/profile', {
      full_name: fullName,
      phone,
      password: password || undefined
    });
    setUser(res.data);
    return res.data;
  };

  const forgotPassword = async (email) => {
    const res = await axios.post('/auth/forgot-password', { email });
    return res.data;
  };

  const resetPassword = async (token, password) => {
    const res = await axios.post('/auth/reset-password', { token, password });
    return res.data;
  };

  const getUsers = async () => {
    const res = await axios.get('/users');
    return res.data;
  };

  const updateUserRole = async (id, role) => {
    const res = await axios.put(`/users/${id}/role?role=${role}`);
    return res.data;
  };

  const updateUserStatus = async (id, status) => {
    const res = await axios.put(`/users/${id}/status?status=${status}`);
    return res.data;
  };

  const deleteUser = async (id) => {
    const res = await axios.delete(`/users/${id}`);
    return res.data;
  };

  // Notifications API
  const getNotifications = async () => {
    const res = await axios.get('/notifications');
    return res.data;
  };

  const markNotificationAsRead = async (id) => {
    const res = await axios.put(`/notifications/${id}/read`);
    return res.data;
  };

  const markAllNotificationsAsRead = async () => {
    const res = await axios.post('/notifications/read-all');
    return res.data;
  };

  const deleteNotification = async (id) => {
    const res = await axios.delete(`/notifications/${id}`);
    return res.data;
  };

  const clearAllNotifications = async () => {
    const res = await axios.delete('/notifications');
    return res.data;
  };

  // Role Specific Analytics API
  const getCitizenAnalytics = async () => {
    const res = await axios.get('/analytics/citizen');
    return res.data;
  };

  const getOperatorAnalytics = async () => {
    const res = await axios.get('/analytics/operator');
    return res.data;
  };

  const getSystemAnalytics = async () => {
    const res = await axios.get('/analytics/system');
    return res.data;
  };

  const getAuditLogs = async () => {
    const res = await axios.get('/users/audit-logs');
    return res.data;
  };

  // Zone Management API
  const createZone = async (zoneData) => {
    const res = await axios.post('/zones', zoneData);
    return res.data;
  };

  const updateZone = async (id, zoneData) => {
    const res = await axios.put(`/zones/${id}`, zoneData);
    return res.data;
  };

  const deleteZone = async (id) => {
    const res = await axios.delete(`/zones/${id}`);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ 
      user, token, loading, login, signup, logout, updateProfile, API_URL,
      forgotPassword, resetPassword, getUsers, updateUserRole, updateUserStatus, deleteUser,
      getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, clearAllNotifications,
      getCitizenAnalytics, getOperatorAnalytics, getSystemAnalytics, getAuditLogs,
      createZone, updateZone, deleteZone
    }}>
      {children}
    </AuthContext.Provider>
  );
};
