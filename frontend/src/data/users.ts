import type { Account } from '@/types/auth'

// Demo/mock users. In production, replace with API-based auth.
export const USERS: Account[] = [
  {
    username: 'admin',
    password: 'admin123',
    fullName: 'Quản trị hệ thống',
    department: 'CNTT',
    domain: 'Hệ thống',
    title: 'Quản trị viên',
    role: 'admin',
  },
  {
    username: 'manager',
    password: 'manager123',
    fullName: 'Trưởng phòng Tài liệu',
    department: 'Tài liệu',
    domain: 'Quản trị tài liệu',
    title: 'Trưởng phòng',
    role: 'manager',
  },
  {
    username: 'user',
    password: 'user123',
    fullName: 'Người dùng chuẩn',
    department: 'Kinh doanh',
    domain: 'Bán hàng',
    title: 'Chuyên viên',
    role: 'user',
  },
]

