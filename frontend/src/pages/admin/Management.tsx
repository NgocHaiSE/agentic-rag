import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/admin/layout/Sidebar'
import TabNavigation from '@/components/admin/TabNavigation'
import DocumentTypePanel from '@/components/admin/DocumentType'
import OrgUnitPanel from '@/components/admin/OrgUnitPanel'
import SitePanel from '@/components/admin/SitePanel'
import EquipmentPanel from '@/components/admin/EquipmentPanel'

export default function AdminUCList() {
  const [activeTab, setActiveTab] = useState('doctype')
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const tabs = [
    { value: 'doctype', label: 'Loại tài liệu' },
    { value: 'org', label: 'Đơn vị' },
    { value: 'site', label: 'Khu vực' },
    { value: 'equip', label: 'Thiết bị' },
    // { value: 'kw', label: 'Từ khóa' },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user ?? {}} signOut={signOut} navigate={navigate} />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quản lý thông tin và tài liệu</h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <TabNavigation tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            {activeTab === 'doctype' && <DocumentTypePanel />}
            {activeTab === 'org' && <OrgUnitPanel />}
            {activeTab === 'site' && <SitePanel />}
            {activeTab === 'equip' && <EquipmentPanel />}
          </div>
        </div>
      </div>
    </div>
  )
}