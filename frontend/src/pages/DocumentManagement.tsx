import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  Search,
  Upload,
  FolderPlus,
  ChevronRight,
  Home,
  LayoutGrid,
  List as ListIcon,
  File,
  FileText,
  FileSpreadsheet,
  FileCode,
  FileImage,
  FileVideo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DocumentCard } from '@/components/document/DocumentCard'
import { DocumentTableRow } from '@/components/document/DocumentTableRow'
import { ShelfCard, type ShelfItem } from '@/components/document/ShelfCard'
import DocumentViewerModal from '@/components/document/DocumentViewerModal'
import type { DocumentItem, StatusType, DocumentDetail } from '@/types'
// (Optional) static images can be used if needed

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// Org Unit type (from /metadata/org-units)
type OrgUnit = {
  id: string
  code: string
  name: string
  parent_id: string | null
  parent_name?: string | null
  is_active: boolean
  image?: string | null
}

const formatFileSize = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const getFileIcon = (type: string) => {
  const t = (type || '').toUpperCase()
  if (t === 'DOC' || t === 'DOCX') return <FileText className="text-blue-500" />
  if (t === 'XLS' || t === 'XLSX' || t === 'CSV') return <FileSpreadsheet className="text-green-500" />
  if (t === 'JPG' || t === 'JPEG' || t === 'PNG' || t === 'GIF') return <FileImage className="text-red-500" />
  if (t === 'MP4' || t === 'AVI' || t === 'MOV') return <FileVideo className="text-purple-500" />
  if (t === 'TS' || t === 'JS' || t === 'PY' || t === 'JSON') return <FileCode className="text-gray-700" />
  return <File />
}

// Normalize status (fix mojibake variants and unify display)
const normalizeStatus = (s: string): StatusType => {
  const map: Record<string, StatusType> = {
    'Đã xử lý': 'Đã xử lý' as StatusType,
    'Đang xử lý': 'Đang xử lý' as StatusType,
    'Hoàn thành': 'Hoàn thành' as StatusType,
    'Lỗi': 'Lỗi' as StatusType,
  }
  return (map[s] || (s as StatusType)) as StatusType
}

const getStatusBadge = (status: StatusType) => {
  const statusConfig: Record<string, { color: string; text: string }> = {
    'Đã xử lý': { color: 'bg-green-100 text-green-800 border-green-200', text: 'Đã xử lý' },
    'Đang xử lý': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Đang xử lý' },
    'Hoàn thành': { color: 'bg-blue-100 text-blue-800 border-blue-200', text: 'Hoàn thành' },
    'Lỗi': { color: 'bg-red-100 text-red-800 border-red-200', text: 'Lỗi' },
  }
  const config = statusConfig[status] || statusConfig['Đã xử lý']
  return <Badge className={`${config.color} border`}>{config.text}</Badge>
}

