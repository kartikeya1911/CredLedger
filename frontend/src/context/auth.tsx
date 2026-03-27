import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { create } from 'zustand'
import { login as apiLogin, register as apiRegister, fetchMe } from '../api'
import { setAuthToken } from '../api/client'
import type { Role, User } from '../api/types'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  setLoading: (loading: boolean) => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('accessToken'),
  loading: true,
  setLoading: (loading) => set({ loading }),
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
}))

const AuthContext = createContext<{
  user: User | null
  loading: boolean
  login: (emailOrPhone: string, password: string) => Promise<void>
  register: (role: Role, email: string, password: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}>(
  {
    user: null,
    loading: true,
    login: async () => undefined,
    register: async () => undefined,
    logout: () => {},
    refresh: async () => undefined,
  },
)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading, setUser, setToken, setLoading } = useAuthStore()
  const [bootstrapping, setBootstrapping] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function bootstrap() {
      const saved = localStorage.getItem('accessToken')

      if (!saved) {
        setUser(null)
        setToken(null)
        setAuthToken(null)
        setBootstrapping(false)
        setLoading(false)
        // Don't navigate — let React Router wrappers handle routing
        return
      }

      setAuthToken(saved)
      try {
        const me = await fetchMe()
        if (me) {
          setUser(me)
          setToken(saved)
        } else {
          throw new Error('Invalid token')
        }
      } catch {
        toast.error('Session expired. Please sign in again.')
        setAuthToken(null)
        setToken(null)
        setUser(null)
        navigate('/auth', { replace: true })
      } finally {
        setBootstrapping(false)
        setLoading(false)
      }
    }
    void bootstrap()
  }, [navigate, setLoading, setToken, setUser])

  const value = useMemo(
    () => ({
      user,
      loading: loading || bootstrapping,
      login: async (emailOrPhone: string, password: string) => {
        try {
          setLoading(true)
          const { user: u, token: t } = await apiLogin(emailOrPhone, password)
          setUser(u)
          setToken(t)
          toast.success('Welcome back')
          navigate('/dashboard', { replace: true })
        } catch (err) {
          toast.error('Login failed. Check your credentials.')
          throw err
        } finally {
          setLoading(false)
        }
      },
      register: async (role: Role, email: string, password: string) => {
        try {
          setLoading(true)
          const { user: u, token: t } = await apiRegister(role, email, password)
          setUser(u)
          setToken(t)
          toast.success('Account created')
          navigate('/dashboard', { replace: true })
        } catch (err) {
          toast.error('Registration failed')
          throw err
        } finally {
          setLoading(false)
        }
      },
      logout: () => {
        setAuthToken(null)
        setToken(null)
        setUser(null)
        setLoading(false)
        navigate('/auth', { replace: true })
      },
      refresh: async () => {
        try {
          const me = await fetchMe()
          if (me) {
            setUser(me)
            return
          }
          throw new Error('Unable to refresh session')
        } catch {
          setAuthToken(null)
          setToken(null)
          setUser(null)
          navigate('/auth', { replace: true })
        }
      },
    }),
    [user, loading, bootstrapping, setUser, setToken, setLoading, navigate],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
