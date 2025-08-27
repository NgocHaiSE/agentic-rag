import { createContext, useContext } from 'react'

interface AuthContextValue {
  user: { email: string } | null
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: { email: 'user@example.com' },
  signOut: () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value: AuthContextValue = {
    user: { email: 'user@example.com' },
    signOut: () => {}
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}