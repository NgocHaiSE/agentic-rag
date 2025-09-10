import { useState } from 'react'
import { Menu, X } from 'lucide-react'

interface NavbarProps {
  user: {
    fullName?: string
    username?: string
    title?: string
    domain?: string
  }
  signOut: () => void
  navigate: (path: string) => void
}

export default function Navbar({ user, signOut, navigate }: NavbarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const getUserInitials = () => {
    if (!user?.fullName && !user?.username) return 'U'
    const src = user?.fullName || user?.username || 'U'
    return src.charAt(0).toUpperCase()
  }

  const navItems = [
    { path: '/dashboard', label: 'Bảng điều khiển' },
    { path: '/users', label: 'Người dùng' },
    { path: '/metadata', label: 'Metadata', active: true },
    { path: '/reports', label: 'Báo cáo' },
  ]

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-600">Admin Dashboard</span>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`border-b-2 text-gray-600 hover:text-gray-900 hover:border-blue-500 px-3 py-2 text-sm font-medium transition-colors ${
                    item.active ? 'border-blue-500 text-blue-600' : 'border-transparent'
                  }`}
                  aria-current={item.active ? 'page' : undefined}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            {user && (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                  <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    {getUserInitials()}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{user.fullName || user.username}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                  <div className="px-4 py-2 text-sm text-gray-700">{user.title} - {user.domain}</div>
                  <button
                    onClick={() => navigate('/settings')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Cài đặt
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Giao diện khách
                  </button>
                  <button
                    onClick={() => { signOut(); navigate('/login') }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {isSidebarOpen && (
        <div className="md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-10" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-20">
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <span className="text-xl font-bold text-blue-600">Admin Dashboard</span>
              <button onClick={() => setIsSidebarOpen(false)} aria-label="Close sidebar">
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setIsSidebarOpen(false); }}
                  className={`block w-full text-left px-3 py-2 text-base font-medium ${
                    item.active ? 'text-blue-600 bg-gray-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}