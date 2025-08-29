import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow p-8 text-center border">
        <div className="text-6xl mb-2">🚫</div>
        <h1 className="text-2xl font-bold">403 - Không có quyền truy cập</h1>
        <p className="text-gray-600 mt-2">Bạn không có quyền để xem trang này. Vui lòng quay lại trang chủ hoặc liên hệ quản trị viên.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/">
            <Button>Về trang chủ</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline">Đăng nhập tài khoản khác</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

