import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// Removed shadcn Alert in favor of custom borderless red message
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation() as any
  const { signIn } = useAuth()
  const presetUsername = location.state?.presetUsername || ''
  const [username, setUsername] = useState(presetUsername)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)

  const from = location.state?.from?.pathname || '/'

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await signIn(username, password)
    setLoading(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    // Optionally persist remember me preference
    try {
      localStorage.setItem('auth:remember', remember ? '1' : '0')
    } catch {}
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <div className="mb-4">
          <h1 className="text-3xl font-semibold text-gray-900 pb-1">Đăng nhập</h1>
          <p className="mt-1 text-sm text-gray-500">Đăng nhập để sử dụng dịch vụ.</p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-xs text-blue-600">Tài khoản</Label>
            <Input
              id="username"
              type="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tài khoản"
              className="h-11 rounded-lg focus-visible:ring-blue-600 focus-visible:border-blue-600"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs text-blue-600">Mật khẩu</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="h-11 rounded-lg pr-10 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
            <Label htmlFor="remember" className="text-sm text-gray-700">Ghi nhớ tôi</Label>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-lg text-base bg-blue-600 hover:bg-blue-600/90 text-white"
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Chưa có tài khoản?{' '}
          <Link to="/signup" className="text-blue-600 hover:underline">Tạo tài khoản</Link>
        </div>
      </div>
    </div>
  )
}
