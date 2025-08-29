import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { API_BASE_URL } from '@/lib/api'

export default function SignUpPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [department, setDepartment] = useState('')
  const [domain, setDomain] = useState('')
  const [title, setTitle] = useState('')
  const [agree, setAgree] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!agree) {
      setError('Vui lòng đồng ý với điều khoản sử dụng')
      return
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    if (password !== confirm) {
      setError('Mật khẩu nhập lại không khớp')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          full_name: fullName,
          department: department || undefined,
          domain: domain || undefined,
          title: title || undefined,
        }),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Đăng ký thất bại')
      }

      setSuccess('Tạo tài khoản thành công! Vui lòng đăng nhập.')

      setTimeout(() => {
        navigate('/login', { replace: true, state: { presetUsername: username } })
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể kết nối tới máy chủ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <div className="mb-4">
          <h1 className="text-3xl font-semibold text-gray-900 pb-1">Tạo tài khoản</h1>
          <p className="mt-1 text-sm text-gray-500">Nhập thông tin để đăng ký tài khoản mới.</p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-xs text-blue-600">Họ và tên</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="h-11 rounded-lg focus-visible:ring-blue-600 focus-visible:border-blue-600"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-xs text-blue-600">Tài khoản</Label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tên đăng nhập"
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                className="h-11 rounded-lg pr-10 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-xs text-blue-600">Nhập lại mật khẩu</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="h-11 rounded-lg pr-10 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                required
              />
              <button
                type="button"
                aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department" className="text-xs text-blue-600">Phòng ban (tuỳ chọn)</Label>
              <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="VD: CNTT" className="h-11 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain" className="text-xs text-blue-600">Lĩnh vực (tuỳ chọn)</Label>
              <Input id="domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="VD: Hệ thống" className="h-11 rounded-lg" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title" className="text-xs text-blue-600">Chức danh (tuỳ chọn)</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Nhân viên" className="h-11 rounded-lg" />
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox id="agree" checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} />
            <Label htmlFor="agree" className="text-sm text-gray-700">
              Tôi đã đọc và đồng ý với <a className="text-blue-600 hover:underline" href="#">Điều khoản sử dụng</a>
            </Label>
          </div>

          <Button type="submit" className="w-full h-11 rounded-lg text-base bg-blue-600 hover:bg-blue-600/90 text-white" disabled={loading}>
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Đăng nhập</Link>
        </div>
      </div>
    </div>
  )
}

