import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  username?: string
  email?: string
  firstName: string
  lastName?: string
  avatar?: string
  role: 'SELLER' | 'BLOGGER' | 'MANAGER' | 'ADMIN'
  balance: number
  referralCode: string
  isVerified: boolean
  telegramId?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),

      login: (user, token) => {
        set({ user, token, isLoading: false })
      },

      logout: () => {
        set({ user: null, token: null, isLoading: false })
        // Clear any other stores if needed
      },

      updateUser: (updates) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
)
