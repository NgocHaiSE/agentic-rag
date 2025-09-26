import { useEffect, useState } from 'react'
import SectionHeader from './SectionHeader'
import InlineBoolean from './InlineBoolean'
import RowActions from './RowActions'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8058'

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

type Equipment = { id: string; code?: string; name: string; is_active: boolean }

export default function EquipmentPanel() {
  const [items, setItems] = useState<Equipment[]>([])
  const [newItem, setNewItem] = useState<Partial<Equipment>>({ code: '', name: '', is_active: true })

  useEffect(() => {
    (async () => setItems(await jsonFetch(`${API_BASE_URL}/metadata/equipment`)))()
  }, [])

  const add = async () => {
    const created = await jsonFetch<Equipment>(`${API_BASE_URL}/metadata/equipment`, { method: 'POST', body: JSON.stringify(newItem) })
    setItems([created, ...items])
    setNewItem({ code: '', name: '', is_active: true })
  }

  const save = async (idx: number, row: Equipment) => {
    const saved = await jsonFetch<Equipment>(`${API_BASE_URL}/metadata/equipment/${row.id}`, { method: 'PUT', body: JSON.stringify(row) })
    const copy = [...items]
    copy[idx] = saved
    setItems(copy)
  }

  const del = async (idx: number, id: string) => {
    if (!confirm('Bạn có chắc muốn xóa mục này?')) return
    await jsonFetch(`${API_BASE_URL}/metadata/equipment/${id}`, { method: 'DELETE' })
    setItems(items.filter((_, i) => i !== idx))
  }

  return (
    <div className="mt-6">
      <SectionHeader title="Thiết bị" subtitle="Quản lý danh mục thiết bị để gắn nhãn tài liệu" />
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          placeholder="Mã thiết bị"
          value={newItem.code || ''}
          onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
          className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm"
        />
        <input
          placeholder="Tên thiết bị *"
          value={newItem.name || ''}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm"
        />
        <button
          onClick={add}
          disabled={!(newItem.name || '').trim()}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Thêm
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Mã thiết bị</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Tên thiết bị</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Trạng thái</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Tùy chọn</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={it.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    value={it.code || ''}
                    onChange={(e) => {
                      const copy = [...items]
                      copy[idx] = { ...it, code: e.target.value }
                      setItems(copy)
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    value={it.name}
                    onChange={(e) => {
                      const copy = [...items]
                      copy[idx] = { ...it, name: e.target.value }
                      setItems(copy)
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </td>
                <td className="px-6 py-4">
                  <InlineBoolean
                    value={it.is_active}
                    onChange={(v : boolean) => {
                      const copy = [...items]
                      copy[idx] = { ...it, is_active: v }
                      setItems(copy)
                    }}
                  />
                </td>
                <td className="px-6 py-4">
                  <RowActions onSave={() => save(idx, items[idx])} onDelete={() => del(idx, it.id)} saving={undefined} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}