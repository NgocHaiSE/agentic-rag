import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function AvatarMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const getUserInitials = () => {
    if (!user?.fullName && !user?.username) return 'U'
    const src = user?.fullName || user?.username || 'U'
    return src.charAt(0).toUpperCase()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="px-2">
          <Avatar className="h-8 w-8 bg-blue-100 text-blue-600">
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-zinc-50">
        <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>{user.title} - {user.domain}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/settings')}>Cài đặt</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/')}>Giao diện khách</DropdownMenuItem>
        <DropdownMenuItem onClick={() => { signOut(); navigate('/login') }}>Đăng xuất</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