function slugify(value: string) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export default function DocumentManagement() {
  const navigate = useNavigate()
  const { shelfId } = useParams()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [viewerOpen, setViewerOpen] = useState<boolean>(false)
  const [viewerLoading, setViewerLoading] = useState<boolean>(false)
  const [viewerDoc, setViewerDoc] = useState<DocumentDetail | null>(null)
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([])

  const openViewer = async (docId: string): Promise<void> => {
    try {
      setViewerOpen(true)
      setViewerLoading(true)
      setViewerDoc(null)
      const res = await fetch(`${API_BASE_URL}/documents/${docId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: DocumentDetail = await res.json()
      setViewerDoc(data)
    } catch (e) {
      console.error('Failed to load document detail', e)
      setViewerDoc(null)
    } finally {
      setViewerLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/documents`)
      const data = await res.json()
      const docs: DocumentItem[] = (data.documents || []).map((d: any) => {
        const md = d.metadata || {}
        const ext = (md.file_path || '').split('.').pop()?.toUpperCase() || ''
        const author = md.author || md.uploaded_by || 'Không rõ'
        const unitId = md.issuing_unit_id || ''
        const unitName = md.issuing_unit_name || md.issuing_unit_id || ''
        const siteName = md.site_name || md.site_id || ''
        const docType = md.document_type_name || ''
        const eff = md.effective_date || ''
        const access = md.access_level ? `Access: ${md.access_level}` : ''
        const desc = md.description ? `Desc: ${md.description}` : ''
        const tags: string[] = []
        if (docType) tags.push(`Type: ${docType}`)
        if (unitName) tags.push(`Unit: ${unitName}`)
        if (siteName) tags.push(`Site: ${siteName}`)
        if (eff) tags.push(`Effective: ${eff}`)
        if (access) tags.push(access)
        if (desc) tags.push(desc)
        ;(md.tags || []).forEach((t: string) => tags.push(t))

        return {
          id: d.id,
          name: d.title,
          type: ext,
          size: formatFileSize(md.file_size || 0),
          uploadedBy: author,
          uploadedAt: d.created_at ? new Date(d.created_at).toLocaleString() : '',
          status: normalizeStatus(md.status || 'Đã xử lý'),
          tags,
          issuingUnitId: unitId || undefined,
          issuingUnitName: unitName || undefined,
        } as DocumentItem
      })
      setDocuments(docs)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
      setDocuments([])
    }
  }

  const fetchOrgUnits = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/metadata/org-units`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: OrgUnit[] = await res.json()
      setOrgUnits(data)
    } catch (e) {
      console.error('Failed to fetch org units:', e)
      setOrgUnits([])
    }
  }

  useEffect(() => {
    fetchDocuments()
    fetchOrgUnits()
  }, [])

  const shelves: ShelfItem[] = useMemo(() => {
    const map = new Map<string, ShelfItem & { slug: string }>()
    for (const d of documents) {
      const name = d.issuingUnitName || 'Không xác định'
      const id = d.issuingUnitId || slugify(name)
      if (!map.has(id)) {
        map.set(id, { id, name, description: undefined, slug: slugify(name) })
      }
    }
    return Array.from(map.values())
  }, [documents])

  const currentShelf = useMemo(() => {
    if (!shelfId) return undefined
    // Prefer org unit label by id
    const unit = orgUnits.find(u => u.id === shelfId)
    if (unit) return { id: unit.id, name: unit.name, description: undefined } as ShelfItem
    // Fallback to dynamic shelves from documents (by slug)
    return shelves.find(s => s.id === shelfId || slugify(s.name) === shelfId)
  }, [shelfId, shelves, orgUnits])

  // Root view: only show top-level org units (no parent_id)
  const filteredRootShelves = useMemo(() => {
    const q = searchQuery.toLowerCase()
    if (!orgUnits?.length) return [] as ShelfItem[]
    const topLevel = orgUnits.filter(u => u.parent_id == null)
    return topLevel
      .map<ShelfItem>((u) => ({
        id: u.id,
        name: u.name,
        description: u.code,
        image: u.image ? `/src/assets/${u.image}` : undefined,
      }))
      .filter(s => s.name.toLowerCase().includes(q))
  }, [orgUnits, searchQuery])

  const filteredDocuments = documents
    .filter((doc) => {
      const inShelf = !shelfId
        ? true
        : (doc.issuingUnitId && doc.issuingUnitId === shelfId)
          || (doc.issuingUnitName && slugify(doc.issuingUnitName) === shelfId)
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = filterType === 'all' || doc.type === filterType
      return inShelf && matchesSearch && matchesType
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'size') {
        const na = parseFloat(a.size)
        const nb = parseFloat(b.size)
        return nb - na
      }
      if (sortBy === 'oldest') return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    })

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentDocuments = filteredDocuments.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar / Breadcrumbs (BookStack-like) */}
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="px-6 py-4">
        <div className="flex items-center text-sm text-blue-600 mb-4">
            <Home className="h-4 w-4 mr-1" />
            <span>Trang chủ</span>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span>{shelfId ? 'Tài liệu' : 'Phòng ban'}</span>
            {shelfId && (
              <>
                <ChevronRight className="h-4 w-4 mx-2" />
                <span className="font-medium">Tài liệu</span>
              </>
            )}
          </div>

          {/* Title and actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {shelfId ? 'Quản lý Tài liệu' : 'Danh sách phòng ban'}
            </h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-2 bg-white border-blue-200 text-blue-600 hover:bg-blue-50">
                <FolderPlus className="h-4 w-4" />
                Tạo folder
              </Button>
              <Button className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
                <Upload className="h-4 w-4" />
                Tải lên tài liệu
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* When in shelf view, show sort, type & view toggle (BookStack-like minimal) */}
            {shelfId && (
              <div className="flex items-center gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px] h-10">
                    <SelectValue placeholder="Định dạng" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="XLSX">Excel</SelectItem>
                    <SelectItem value="DOCX">Word</SelectItem>
                    <SelectItem value="JPG">Hình ảnh</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[140px] h-10">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="oldest">Cũ nhất</SelectItem>
                    <SelectItem value="name">Tên A-Z</SelectItem>
                    <SelectItem value="size">Kích thước</SelectItem>
                  </SelectContent>
                </Select>

                {/* View mode toggle */}
                <div className="flex items-center gap-1">
                  <Button
                    className={viewMode === 'grid' ? 'bg-blue-500 text-white' : ''}
                    variant='outline'
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    aria-label="Dạng lưới"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    className={viewMode === 'list' ? 'bg-blue-500 text-white' : ''}
                    variant='outline'
                    size="icon"
                    onClick={() => setViewMode('list')}
                    aria-label="Dạng danh sách"
                  >
                    <ListIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-6 py-6">
        {!shelfId ? (
          // Shelves grid (BookStack shelves look)
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRootShelves.map((shelf) => (
              <ShelfCard key={shelf.id} shelf={shelf} onClick={() => navigate(`/documents/shelf/${shelf.id}`)} />
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          // Documents grid (BookStack books grid feel)
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                getFileIcon={getFileIcon}
                getStatusBadge={getStatusBadge}
                onClick={() => openViewer(doc.id)}
              />
            ))}
          </div>
        ) : (
          // Documents list
          <div className="overflow-x-auto border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Tài liệu</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Người tải lên</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentDocuments.map((doc) => (
                  <DocumentTableRow
                    key={doc.id}
                    doc={doc}
                    getFileIcon={getFileIcon}
                    getStatusBadge={getStatusBadge}
                    onClick={() => openViewer(doc.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {shelfId && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Trước
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Tiếp
            </Button>
          </div>
        )}
      </div>

      {/* Document Viewer */}
      <DocumentViewerModal
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        loading={viewerLoading}
        doc={viewerDoc}
      />
    </div>
  )
}
