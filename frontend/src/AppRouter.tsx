import { Routes, Route, useLocation } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import DocumentUploadPage from '@/components/Upload'
import DepartmentList from '@/pages/DepartmentList'
import DepartmentDocuments from '@/pages/DepartmentDocuments'
import AdminUCList from '@/pages/AdminUCList'
import AdminIngest from '@/pages/AdminIngest'
import LoginPage from '@/pages/Login'
import SignUpPage from '@/pages/SignUp'
import ForbiddenPage from '@/pages/Forbidden'
import ProtectedRoute from '@/routes/ProtectedRoute'
import App from './App'
const DocumentDetail = lazy(() => import('@/components/document/DocumentDetail'))

export default function AppRouter() {
  const location = useLocation()
  const hideSidebar = location.pathname === '/login' || location.pathname === '/signup' || location.pathname.startsWith('/admin')
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
          <Route path="/admin/metadata" element={<ProtectedRoute roles={['admin']}><AdminUCList /></ProtectedRoute>} />
          <Route path="/admin/ingest" element={<ProtectedRoute roles={['admin']}><AdminIngest /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  )
}
