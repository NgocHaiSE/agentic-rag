import { Routes, Route, useLocation } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import DocumentUploadPage from '@/components/Upload'
import DocumentAdmin from '@/pages//admin/DocumentManagement'
import LoginPage from '@/pages/Login'
import SignUpPage from '@/pages/Signup'
import ForbiddenPage from '@/pages/Forbidden'
import Management from '@/pages/admin/Management'
import ProtectedRoute from '@/routes/ProtectedRoute'
import DepartmentList from '@/pages/DepartmentList'
import DepartmentDocuments from '@/pages/DepartmentDocuments'
const DocumentDetail = lazy(() => import('@/components/document/DocumentDetail'))
import App from './App'

export default function AppRouter() {
  const location = useLocation()
  const hideSidebar = location.pathname === '/login' || location.pathname === '/signup' || location.pathname.startsWith('/admin')
  return (
    <div className="flex h-screen overflow-hidden">
      {!hideSidebar && <Sidebar />}
      <div className="flex-1 h-screen overflow-y-auto">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>} />
          <Route path="/documents/upload" element={<ProtectedRoute><DocumentUploadPage /></ProtectedRoute>} />
          <Route path="/admin/documents" element={<ProtectedRoute roles={['admin']}><DocumentAdmin /></ProtectedRoute>} />
          <Route path="/admin/manage" element={<ProtectedRoute roles={['admin']}><Management /></ProtectedRoute>} />
          <Route path="/documents/manage" element={<ProtectedRoute><DepartmentList /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><DepartmentList /></ProtectedRoute>} />
          <Route path="/documents/shelf/:shelfId" element={<ProtectedRoute><DepartmentDocuments /></ProtectedRoute>} />
          <Route
            path="/documents/shelf/:shelfId/:docId"
            element={
              <ProtectedRoute>
                <Suspense fallback={null}>
                  <DocumentDetail />
                </Suspense>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  )
}
