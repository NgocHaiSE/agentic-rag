import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Account, Role } from '@/types/auth'
import { API_BASE_URL } from '@/lib/api'
import { USERS } from '@/data/users'

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
    const useMock = (import.meta as any).env?.VITE_AUTH_MOCK === '1' || (import.meta as any).env?.VITE_AUTH_MODE === 'mock'

    const doMock = (): SignInResult => {
      const found = USERS.find(u => u.username === username && u.password === password)
      if (!found) return { ok: false, error: 'Sai tài khoản hoặc mật khẩu' }
      const mapped: Account = {
        username: found.username,
        fullName: found.fullName,
        department: found.department,
        domain: found.domain,
        title: found.title,
        role: found.role,
      }
      setUser(mapped)
      try { localStorage.setItem('auth:session_id', `mock-${Date.now()}`) } catch {}
      return { ok: true }
    }

    if (useMock) return doMock()

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      if (!res.ok) {
        // If server is unreachable or returns error, attempt mock fallback
        try { return doMock() } catch {}
        const msg = await res.text()
        return { ok: false, error: msg || 'Đăng nhập thất bại' }
      }
      const data = await res.json()
      const u = data.user
      const mapped: Account = {
        id: u.id,
        username: u.username,
        fullName: u.full_name || u.username,
        department: u.department || '',
        domain: u.domain || '',
        title: u.title || '',
        role: u.role as Role,
      }
      setUser(mapped)
      try { localStorage.setItem('auth:session_id', data.session_id) } catch {}
      return { ok: true }
    } catch {
      // Network failure -> mock fallback
      const res = doMock()
      if (res.ok) return res
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
