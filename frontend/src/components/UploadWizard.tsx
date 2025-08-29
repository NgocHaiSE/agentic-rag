import React, { useRef, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8058'

const categories = [
  'Báo cáo',
  'Quy trình',
  'Hướng dẫn',
  'An toàn',
  'Sản xuất',
  'Quản lý',
  'Kỹ thuật',
  'Tài chính',
]

const suggestedTags = ['báo cáo', 'quy trình', 'hướng dẫn', 'an toàn', 'sản xuất']

export default function DocumentUploadPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
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

  const handleFileChoose = (f: File) => {
    setFile(f)
    setMsg(null)
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) handleFileChoose(f)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFileChoose(f)
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setProgress(0)
  }

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
    if (!file) return setMsg({ type: 'error', text: 'Vui lòng chọn file để upload' })
    if (!title.trim()) {
      setStep(2)
      return setMsg({ type: 'error', text: 'Vui lòng nhập tiêu đề tài liệu' })
    }

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

        {/* Steps */}
        <div className="mb-8 flex items-center justify-center space-x-4">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${step >= s ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}`}>{s}</div>
                <span className={`ml-2 text-sm font-medium ${step >= s ? 'text-blue-600' : 'text-gray-400'}`}>{s === 1 ? 'Chọn tệp' : s === 2 ? 'Thông tin' : 'Hoàn thành'}</span>
              </div>
              {s < 3 && (
                <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Messages */}
        {msg && (
          <div className={`mb-6 p-4 rounded-lg border ${msg.type === 'success' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
            {msg.text}
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <form className="p-8" onSubmit={submit}>
            {step === 1 && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Chọn tệp để tải lên</h2>
                  <p className="text-gray-600">Hỗ trợ PDF, Word, Excel, PowerPoint, hình ảnh và video</p>
                </div>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 cursor-pointer"
                  onDrop={onDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => !file && fileInputRef.current?.click()}
                >
                  {!file ? (
                    <>
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-lg font-medium text-gray-700 mb-2">Kéo thả tệp vào đây</p>
                      <p className="text-gray-500 mb-4">hoặc</p>
                      <button type="button" className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" onClick={() => fileInputRef.current?.click()}>
                        Chọn tệp từ máy tính
                      </button>
                      <p className="text-xs text-gray-400 mt-4">Kích thước tối đa: 50MB</p>
                    </>
                  ) : (
                    <div className="flex items-center justify-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
                        {uploading && (
                          <div className="mt-2">
                            <div className="w-64 bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{progress}%</p>
                          </div>
                        )}
                      </div>
                      <button type="button" className="p-2 text-gray-400 hover:text-red-500 transition-colors" onClick={removeFile}>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.mp4,.mov,.avi" onChange={onFileChange} />
                </div>
                <div className="flex justify-center mt-8">
                  <button type="button" className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => file && setStep(2)} disabled={!file}>
                    Tiếp theo
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Thông tin tài liệu</h2>
                  <p className="text-gray-600">Điền thông tin để dễ dàng tìm kiếm và quản lý</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề tài liệu *</label>
                      <input className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nhập tiêu đề tài liệu..." value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phân loại</label>
                      <select className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="">Chọn phân loại...</option>
                        {categories.map((c) => (
                          <option key={c} value={c.toLowerCase()}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Thẻ tag</label>
                      <input className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ví dụ: báo cáo, phân tích, dữ liệu..." value={tags} onChange={(e) => setTags(e.target.value)} />
                      <p className="text-xs text-gray-500 mt-1">Phân cách bằng dấu phẩy, ví dụ: báo cáo, phân tích, dữ liệu</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {suggestedTags.map((t) => (
                          <button key={t} type="button" className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors" onClick={() => addSuggestedTag(t)}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả</label>
                      <textarea className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={4} placeholder="Mô tả ngắn gọn về nội dung tài liệu..." value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Thông tin tệp</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-600">Tên tệp:</span><span className="font-medium">{file?.name || '-'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Kích thước:</span><span className="font-medium">{formatSize(file?.size)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Loại tệp:</span><span className="font-medium">{file?.type || '-'}</span></div>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Quyền truy cập</h4>
                      <div className="space-y-3">
                        {[
                          { v: 'public', l: 'Công khai - Tất cả thành viên có thể xem' },
                          { v: 'team', l: 'Nhóm - Chỉ thành viên nhóm' },
                          { v: 'private', l: 'Riêng tư - Chỉ tôi có thể xem' },
                        ].map((opt) => (
                          <label key={opt.v} className="flex items-center">
                            <input type="radio" name="access" value={opt.v} checked={access === (opt.v as typeof access)} onChange={() => setAccess(opt.v as typeof access)} className="text-blue-500 focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-700">{opt.l}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-8">
                  <button type="button" className="px-8 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors" onClick={() => setStep(1)}>
                    Quay lại
                  </button>
                  <button type="button" className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" onClick={() => setStep(3)}>
                    Xem trước
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Xác nhận tải lên</h2>
                  <p className="text-gray-600">Kiểm tra thông tin trước khi tải lên</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Thông tin tài liệu</h4>
                      <div className="space-y-3 text-sm">
                        <div><span className="text-gray-600">Tiêu đề:</span><p className="font-medium text-gray-900 mt-1">{title || '-'}</p></div>
                        <div><span className="text-gray-600">Mô tả:</span><p className="text-gray-700 mt-1">{description || '-'}</p></div>
                        <div><span className="text-gray-600">Phân loại:</span><span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mt-1">{category || '-'}</span></div>
                        <div>
                          <span className="text-gray-600">Tags:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {tags
                              .split(',')
                              .map((t) => t.trim())
                              .filter(Boolean)
                              .map((t) => (
                                <span key={t} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                  {t}
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Thông tin tệp</h4>
                      <div className="space-y-3 text-sm">
                        <div><span className="text-gray-600">Tên tệp:</span><p className="font-medium text-gray-900 mt-1">{file?.name || '-'}</p></div>
                        <div><span className="text-gray-600">Kích thước:</span><p className="text-gray-700 mt-1">{formatSize(file?.size)}</p></div>
                        <div><span className="text-gray-600">Loại tệp:</span><p className="text-gray-700 mt-1">{file?.type || '-'}</p></div>
                        <div><span className="text-gray-600">Quyền truy cập:</span><p className="text-gray-700 mt-1">{access === 'public' ? 'Công khai' : access === 'team' ? 'Nhóm' : 'Riêng tư'}</p></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <button type="button" className="px-8 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors" onClick={() => setStep(2)}>
                    Quay lại
                  </button>
                  <button type="submit" className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50" disabled={uploading}>
                    {uploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang tải lên...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Tải lên tài liệu
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

