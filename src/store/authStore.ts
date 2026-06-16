import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  full_name?: string
  role?: string
  company_id?: string
}

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    if (data.user) {
      set({ user: { id: data.user.id, email: data.user.email ?? '', full_name: data.user.user_metadata?.full_name } })
    }
    return { error: null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },

  loadUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      set({ user: { id: user.id, email: user.email ?? '', full_name: user.user_metadata?.full_name }, loading: false })
    } else {
      set({ user: null, loading: false })
    }
  },
}))
