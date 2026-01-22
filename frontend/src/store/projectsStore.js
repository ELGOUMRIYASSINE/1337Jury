// 1337Jury - Projects Store
// This file is for: FATYZA (Frontend Developer)
// Description: Zustand store for projects
// Projects Store - FATYZA
import { create } from 'zustand'
import { projectsApi } from '../services/api'

export const useProjectsStore = create((set) => ({
  projects: [],
  selectedProject: null,
  isLoading: false,

  fetchProjects: async () => {
    set({ isLoading: true })
    try {
      const { data } = await projectsApi.list()
      set({ projects: data, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      set({ isLoading: false })
    }
  },

  setSelectedProject: (project) => set({ selectedProject: project }),
}))