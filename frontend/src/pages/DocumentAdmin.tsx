import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Upload, File, FileText, FileSpreadsheet, FileImage, FileVideo, FileCode, LayoutGrid, List as ListIcon, AlertCircle } from 'lucide-react'
import type { DocumentItem, StatusType } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8058'

type IngestionResult = {
  document_id: string
  title: string
  chunks_created: number
  entities_extracted: number
  relationships_created: number
  processing_time_ms: number
  errors: string[]
}

type UploadItem = {
  id: string
  name: string
  size: number
  status: 'Đang tải lên' | 'Đang xử lý' | 'Hoàn thành' | 'Lỗi'
  progress: number
  result?: IngestionResult
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return '—'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (type: string) => {
  const t = type.toUpperCase()
  if (t === 'DOCX' || t === 'DOC') return <FileText className="h-5 w-5 text-blue-500" />
  if (t === 'XLSX' || t === 'XLS') return <FileSpreadsheet className="h-5 w-5 text-green-500" />
  if (['JPG', 'JPEG', 'PNG'].includes(t)) return <FileImage className="h-5 w-5 text-red-500" />
  if (['MP4', 'AVI', 'MOV'].includes(t)) return <FileVideo className="h-5 w-5 text-purple-500" />
  if (['TS', 'JS', 'PY'].includes(t)) return <FileCode className="h-5 w-5 text-gray-700" />
  return <File className="h-5 w-5 text-gray-400" />
}

const getStatusBadge = (status: StatusType | UploadItem['status']) => {
  const map: Record<string, string> = {
    'Đã xử lý': 'bg-green-100 text-green-800 border-green-200',
    'Đang xử lý': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Hoàn thành': 'bg-blue-100 text-blue-800 border-blue-200',
    'Lỗi': 'bg-red-100 text-red-800 border-red-200',
  }
  const cls = map[String(status)] || map['Đã xử lý']
  return <Badge className={`${cls} border`}>{String(status)}</Badge>
}

export default function DocumentAdmin() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selected, setSelected] = useState<DocumentItem | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([])
  const [ingestById, setIngestById] = useState<Record<string, IngestionResult>>({})
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'error' | 'processing'>('all')

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API_BASE_URL}/documents`)
      const data = await res.json()
      const docs: DocumentItem[] = (data.documents || []).map((d: any) => {
        const extFromPath = (d.metadata?.file_path?.split('.').pop() || '').toUpperCase()
        const extFromTitle = (d.title?.split('.').pop() || '').toUpperCase()
        const fileType = extFromPath || extFromTitle || 'FILE'
        const fileSize = typeof d.metadata?.file_size === 'number' && d.metadata?.file_size > 0 ? formatFileSize(d.metadata.file_size) : '—'
        const recentIngest = ingestById[d.id]
        const computedStatus: StatusType = recentIngest ? (recentIngest.errors?.length ? 'Lỗi' : 'Hoàn thành') : ((d.metadata?.status || 'Đã xử lý') as StatusType)
        return {
          id: d.id,
          name: d.title || d.metadata?.original_filename || d.metadata?.file_path || 'Untitled',
          type: fileType,
          size: fileSize,
          uploadedBy: d.metadata?.uploaded_by || 'Unknown',
          uploadedAt: d.created_at ? new Date(d.created_at).toLocaleString() : '',
          status: computedStatus,
          tags: Array.isArray(d.metadata?.tags) ? d.metadata.tags : [],
        }
      })
      setDocuments(docs)
    } catch (e) {
      console.error(e)
      setError('Không thể tải danh sách tài liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
    const t = setInterval(fetchDocuments, 20000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onChooseFiles = () => inputRef.current?.click()

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const accepted = Array.from(files).filter(f => /\.(md|markdown|txt)$/i.test(f.name))
    if (accepted.length === 0) return

    const seeds: UploadItem[] = accepted.map(f => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      size: f.size,
      status: 'Đang tải lên',
      progress: 10,
    }))
    setUploadQueue(prev => [...seeds, ...prev])

    const form = new FormData()
    accepted.forEach(f => form.append('files', f))

    try {
      setUploadQueue(prev => prev.map((it, idx) => idx < seeds.length ? { ...it, status: 'Đang xử lý', progress: 40 } : it))
      const res = await fetch(`${API_BASE_URL}/documents/upload`, { method: 'POST', body: form })
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
      const data = await res.json()
      const results: IngestionResult[] = (data?.documents || [])

      const finalized = seeds.map((it, idx) => {
        const r = results[idx]
        const status: UploadItem['status'] = r?.errors?.length ? 'Lỗi' : 'Hoàn thành'
        return { ...it, status, progress: 100, result: r }
      })

      setUploadQueue(prev => {
        const rest = prev.slice(seeds.length)
        return [...finalized, ...rest]
      })

      const mapUpdates: Record<string, IngestionResult> = {}
      finalized.forEach(u => { if (u.result?.document_id) mapUpdates[u.result.document_id] = u.result })
      if (Object.keys(mapUpdates).length) setIngestById(prev => ({ ...prev, ...mapUpdates }))

      fetchDocuments()
    } catch (e) {
      console.error(e)
      setUploadQueue(prev => prev.map((it, idx) => idx < seeds.length ? { ...it, status: 'Lỗi', progress: 100 } : it))
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return documents.filter(d => {
      const matchQ = !q || d.name.toLowerCase().includes(q)
      const recent = ingestById[d.id]
      const hasError = recent ? recent.errors?.length > 0 : false
      if (statusFilter === 'error' && !hasError) return false
      if (statusFilter === 'processing' && d.status !== 'Đang xử lý') return false
      if (statusFilter === 'ok' && (hasError || d.status === 'Đang xử lý')) return false
      return matchQ
    })
  }, [documents, query, statusFilter, ingestById])

  const openDetails = (d: DocumentItem) => { setSelected(d); setDetailsOpen(true) }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="bg-white border-b">
        <div className="px-6 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Quản lý tài liệu (mới)</h1>
            <div className="flex items-center gap-2">
              <input ref={inputRef} type="file" multiple accept=".md,.markdown,.txt" className="hidden" onChange={e => handleFiles(e.target.files)} />
              <Button onClick={onChooseFiles} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Upload className="h-4 w-4 mr-2" /> Tải lên
              </Button>
            </div>
          </div>

          {/* Upload/ingest progress */}
          {uploadQueue.length > 0 && (
            <div className="rounded-md border p-3">
              <div className="font-medium mb-2">Tiến trình ingest</div>
              <div className="space-y-3 max-h-56 overflow-auto pr-1">
                {uploadQueue.map(u => (
                  <div key={u.id} className="text-sm">
                    <div className="flex items-center justify-between">
                      <div className="truncate" title={u.name}>{u.name}</div>
                      <div className="text-xs text-gray-500 ml-2">{u.status}</div>
                    </div>
                    <Progress value={u.progress} />
                    {u.result?.errors?.length ? (
                      <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> {u.result.errors[0]}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search and view toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm kiếm tài liệu..." className="pl-9" />
            </div>
            <div className="flex items-center gap-1">
              <Button variant={view === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setView('grid')}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={view === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setView('list')}>
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 text-sm">
            <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>Tất cả</Button>
            <Button variant={statusFilter === 'ok' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('ok')}>Thành công</Button>
            <Button variant={statusFilter === 'error' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('error')}>Lỗi</Button>
            <Button variant={statusFilter === 'processing' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('processing')}>Đang xử lý</Button>
            <div className="ml-auto text-gray-600">{loading ? 'Đang tải...' : `Tổng: ${filtered.length}`}</div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {error && <div className="text-sm text-red-600">{error}</div>}

        {view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(doc => (
              <Card key={doc.id} className="hover:shadow cursor-pointer" onClick={() => openDetails(doc)}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {getFileIcon(doc.type)}
                      <div>
                        <div className="font-medium text-gray-900 line-clamp-2" title={doc.name}>{doc.name}</div>
                        <div className="text-xs text-gray-500">{doc.type} • {doc.size}</div>
                      </div>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>
                  {ingestById[doc.id]?.errors?.length ? (
                    <div className="text-xs text-red-600">Lỗi ingest gần nhất: {ingestById[doc.id].errors[0]}</div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Tài liệu</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Người tải lên</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(doc => (
                  <TableRow key={doc.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetails(doc)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.type)}
                        <div>
                          <div className="font-medium text-gray-900">{doc.name}</div>
                          <div className="text-xs text-gray-500">{doc.type} • {doc.size}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell className="text-sm text-gray-500">{doc.uploadedBy}</TableCell>
                    <TableCell className="text-sm text-gray-500">{doc.uploadedAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Details dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết tài liệu</DialogTitle>
            <DialogDescription>Thông tin và kết quả ingest gần nhất.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-500">Tên:</div>
                <div className="font-medium break-words">{selected.name}</div>
                <div className="text-gray-500">Định dạng:</div>
                <div>{selected.type}</div>
                <div className="text-gray-500">Kích thước:</div>
                <div>{selected.size}</div>
                <div className="text-gray-500">Người tải lên:</div>
                <div>{selected.uploadedBy}</div>
                <div className="text-gray-500">Thời gian:</div>
                <div>{selected.uploadedAt}</div>
                <div className="text-gray-500">Trạng thái:</div>
                <div>{getStatusBadge(selected.status)}</div>
              </div>
              {selected.id && ingestById[selected.id] && (
                <div className="mt-2 rounded-md border p-3 bg-gray-50">
                  <div className="font-medium mb-2">Kết quả ingest</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-gray-500">Chunks:</div>
                    <div>{ingestById[selected.id].chunks_created}</div>
                    <div className="text-gray-500">Entities:</div>
                    <div>{ingestById[selected.id].entities_extracted}</div>
                    <div className="text-gray-500">Relationships:</div>
                    <div>{ingestById[selected.id].relationships_created}</div>
                    <div className="text-gray-500">Thời gian xử lý:</div>
                    <div>{Math.round(ingestById[selected.id].processing_time_ms)} ms</div>
                  </div>
                  {ingestById[selected.id].errors?.length > 0 && (
                    <div className="mt-2">
                      <div className="text-red-600 font-medium mb-1">Lỗi:</div>
                      <ul className="list-disc pl-5 text-red-700">
                        {ingestById[selected.id].errors.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

