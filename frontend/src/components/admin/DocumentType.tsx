import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
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

type DocumentType = { id: string; code: string; name: string; description?: string; is_active: boolean }

export default function DocumentTypePanel() {
  const [items, setItems] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newItem, setNewItem] = useState<Partial<DocumentType>>({ code: '', name: '', description: '', is_active: true })

  const fetchList = async () => {
    setLoading(true)
    setErr(null)
    try {
      const data = await jsonFetch<DocumentType[]>(`${API_BASE_URL}/metadata/document-types`)
      setItems(data)
    } catch (e: any) {
      setErr(e?.message || 'Không thể tải danh sách')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { fetchList() }, [])

  const addItem = async () => {
    try {
      setCreating(true)
      const created = await jsonFetch<DocumentType>(`${API_BASE_URL}/metadata/document-types`, {
        method: 'POST',
        body: JSON.stringify(newItem),
      })
      setItems([created, ...items])
      setNewItem({ code: '', name: '', description: '', is_active: true })
    } catch (e: any) {
      alert(e?.message || 'Tạo thất bại')
    } finally {
      setCreating(false)
    }
  }

  const saveRow = async (idx: number, row: DocumentType) => {
    const id = row.id
    const payload = { code: row.code, name: row.name, description: row.description, is_active: row.is_active }
    const saved = await jsonFetch<DocumentType>(`${API_BASE_URL}/metadata/document-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    const copy = [...items]
    copy[idx] = saved
    setItems(copy)
  }

  const deleteRow = async (idx: number, id: string) => {
    if (!confirm('Bạn có chắc muốn xóa mục này?')) return
    await jsonFetch(`${API_BASE_URL}/metadata/document-types/${id}`, { method: 'DELETE' })
    setItems(items.filter((_, i) => i !== idx))
  }

  return (
    <div className="mt-6">
      <SectionHeader title="Loại tài liệu" subtitle="Quản lý các loại tài liệu chuẩn" />
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          placeholder="Mã loại tài liệu"
          value={newItem.code || ''}
          onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
          className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm"
        />
        <input
          placeholder="Tên loại tài liệu *"
          value={newItem.name || ''}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm"
        />
        <input
          placeholder="Mô tả"
          value={newItem.description || ''}
          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
          className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm"
        />
        <button
          onClick={addItem}
          disabled={creating || !(newItem.name || '').trim()}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? 'Đang thêm...' : 'Thêm'}
        </button>
      </div>
      {err && (
        <div className="mb-6 flex items-start gap-2 rounded-lg bg-red-50 border-l-4 border-red-400 px-4 py-3 text-sm text-red-700" role="alert">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{err}</span>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Mã loại tài liệu</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Tên loại tài liệu</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Mô tả</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Trạng thái</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Tùy chọn</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <EditableDocTypeRow
              key={it.id}
              item={it}
              onSave={(row: DocumentType) => saveRow(idx, row)}
              onDelete={() => deleteRow(idx, it.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type EditableDocTypeRowProps = {
  item: DocumentType;
  onSave: (row: DocumentType) => void | Promise<void>;
  onDelete: () => void;
};

function EditableDocTypeRow({ item, onSave, onDelete }: EditableDocTypeRowProps) {
  const [row, setRow] = useState(item)
  const [saving, setSaving] = useState(false)

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-6 py-4">
        <input
          value={row.code || ''}
          onChange={(e) => setRow({ ...row, code: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
      </td>
      <td className="px-6 py-4">
        <input
          value={row.name}
          onChange={(e) => setRow({ ...row, name: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
      </td>
      <td className="px-6 py-4">
        <input
          value={row.description || ''}
          onChange={(e) => setRow({ ...row, description: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
      </td>
      <td className="px-6 py-4">
        <InlineBoolean value={row.is_active} onChange={(v: boolean) => setRow({ ...row, is_active: v })} />
      </td>
      <td className="px-6 py-4">
        <RowActions
          saving={saving}
          onSave={async () => {
            setSaving(true)
            try {
              await onSave(row)
            } finally {
              setSaving(false)
            }
          }}
          onDelete={onDelete}
        />
      </td>
    </tr>
  )
}