import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Account, Role } from '@/types/auth'
import { API_BASE_URL } from '@/lib/api'

type SignInResult = { ok: true } | { ok: false; error: string }

interface AuthContextValue {
  user: Account | null
  signIn: (username: string, password: string) => Promise<SignInResult>
  signOut: () => void
  hasRole: (roles: Role | Role[]) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = 'auth:user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Account | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setUser(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [user])

  const signIn = async (username: string, password: string): Promise<SignInResult> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      if (!res.ok) {
        const msg = await res.text()
        return { ok: false, error: msg || 'Đăng nhập thất bại' }
      }
      const data = await res.json()
      const u = data.user
      const mapped = {
        username: u.username,
        fullName: u.full_name || u.username,
        department: u.department || '',
        domain: u.domain || '',
        title: u.title || '',
        role: u.role as Role,
      }
      setUser(mapped)
      // Optionally persist session_id if needed for later API calls
      localStorage.setItem('auth:session_id', data.session_id)
      return { ok: true }
    } catch {
      return { ok: false, error: 'Không thể kết nối tới máy chủ' }
    }
  }

  const signOut = () => setUser(null)

  const hasRole = (roles: Role | Role[]) => {
    if (!user) return false
    const arr = Array.isArray(roles) ? roles : [roles]
    return arr.includes(user.role)
  }

  const value = useMemo<AuthContextValue>(() => ({ user, signIn, signOut, hasRole }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
