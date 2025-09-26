import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Home,
  Settings,
  HardDrive,
  HelpCircle,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  // ChevronRight,
  Upload,
  FolderOpen,
} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import type { MouseEvent as ReactMouseEvent } from "react"
import { useAuth } from "@/context/AuthContext"
import Micco from "../../assets/micco.png"

// Custom CSS for animations
const customStyles = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-10px);
    }
  }
  
  .animate-slideIn {
    animation: slideIn 0.3s ease-out forwards;
  }
  
  .animate-slideOut {
    animation: slideOut 0.2s ease-in forwards;
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = customStyles
  if (!document.head.querySelector('style[data-sidebar-animations]')) {
    styleElement.setAttribute('data-sidebar-animations', 'true')
    document.head.appendChild(styleElement)
  }
}

// App version - in a real app this would come from environment variables or build config
// const APP_VERSION = "v1.0.0"

type SidebarSubitem = { name: string; icon: React.ElementType; path: string }
type SidebarItem = { name: string; icon: React.ElementType; path: string; subitems: SidebarSubitem[] }

const sidebarItems = [
  { name: "Trang chủ", icon: Home, path: "/", subitems: [] },
  {
    name: "Tài liệu",
    icon: FolderOpen,
    path: "/documents",
    subitems: [
      { name: "Upload", icon: Upload, path: "/documents/upload" },
      { name: "Quản lý tài liệu", icon: FolderOpen, path: "/documents/manage" },
      { name: "Danh sách", icon: FolderOpen, path: "/documents" },
    ]
  },
  // { name: "Admin", icon: Brain, path: "/admin", 
  //   subitems: [
  //     { name: "Tài liệu", icon: FolderOpen, path: "/admin/documents"}
  //   ] },
]
const bottomItems = [
  { name: "Cài đặt", icon: Settings, path: "/settings" },
  { name: "Hỗ trợ", icon: HelpCircle, path: "/help" },
  { name: "Lưu trữ", icon: HardDrive, path: "/storage" },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [expanded, setExpanded] = useState(true)
  const [expandedItems, setExpandedItems] = useState<Record<string | number, boolean>>({})
  const visibleSidebarItems = (user?.role === 'admin')
    ? sidebarItems
    : sidebarItems.filter((i) => i.name !== 'Admin')

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.fullName && !user?.username) return "U"
    const src = user.fullName || user.username
    return src.charAt(0).toUpperCase()
  }

  const toggleSubmenu = (itemName: string | number, event: ReactMouseEvent<HTMLButtonElement>) => {
    event?.preventDefault()
    event?.stopPropagation()
    
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }))
  }

  const isItemActive = (item: SidebarItem) => {
    if (location.pathname === item.path) return true
    return item.subitems?.some((subitem: SidebarSubitem) => location.pathname === subitem.path)
  }

  const renderMainItem = (item: SidebarItem) => {
    const hasSubitems = item.subitems?.length > 0
    const isExpanded = expandedItems[item.name]
    const isActive = isItemActive(item)

    // Common button styling - same for all items
    const buttonClassName = cn(
      "w-full text-gray-700 hover:text-blue-600 hover:bg-blue-50",
      "transition-all duration-200",
      "hover:translate-x-1 active:scale-95",
      isActive && "bg-blue-50 text-blue-600 font-medium",
      expanded ? "justify-start pl-4" : "justify-center px-2"
    )

    if (hasSubitems && expanded) {
      // Item with subitems - clickable to toggle
      return (
        <Button
          variant="ghost"
          size="sm"
          className={buttonClassName}
          onClick={(e) => toggleSubmenu(item.name, e)}
        >
          <div className="flex items-center w-full">
            <item.icon className={cn("h-5 w-5 transition-colors group-hover:text-blue-600", expanded ? "mr-3" : "")} />
            {expanded && <span className="text-sm flex-1 text-left">{item.name}</span>}
            {hasSubitems && (
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform duration-200 ml-auto",
                  isExpanded ? "rotate-180" : ""
                )} 
              />
            )}
          </div>
        </Button>
      )
    } else {
      // Item without subitems or collapsed - link to path
      return (
        <Link to={item.path} className="block">
          <Button
            variant="ghost"
            size="sm"
            className={buttonClassName}
          >
            <div className="flex items-center w-full">
              <item.icon className={cn("h-5 w-5 transition-colors group-hover:text-blue-600", expanded ? "mr-3" : "")} />
              {expanded && <span className="text-sm flex-1 text-left">{item.name}</span>}
            </div>
          </Button>
        </Link>
      )
    }
  }

  return (
    <div className={cn(
      // Keep layout sidebar fixed while main content scrolls
      "sticky top-0 h-screen flex flex-col border-r border-blue-100 bg-white transition-all duration-300 ease-in-out",
      expanded ? "w-60" : "w-20"
    )}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-blue-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={Micco} alt="Micco" width={32} height={32} />
          {expanded && <span className="text-xl font-bold text-blue-600">Micco</span>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExpanded(!expanded)}
          className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
        >
          {expanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </Button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleSidebarItems.map((item) => (
          <div key={item.name}>
            {renderMainItem(item)}
            {expandedItems[item.name] && expanded && item.subitems.length > 0 && (
              <div className="space-y-1 pb-1">
                {item.subitems.map((subitem, index) => (
                  <Link key={subitem.name} to={subitem.path}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full flex items-center justify-start text-gray-600 hover:text-blue-600 hover:bg-blue-50 pl-12",
                        "transform transition-all duration-200",
                        "hover:translate-x-1 hover:scale-[1.02]",
                        location.pathname === subitem.path && "bg-blue-50 text-blue-600 font-medium translate-x-1 scale-[1.02]",
                        expandedItems[item.name] 
                          ? `animate-slideIn` 
                          : "animate-slideOut"
                      )}
                      style={{
                        animationDelay: expandedItems[item.name] ? `${index * 50}ms` : '0ms'
                      }}
                    >
                      <subitem.icon className="h-4 w-4 mr-2 transition-colors" />
                      <span className="text-sm transition-all duration-200 text-left">{subitem.name}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className={cn("space-y-1 border-t border-blue-100 pt-3 mt-auto", expanded ? "px-3" : "px-2")}>
        {bottomItems.map((item) => (
          <Link key={item.name} to={item.path} className="block">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full text-gray-700 hover:text-blue-600 hover:bg-blue-50",
                "transition-all duration-200 hover:translate-x-1 active:scale-95",
                location.pathname === item.path && "bg-blue-50 text-blue-600 font-medium",
                expanded ? "justify-start" : "justify-center px-2"
              )}
            >
              <item.icon className={cn("h-5 w-5", expanded ? "mr-3" : "")} />
              {expanded && item.name}
            </Button>
          </Link>
        ))}
      </div>

      {/* User Section */}
      <div className={cn("pt-3 border-t border-blue-100 mt-2", expanded ? "px-3" : "px-2")}>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full hover:bg-blue-50 px-2 transition-all duration-200",
                  expanded ? "justify-start" : "justify-center"
                )}
              >
                <Avatar className="h-8 w-8 bg-blue-100 text-blue-600 shrink-0">
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                {expanded && (
                  <div className="flex flex-col items-start text-sm ml-2">
                    <span className="font-medium text-gray-900">{user.fullName || user.username}</span>
                    <span className="text-xs text-gray-500">{user.department} • {user.role}</span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-blue-100 shadow-md rounded-md">
              {user.role === 'admin' && (
                <DropdownMenuItem onClick={() => navigate('/admin/manage')} className="text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                  Chuyển sang giao diện Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuLabel className="text-blue-600">Tài khoản</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-blue-100" />
              <DropdownMenuItem disabled className="text-gray-600">{user.title} - {user.domain}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                Cài đặt
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-blue-100" />
              <DropdownMenuItem onClick={() => { signOut(); navigate('/login') }} className="text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" className="w-full hover:bg-blue-50 text-gray-700 hover:text-blue-600" onClick={() => navigate('/login')}>
            {expanded ? 'Đăng nhập' : <BookOpen className="h-5 w-5" />}
          </Button>
        )}
      </div>
    </div>
  )
}


