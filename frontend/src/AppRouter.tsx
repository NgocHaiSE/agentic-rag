import { Routes, Route } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import DocumentUploadPage from '@/components/Upload'
import DocumentManagement from '@/components/DocumentManagement'
import App from './App'

export default function AppRouter() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/documents/upload" element={<DocumentUploadPage />} />
          <Route path="/documents/manage" element={<DocumentManagement />} />
          <Route path="/documents" element={<DocumentManagement />} />
        </Routes>
      </div>
    </div>
  )
}