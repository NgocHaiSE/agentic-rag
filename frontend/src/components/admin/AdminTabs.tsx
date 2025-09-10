type Tab = { value: string; label: string }

export default function AdminTabs({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  const tabs: Tab[] = [
    { value: 'doctype', label: 'Loại tài liệu' },
    { value: 'org', label: 'Đơn vị' },
    { value: 'site', label: 'Khu vực' },
    { value: 'equip', label: 'Thiết bị' },
    { value: 'kw', label: 'Từ khóa' },
  ]

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-4 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              active === tab.value
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            aria-current={active === tab.value ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

