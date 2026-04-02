import { create } from 'zustand'

interface AuthState {
  token: string | null
  role: 'ADMIN' | 'USER' | null
  setAuth: (token: string, role: 'ADMIN' | 'USER') => void
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  role: (localStorage.getItem('role') as 'ADMIN' | 'USER' | null),
  isAuthenticated: !!localStorage.getItem('token'),
  isAdmin: localStorage.getItem('role') === 'ADMIN',

  setAuth: (token, role) => {
    localStorage.setItem('token', token)
    localStorage.setItem('role', role)
    set({ token, role, isAuthenticated: true, isAdmin: role === 'ADMIN' })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    set({ token: null, role: null, isAuthenticated: false, isAdmin: false })
  },
}))
