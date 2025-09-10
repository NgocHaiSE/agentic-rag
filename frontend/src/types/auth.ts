export type Role = 'admin' | 'manager' | 'user'

export interface Account {
  id?: string
  username: string
  password?: string
  fullName: string
  department: string
  domain: string // Lĩnh vực
  title: string // Vai trò/chức danh
  role: Role
}

export interface AuthState {
  user: Account | null
}
