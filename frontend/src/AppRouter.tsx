import { Routes, Route, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import DocumentUploadPage from '@/components/UploadSingle'
import DocumentManagement from '@/components/DocumentManagement'
import DocumentAdmin from '@/pages/DocumentAdmin'
import LoginPage from '@/pages/Login'
import SignUpPage from '@/pages/SignUp'
import ForbiddenPage from '@/pages/Forbidden'
import ProtectedRoute from '@/routes/ProtectedRoute'
import App from './App'

export default function AppRouter() {
  const location = useLocation()
  const hideSidebar = location.pathname === '/login' || location.pathname === '/signup'
  return (
    <div className="flex h-screen">
      {!hideSidebar && <Sidebar />}
      <div className="flex-1">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>} />
          <Route path="/documents/upload" element={<ProtectedRoute><DocumentUploadPage /></ProtectedRoute>} />
          <Route path="/documents/manage" element={<ProtectedRoute><DocumentManagement /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><DocumentManagement /></ProtectedRoute>} />
          <Route path="/admin/documents" element={<ProtectedRoute roles={['admin']}><DocumentAdmin /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  )
}
