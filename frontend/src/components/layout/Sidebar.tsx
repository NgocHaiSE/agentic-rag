import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Home,
  Terminal,
  Settings,
  HardDrive,
  HelpCircle,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Brain,
  ChevronDown,
  ChevronRight,
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
const APP_VERSION = "v1.0.0"

type SidebarSubitem = { name: string; icon: React.ElementType; path: string }
type SidebarItem = { name: string; icon: React.ElementType; path: string; subitems: SidebarSubitem[] }

const sidebarItems = [
  { name: "Trang chủ", icon: Home, path: "/", subitems: [] },
  {
    name: "Tài liệu", 
    icon: Terminal,
    path: "/documents",
    subitems: [
      { name: "Upload", icon: Upload, path: "/documents/upload" },
      { name: "Quản lý tài liệu", icon: FolderOpen, path: "/documents/manage" },
      { name: "Tài liệu chính", icon: Terminal, path: "/documents" }
    ]
  },
  { name: "Admin", icon: Brain, path: "/admin", 
    subitems: [
      { name: "Tài liệu", icon: FolderOpen, path: "/admin/documents"}
    ] },
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
      "w-full text-gray-700 hover:text-gray-900 hover:bg-gray-100",
      "transition-all duration-200",
      "hover:translate-x-1 active:scale-95",
      isActive && "bg-gray-100 text-gray-900 font-medium",
      expanded ? "justify-between pr-2" : "justify-center px-2"
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
          <div className="flex items-center">
            <item.icon className="h-5 w-5 mr-3" />
            <span>{item.name}</span>
          </div>
          <div className="transition-transform duration-300 ease-in-out">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </Button>
      )
    } else if (!hasSubitems) {
      // Item without subitems - full width clickable area
      return (
        <Link to={item.path} className="block w-full">
          <Button
            variant="ghost"
            size="sm"
            className={buttonClassName}
          >
            <div className="flex items-center">
              <item.icon className={cn("h-5 w-5", expanded ? "mr-3" : "")} />
              {expanded && <span>{item.name}</span>}
            </div>
            {/* Empty div to maintain consistent spacing */}
            {expanded && <div className="w-4" />}
          </Button>
        </Link>
      )
    } else {
      // Collapsed sidebar with subitems - navigate to main path
      return (
        <Link to={item.path} className="block w-full">
          <Button
            variant="ghost"
            size="sm"
            className={buttonClassName}
          >
            <item.icon className="h-5 w-5" />
          </Button>
        </Link>
      )
    }
  }

  return (
    <div className={cn(
      "flex h-screen flex-col justify-between border-r bg-gray-50 text-gray-700 pb-4 transition-all duration-300 relative",
      expanded ? "w-56" : "w-16"
    )}>
      {/* Logo and Version */}
      <div className="flex items-center px-4 h-16 border-b border-gray-200 justify-between">
        {expanded ? (
          <>
            <div className="flex items-center">
              <span className="text-xl font-semibold">Micco</span>
              <span className="text-xs text-gray-500 ml-2">{APP_VERSION}</span>
            </div>
          </>
        ) : (
          <BookOpen className="h-6 w-6 mx-auto" />
        )}

        {/* Toggle Button - Integrated in header */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 ml-2 hover:bg-gray-100 rounded-md"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </Button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-auto py-4">
        <div className={cn("space-y-1", expanded ? "px-3" : "px-2")}>
          {(user ? visibleSidebarItems : [{ name: "Đăng nhập", icon: BookOpen, path: "/login", subitems: [] }]).map((item) => (
            <div key={item.name}>
              {/* Main Item */}
              {renderMainItem(item)}

              {/* Subitems */}
              {expanded && item.subitems?.length > 0 && (
                <div 
                  className={cn(
                    "ml-6 overflow-hidden transition-all duration-300 ease-in-out",
                    expandedItems[item.name] 
                      ? "max-h-96 opacity-100 mt-1" 
                      : "max-h-0 opacity-0 mt-0"
                  )}
                  style={{
                    transitionProperty: 'max-height, opacity, margin-top'
                  }}
                >
                  <div className="space-y-1 pb-1">
                    {item.subitems.map((subitem, index) => (
                      <Link key={subitem.name} to={subitem.path}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100 pl-2",
                            "transform transition-all duration-200 ease-in-out",
                            "hover:translate-x-1 hover:scale-[1.02]",
                            location.pathname === subitem.path && "bg-gray-100 text-gray-900 font-medium translate-x-1 scale-[1.02]",
                            expandedItems[item.name] 
                              ? `animate-slideIn` 
                              : "animate-slideOut"
                          )}
                          style={{
                            animationDelay: expandedItems[item.name] ? `${index * 50}ms` : '0ms'
                          }}
                        >
                          <subitem.icon className="h-4 w-4 mr-2 transition-transform duration-200" />
                          <span className="text-sm transition-all duration-200">{subitem.name}</span>
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className={cn("space-y-1 border-t border-gray-200 pt-3 mt-auto", expanded ? "px-3" : "px-2")}>
        {bottomItems.map((item) => (
          <Link key={item.name} to={item.path} className="block w-full">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full text-gray-700 hover:text-gray-900 hover:bg-gray-100",
                "transition-all duration-200 hover:translate-x-1 active:scale-95",
                location.pathname === item.path && "bg-gray-100 text-gray-900 font-medium",
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
      <div className={cn("pt-3 border-t border-gray-200 mt-2", expanded ? "px-3" : "px-2")}>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full hover:bg-gray-100 px-2 transition-all duration-200",
                  expanded ? "justify-start" : "justify-center"
                )}
              >
                <Avatar className="h-8 w-8 bg-blue-100 text-blue-600 shrink-0">
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                {expanded && (
                  <div className="flex flex-col items-start text-sm ml-2">
                    <span className="font-medium">{user.fullName || user.username}</span>
                    <span className="text-xs text-gray-500">{user.department} • {user.role}</span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-50">
              <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>{user.title} - {user.domain}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>Cài đặt</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { signOut(); navigate('/login') }}>Đăng xuất</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" className="w-full" onClick={() => navigate('/login')}>
            {expanded ? 'Đăng nhập' : <BookOpen className="h-5 w-5" />}
          </Button>
        )}
      </div>
    </div>
  )
}
