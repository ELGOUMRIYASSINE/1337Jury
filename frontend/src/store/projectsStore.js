// 42Nexus - Projects Store
// This file is for: FATYZA (Frontend Developer)
// Description: Zustand store for projects

import { create } from 'zustand';
import api from '../services/api';

export const useProjectsStore = create((set) => ({
  projects: [],
  isLoading: false,
  
  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/projects');
      set({ projects: data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      set({ isLoading: false });
    }
  },
}));
