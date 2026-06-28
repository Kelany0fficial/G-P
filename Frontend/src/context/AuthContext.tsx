import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '@/api/auth'
import { storage } from '@/utils/storage'
import { jwtDecode } from 'jwt-decode'
import type { LoginRequest, User, UserRole } from '@/types'

// JWT claims used only as a fallback when there is no cached User in localStorage
// (e.g. tab opened with a still-valid token from a session that pre-dates this build).
interface DecodedToken {
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': string
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': UserRole | UserRole[]
  email?: string
  unique_name?: string
  exp?: number
}

interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<User>
  logout: () => void
  hasRole: (...roles: UserRole[]) => boolean
  /** Patch the in-memory + persisted user (e.g. after avatar upload). */
  updateUser: (patch: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function userFromToken(token: string): User | null {
  try {
    const decoded = jwtDecode<DecodedToken>(token)
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null
    const rawRole = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
    const role = (Array.isArray(rawRole) ? rawRole[0] : rawRole) as UserRole
    if (!role) return null
    return {
      id: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
      email: decoded.email ?? '',
      userName: decoded.unique_name ?? (decoded.email ? decoded.email.split('@')[0] : ''),
      role,
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedToken = storage.getToken()
    if (savedToken) {
      // Prefer cached user (full LoginResponseDto fields). Fall back to JWT decode.
      const cached = storage.getUser<User>()
      const restored = cached ?? userFromToken(savedToken)
      if (restored) {
        setToken(savedToken)
        setUser(restored)
        if (!cached) storage.setUser(restored)
      } else {
        storage.clearAuth()
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authApi.login(data)
    const userData: User = {
      id: response.userId,
      email: response.email,
      userName: response.userName,
      profileImageUrl: response.profileImageUrl,
      role: response.role,
    }

    storage.setToken(response.token)
    storage.setUser(userData)
    setToken(response.token)
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    storage.clearAuth()
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((current) => {
      if (!current) return current
      const next = { ...current, ...patch }
      storage.setUser(next)
      return next
    })
  }, [])

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false
      return roles.includes(user.role)
    },
    [user]
  )

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!token && !!user,
      login,
      logout,
      hasRole,
      updateUser,
    }),
    [user, token, isLoading, login, logout, hasRole, updateUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
