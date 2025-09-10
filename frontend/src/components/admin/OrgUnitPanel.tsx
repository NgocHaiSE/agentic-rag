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

type OrgUnit = { id: string; code?: string; name: string; parent_id?: string | null; parent_name?: string | null; is_active: boolean }

export default function OrgUnitPanel() {
  const [items, setItems] = useState<OrgUnit[]>([])
  const [newItem, setNewItem] = useState<any>({ code: '', name: '', parent_ref: '', child_ref: '', is_active: true })

  useEffect(() => {
    (async () => setItems(await jsonFetch(`${API_BASE_URL}/metadata/org-units`)))()
  }, [])

  const add = async () => {
    const payload: any = {
      code: (newItem.code || '').trim() || undefined,
      name: (newItem.name || '').trim(),
      parent_ref: (newItem.parent_ref || '').trim() || undefined,
      child_ref: (newItem.child_ref || '').trim() || undefined,
      is_active: newItem.is_active !== false,
    }
    const created = await jsonFetch<OrgUnit>(`${API_BASE_URL}/metadata/org-units`, { method: 'POST', body: JSON.stringify(payload) })
    setItems([created, ...items])
    setNewItem({ code: '', name: '', parent_ref: '', child_ref: '', is_active: true })
  }

  const save = async (idx: number, row: OrgUnit) => {
    const payload: any = { code: row.code, name: row.name, parent_id: row.parent_id, is_active: row.is_active }
    const saved = await jsonFetch<OrgUnit>(`${API_BASE_URL}/metadata/org-units/${row.id}`, { method: 'PUT', body: JSON.stringify(payload) })
    const copy = [...items]
    copy[idx] = saved
    setItems(copy)
  }

  const del = async (idx: number, id: string) => {
    if (!confirm('Bạn có chắc muốn xóa mục này?')) return
    await jsonFetch(`${API_BASE_URL}/metadata/org-units/${id}`, { method: 'DELETE' })
    setItems(items.filter((_, i) => i !== idx))
  }

  return (
    <div className="mt-6">
      <SectionHeader title="Đơn vị" subtitle="Quản lý cấu trúc tổ chức" />
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          placeholder="Mã đơn vị"
          value={newItem.code || ''}
          onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
          className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm"
        />
        <input
          placeholder="Tên đơn vị *"
          value={newItem.name || ''}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm"
        />
        <input
          placeholder="Đơn vị cấp trên"
          value={newItem.parent_ref || ''}
          onChange={(e) => setNewItem({ ...newItem, parent_ref: e.target.value })}
          className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm"
        />
        <input
          placeholder="Đơn vị cấp dưới"
          value={newItem.child_ref || ''}
          onChange={(e) => setNewItem({ ...newItem, child_ref: e.target.value })}
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
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Mã đơn vị</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Tên đơn vị</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Đơn vị cấp trên</th>
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
                <td className="px-6 py-4 text-sm text-gray-600">{it.parent_name || '-'}</td>
                <td className="px-6 py-4">
                  <InlineBoolean
                    value={it.is_active}
                    onChange={(v) => {
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