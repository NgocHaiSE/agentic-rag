import React, { useRef, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8058'

const categories = ['Báo cáo', 'Quy trình', 'Hướng dẫn', 'An toàn', 'Sản xuất', 'Quản lý', 'Kỹ thuật', 'Tài chính']
const suggestedTags = ['báo cáo', 'quy trình', 'hướng dẫn', 'an toàn', 'sản xuất']

export default function DocumentUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [access, setAccess] = useState<'public' | 'team' | 'private'>('public')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat(((bytes / Math.pow(k, i)) as number).toFixed(2)) + ' ' + sizes[i]
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setMsg(null)
    }
  }

  const chooseFile = () => fileInputRef.current?.click()

  const addSuggestedTag = (t: string) => {
    const cur = tags
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
    if (!cur.includes(t)) setTags([...cur, t].join(', '))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    if (!file) return setMsg({ type: 'error', text: 'Vui lòng chọn tệp tài liệu' })
    if (!title.trim()) return setMsg({ type: 'error', text: 'Vui lòng nhập tiêu đề tài liệu' })

    const formData = new FormData()
    formData.append('files', file)
    try {
      setUploading(true)
      setProgress(0)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${API_BASE_URL}/documents/upload`)
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
        }
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText || 'Upload failed')))
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(formData)
      })
      setUploading(false)
      setProgress(100)
      setMsg({ type: 'success', text: 'Tải lên thành công!' })
    } catch (err: any) {
      setUploading(false)
      setMsg({ type: 'error', text: err?.message || 'Upload thất bại' })
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="px-6 py-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tải lên Tài liệu</h1>
          <p className="text-gray-600">Chia sẻ tài liệu và tri thức với đồng nghiệp</p>
        </div>

        {/* Messages */}
        {msg && (
          <div className={`mb-6 p-4 rounded-lg border ${msg.type === 'success' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
            {msg.text}
          </div>
        )}

        {/* Single form card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <form className="p-8 space-y-8" onSubmit={submit}>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thông tin tài liệu</h2>
              <p className="text-gray-600">Điền thông tin để dễ dàng tìm kiếm và quản lý</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left */}
              <div className="space-y-6">
                {/* File field as text + button */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn tài liệu</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={file?.name || ''}
                      placeholder="Chưa chọn tệp"
                      className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={chooseFile}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Chọn tệp
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.mp4,.mov,.avi"
                      onChange={onFileChange}
                    />
                  </div>
                  {file && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span>Tên: {file.name}</span> • <span>Kích thước: {formatSize(file.size)}</span> • <span>Loại: {file.type || '—'}</span>
                      {uploading && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{progress}%</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề tài liệu *</label>
                  <input
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tiêu đề tài liệu..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phân loại</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Chọn phân loại...</option>
                    {categories.map((c) => (
                      <option key={c} value={c.toLowerCase()}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Thẻ tag</label>
                  <input
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: báo cáo, phân tích, dữ liệu..."
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Phân cách bằng dấu phẩy, ví dụ: báo cáo, phân tích, dữ liệu</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suggestedTags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors"
                        onClick={() => addSuggestedTag(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả</label>
                  <textarea
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={6}
                    placeholder="Mô tả ngắn gọn về nội dung tài liệu..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Access */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Quyền truy cập</h4>
                  <div className="space-y-3">
                    {[
                      { v: 'public', l: 'Công khai - Tất cả thành viên có thể xem' },
                      { v: 'team', l: 'Nhóm - Chỉ thành viên nhóm' },
                      { v: 'private', l: 'Riêng tư - Chỉ tôi có thể xem' },
                    ].map((opt) => (
                      <label key={opt.v} className="flex items-center">
                        <input
                          type="radio"
                          name="access"
                          value={opt.v}
                          checked={access === (opt.v as typeof access)}
                          onChange={() => setAccess(opt.v as typeof access)}
                          className="text-blue-500 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{opt.l}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                onClick={() => {
                  setFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                  setTitle('')
                  setDescription('')
                  setCategory('')
                  setTags('')
                  setAccess('public')
                  setProgress(0)
                  setMsg(null)
                }}
              >
                Xoá nội dung
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                disabled={uploading}
              >
                {uploading ? 'Đang tải lên...' : 'Tải lên tài liệu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

