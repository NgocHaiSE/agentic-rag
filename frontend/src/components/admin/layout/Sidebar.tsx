import { useState } from 'react'
import { Menu, Home, Users, FileText, BarChart2, ChevronRight, ChevronDown } from 'lucide-react'

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

export default function Sidebar({ user, signOut, navigate }: NavbarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const getUserInitials = () => {
    if (!user?.fullName && !user?.username) return 'U'
    const src = user?.fullName || user?.username || 'U'
    return src.charAt(0).toUpperCase()
  }

  const navItems = [
    { path: '/admin/documents', label: 'Văn bản', icon: Home },
    { path: '/users', label: 'Người dùng', icon: Users },
    { path: '/admin/manage', label: 'Thông tin & tài liệu', icon: FileText, active: true },
    { path: '/reports', label: 'Báo cáo', icon: BarChart2 },
  ]

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-20 p-2 bg-white rounded-full shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-6 w-6 text-gray-600" />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 w-64 bg-white shadow-md transition-transform duration-300 z-10`}
      >
        {/* Sidebar Content */}
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-blue-600">Admin Dashboard</span>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="md:hidden p-1 text-gray-600 hover:text-gray-900"
                aria-label="Collapse sidebar"
              >
                {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center p-2 rounded-lg text-gray-600 hover:bg-gray-100 ${
                  item.active ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User Profile */}
          {user && (
            <div className="p-4 border-t border-gray-200">
              <div className="relative group">
                <button className="flex items-center space-x-2 w-full text-gray-600 hover:text-gray-900">
                  <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    {getUserInitials()}
                  </div>
                  <span className="text-sm font-medium truncate">{user.fullName || user.username}</span>
                </button>
                <div className="absolute bottom-full mb-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block">
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
            </div>
          )}
        </div>

        {/* Overlay for Mobile */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-0"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}
      </div>
    </>
  )
}