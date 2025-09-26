import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import OrgUnitTreeSelect, { type OrgUnit as OrgUnitNode } from '@/components/OrgTree'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8058'

const ACCEPTED_FILE_TYPES = '.pdf,.txt,.md,.markdown,.jpg,.jpeg,.png,.tif,.tiff,.bmp,.gif'
const OCR_ENABLED_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'tif', 'tiff', 'bmp', 'gif'])

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes)) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  return `${(mb / 1024).toFixed(1)} GB`
}

type Option = { id: string; name: string; code?: string }
type Equipment = { id: string; name: string }
type Keyword = { id: string; name: string }

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const { user } = useAuth()
  const [effectiveDate, setEffectiveDate] = useState('')
  const [access, setAccess] = useState<'public' | 'team' | 'private'>('public')

  // Required schema fields
  const [documentTypeId, setDocumentTypeId] = useState('')
  const [issuingUnitId, setIssuingUnitId] = useState('')
  const [siteId, setSiteId] = useState('')

  // Optional many-to-many
  const [equipmentIds, setEquipmentIds] = useState<string[]>([])
  const [keywordIds, setKeywordIds] = useState<string[]>([])

  // Options
  const [docTypes, setDocTypes] = useState<Option[]>([])
  const [orgUnits, setOrgUnits] = useState<OrgUnitNode[]>([])
  const [sites, setSites] = useState<Option[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([])

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const fileDetails = useMemo(() => {
    if (!file) return null
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    return {
      extension,
      sizeLabel: formatFileSize(file.size),
      usesOcr: OCR_ENABLED_EXTENSIONS.has(extension),
    }
  }, [file])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setMsg(null)
    }
  }

  const chooseFile = () => fileInputRef.current?.click()

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [dt, ou, st, eq, kw] = await Promise.all([
          fetch(`${API_BASE_URL}/metadata/document-types`).then((r) => r.json()),
          fetch(`${API_BASE_URL}/metadata/org-units`).then((r) => r.json()),
          fetch(`${API_BASE_URL}/metadata/sites`).then((r) => r.json()),
          fetch(`${API_BASE_URL}/metadata/equipment`).then((r) => r.json()),
          fetch(`${API_BASE_URL}/metadata/keywords`).then((r) => r.json()),
        ])
        setDocTypes(dt || [])
        setOrgUnits(ou || [])
        setSites(st || [])
        setEquipment(eq || [])
        setKeywords(kw || [])
      } catch (e) {
        console.error('Failed to load metadata options', e)
      }
    }
    fetchOptions()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    if (!file) return setMsg({ type: 'error', text: 'Please select a document file' })
    if (!title.trim()) return setMsg({ type: 'error', text: 'Please enter a document title' })
    if (!documentTypeId) return setMsg({ type: 'error', text: 'Please select a document type' })
    if (!issuingUnitId) return setMsg({ type: 'error', text: 'Please select an issuing unit' })
    if (!siteId) return setMsg({ type: 'error', text: 'Please select a site' })

    const formData = new FormData()
    formData.append('files', file)
    formData.append('document_type_id', documentTypeId)
    formData.append('issuing_unit_id', issuingUnitId)
    formData.append('site_id', siteId)
    formData.append('title_override', title)
    // Prefer server-side session, but also include author_id explicitly if available
    if (user?.id) formData.append('author_id', user.id)
    if (description.trim()) formData.append('description', description.trim())
    if (effectiveDate) formData.append('effective_date', effectiveDate)
    if (access) formData.append('access_level', access)
    if (equipmentIds.length) formData.append('equipment_ids', equipmentIds.join(','))
    if (keywordIds.length) formData.append('keyword_ids', keywordIds.join(','))

    try {
      setUploading(true)
      setProgress(0)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${API_BASE_URL}/documents/upload`)
        try {
          const sess = localStorage.getItem('auth:session_id')
          if (sess) xhr.setRequestHeader('X-Session-Id', sess)
        } catch {}
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
        }
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText || 'Upload failed')))
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(formData)
      })
      setUploading(false)
      setProgress(100)
      setMsg({ type: 'success', text: 'Document uploaded successfully!' })
    } catch (err: any) {
      setUploading(false)
      setMsg({ type: 'error', text: err?.message || 'Upload failed' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8">
      <div className="max-w-5xl w-full mx-4">
        {msg && (
          <div
            className={`mb-6 p-4 rounded-lg shadow-sm border-l-4 ${
              msg.type === 'success'
                ? 'bg-green-50 border-green-400 text-green-700'
                : 'bg-red-50 border-red-400 text-red-700'
            } transition-all duration-300`}
            role="alert"
          >
            {msg.text}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={submit} className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Tải tài liệu lên</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tệp tài liệu <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      readOnly
                      value={file?.name || ''}
                      placeholder="Chưa chọn tệp"
                      className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      aria-label="Selected file"
                    />
                    <button
                      type="button"
                      onClick={chooseFile}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      Chọn tệp
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept={ACCEPTED_FILE_TYPES}
                      onChange={onFileChange}
                    />
                  </div>
                  {file && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5">{progress}%</p>
                      {fileDetails && (
                        <p className="text-xs text-gray-500 mt-1">
                          {`Kích thước: ${fileDetails.sizeLabel} • Định dạng: ${fileDetails.extension ? `.${fileDetails.extension}` : 'không xác định'}`}
                          {fileDetails.usesOcr ? ' • Sẽ trích xuất nội dung bằng OCR' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tên tài liệu <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm"
                    placeholder="Nhập tên tài liệu..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    aria-required="true"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Loại tài liệu <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm"
                    value={documentTypeId}
                    onChange={(e) => setDocumentTypeId(e.target.value)}
                    aria-required="true"
                  >
                    <option value="">Chọn loại tài liệu...</option>
                    {docTypes.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Khu vực/ Mỏ <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm"
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    aria-required="true"
                  >
                    <option value="">Chọn khu vực/ mỏ...</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
                  <textarea
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm"
                    rows={7}
                    placeholder="Mô tả ngắn gọn nội dung tài liệu..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Keywords</label>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((k) => {
                      const checked = keywordIds.includes(k.id)
                      return (
                        <label
                          key={k.id}
                          className={`inline-flex items-center px-3 py-1.5 text-sm rounded-full border cursor-pointer transition-colors ${
                            checked
                              ? 'bg-blue-100 border-blue-300 text-blue-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={checked}
                            onChange={(ev) =>
                              setKeywordIds((prev) =>
                                ev.target.checked ? Array.from(new Set([...prev, k.id])) : prev.filter((x) => x !== k.id)
                              )
                            }
                            aria-label={`Select keyword ${k.name}`}
                          />
                          {k.name}
                        </label>
                      )
                    })}
                  </div>
                </div> */}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Đơn vị ban hành <span className="text-red-500">*</span>
                  </label>
                  <OrgUnitTreeSelect
                    items={orgUnits}
                    value={issuingUnitId}
                    onChange={setIssuingUnitId}
                    className="w-full"
                  />
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Người tạo</label>
                  <div className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600 shadow-sm">
                    {user?.fullName || user?.username || 'Không xác định'}
                  </div>
                </div> */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày hiệu lực</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                  />
                </div>

                

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Thiết bị liên quan</label>
                  <div className="flex flex-wrap gap-2">
                    {equipment.map((e) => {
                      const checked = equipmentIds.includes(e.id)
                      return (
                        <label
                          key={e.id}
                          className={`inline-flex items-center px-3 py-1.5 text-sm rounded-full border cursor-pointer transition-colors ${
                            checked
                              ? 'bg-blue-100 border-blue-300 text-blue-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={checked}
                            onChange={(ev) =>
                              setEquipmentIds((prev) =>
                                ev.target.checked ? Array.from(new Set([...prev, e.id])) : prev.filter((x) => x !== e.id)
                              )
                            }
                            aria-label={`Select equipment ${e.name}`}
                          />
                          {e.name}
                        </label>
                      )
                    })}
                  </div>
                </div> */}

                <div className="bg-gray-50 rounded-lg p-5 shadow-sm">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Quyền truy cập</h4>
                  <div className="space-y-2.5">
                    {[
                      { v: 'public', l: 'Công khai - Tất cả thành viên đều có thể xem' },
                      { v: 'team', l: 'Nhóm - Chỉ thành viên trong nhóm' },
                      { v: 'private', l: 'Riêng tư - Chỉ mình tôi có thể xem' },
                    ].map((opt) => (
                      <label key={opt.v} className="flex items-center">
                        <input
                          type="radio"
                          name="access"
                          value={opt.v}
                          checked={access === opt.v}
                          onChange={() => setAccess(opt.v as typeof access)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          aria-label={`Set access to ${opt.l}`}
                        />
                        <span className="ml-2 text-sm text-gray-600">{opt.l}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors shadow-sm"
                onClick={() => {
                  setFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                  setTitle('')
                  setDescription('')
                  setEffectiveDate('')
                  setDocumentTypeId('')
                  setIssuingUnitId('')
                  setSiteId('')
                  setEquipmentIds([])
                  setKeywordIds([])
                  setAccess('public')
                  setProgress(0)
                  setMsg(null)
                }}
              >
                Xóa nội dung
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploading}
              >
                {uploading ? 'Đang tải lên...' : 'Tải lên'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
