// 1337Jury - Authentication Store
// This file is for: FATYZA (Frontend Developer)
// Description: Zustand store for auth state management
// Auth Store - FATYZA
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,

      setToken: (token) => set({ token }),

      fetchUser: async () => {
        const { token } = get()
        if (!token) return
        
        set({ isLoading: true })
        try {
          const { data } = await authApi.getMe(token)
          set({ user: data, isLoading: false })
        } catch (error) {
          console.error('Failed to fetch user:', error)
          set({ token: null, user: null, isLoading: false })
        }
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ token: null, user: null })
      },
    }),
    {
      name: '1337jury-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
)