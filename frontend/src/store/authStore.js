// 42Nexus - Authentication Store
// This file is for: FATYZA (Frontend Developer)
// Description: Zustand store for auth state management

import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,
  
  login: () => {
    window.location.href = 'http://localhost:8000/api/auth/login';
  },
  
  setToken: (token) => {
    localStorage.setItem('token', token);
  },
  
  fetchUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, isLoading: false });
      return;
    }
    
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, isLoading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, isLoading: false });
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null });
    window.location.href = '/login';
  },
}));
