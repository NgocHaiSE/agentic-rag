import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Upload as UploadIcon,
  FolderPlus,
  ChevronRight,
  Home,
  LayoutGrid,
  List as ListIcon,
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileCode,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DocumentCard } from '@/components/document/DocumentCard';
import { DocumentTableRow } from '@/components/document/DocumentTableRow';
import type { DocumentItem, StatusType } from '@/types';

const API_BASE_URL: string = import.meta.env.VITE_API_URL || '';

interface OrgUnit {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  parent_name?: string | null;
  is_active: boolean;
}

interface Account {
  id: string;
  name: string;
}

const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getFileIcon = (type: string) => {
  const t = (type || '').toUpperCase();
  if (t === 'DOC' || t === 'DOCX') return <FileText className="text-blue-600" />;
  if (t === 'XLS' || t === 'XLSX' || t === 'CSV') return <FileSpreadsheet className="text-blue-600" />;
  if (t === 'JPG' || t === 'JPEG' || t === 'PNG' || t === 'GIF') return <FileImage className="text-blue-600" />;
  if (t === 'MP4' || t === 'AVI' || t === 'MOV') return <FileVideo className="text-blue-600" />;
  if (t === 'TS' || t === 'JS' || t === 'PY' || t === 'JSON') return <FileCode className="text-blue-600" />;
  return <File />;
};

const getStatusBadge = (status: StatusType) => {
  const statusConfig: Record<string, { color: string; text: string }> = {
    'Đã xử lý': { color: 'bg-blue-100 text-blue-700 border-blue-300', text: 'Đã xử lý' },
    'Đang xử lý': { color: 'bg-blue-100 text-blue-700 border-blue-300', text: 'Đang xử lý' },
    'Hoàn thành': { color: 'bg-blue-100 text-blue-700 border-blue-300', text: 'Hoàn thành' },
    'Lỗi': { color: 'bg-blue-100 text-blue-700 border-blue-300', text: 'Lỗi' },
  };
  const config = statusConfig[status] || statusConfig['Đã xử lý'];
  return <Badge className={`${config.color} border font-medium`}>{config.text}</Badge>;
};

const DepartmentDocuments: React.FC = () => {
  const { shelfId } = useParams<{ shelfId: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(12);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [docTypes, setDocTypes] = useState<{ id: string; name: string }[]>([]);
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
  const [authorQuery, setAuthorQuery] = useState<string>('');
  const [authors, setAuthors] = useState<Account[]>([]);

  // Normalize text for diacritic-insensitive, case-insensitive search
  const normalize = (s?: string) =>
    (s || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const viewDocument = (docId: string): void => {
    if (shelfId && docId) {
      navigate(`/documents/shelf/${shelfId}/${docId}`);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/documents`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const docs: DocumentItem[] = (data.documents || []).map((d: any) => {
        const md = d.metadata || {};
        // Prefer the latest uploaded filename for extension; fallback to original file_path
        const fileNameForType = md.last_upload_filename || md.file_path || '';
        const ext = (fileNameForType || '').split('.').pop()?.toUpperCase() || '';
        const authorId = md.author_id || d.author_id || '';
        const author = md.author || md.uploaded_by || authorId || 'Không rõ';
        const unitId = md.issuing_unit_id || '';
        const unitName = md.issuing_unit_name || md.issuing_unit_id || '';
        const siteName = md.site_name || md.site_id || '';
        const docType = md.document_type_name || '';
        const eff = md.effective_date || '';
        const access = md.access_level ? `Access: ${md.access_level}` : '';
        const desc = md.description ? `Desc: ${md.description}` : '';
        const tags: string[] = [];
        if (docType) tags.push(`Type: ${docType}`);
        if (unitName) tags.push(`Unit: ${unitName}`);
        if (siteName) tags.push(`Site: ${siteName}`);
        if (eff) tags.push(`Effective: ${eff}`);
        if (access) tags.push(access);
        if (desc) tags.push(desc);
        (md.tags || []).forEach((t: string) => tags.push(t));

        return {
          id: d.id,
          name: d.title,
          type: ext,
          // Show latest file size if available
          size: formatFileSize(Number(md.file_size) || 0),
          uploadedBy: author,
          uploadedAt: d.created_at ? new Date(d.created_at).toLocaleString() : '',
          status: (md.status || 'Đã xử lý') as StatusType,
          tags,
          authorId: authorId || undefined,
          issuingUnitId: unitId || undefined,
          issuingUnitName: unitName || undefined,
          documentTypeName: docType || undefined,
        } as DocumentItem;
      });
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setDocuments([]);
    }
  };

  const fetchOrgUnits = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/metadata/org-units`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: OrgUnit[] = await res.json();
      setOrgUnits(data);
    } catch (e) {
      console.error('Failed to fetch org units:', e);
      setOrgUnits([]);
    }
  };

  const fetchDocTypes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/metadata/document-types`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = (data || []).map((d: any) => ({ id: d.id, name: d.name }));
      setDocTypes(items);
    } catch (e) {
      console.error('Failed to fetch document types:', e);
      setDocTypes([]);
    }
  };

  // Try to fetch accounts mapping (author_id -> author_name)
  const fetchAuthors = async () => {
    const candidates = [
      `${API_BASE_URL}/metadata/accounts`,
      `${API_BASE_URL}/accounts`,
      `${API_BASE_URL}/users`,
    ];
    for (const url of candidates) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        // Accept a few common shapes
        const items: Account[] = Array.isArray(data)
          ? data.map((a: any) => ({ id: a.id || a.user_id || a.uuid, name: a.name || a.full_name || a.username || a.email || '' })).filter((a: Account) => a.id)
          : Array.isArray(data.accounts)
            ? data.accounts.map((a: any) => ({ id: a.id || a.user_id || a.uuid, name: a.name || a.full_name || a.username || a.email || '' })).filter((a: Account) => a.id)
            : [];
        setAuthors(items);
        if (items.length) return; // success
      } catch (e) {
        // ignore and try next
      }
    }
    setAuthors([]);
  };

  useEffect(() => {
    fetchDocuments();
    fetchOrgUnits();
    fetchDocTypes();
    fetchAuthors();
  }, []);

  const currentUnit = useMemo(() => orgUnits.find((u) => u.id === shelfId), [orgUnits, shelfId]);

  const filteredDocuments = useMemo(() => {
    const q = normalize(searchQuery).trim();
    const tokens = q.length ? q.split(/\s+/).filter(Boolean) : [];
    const authorQ = normalize(authorQuery).trim();
    const authorTokens = authorQ.length ? authorQ.split(/\s+/).filter(Boolean) : [];

    // Build a name -> id mapping for authors from fetched accounts and fallback from docs
    const authorMapFromDocs = documents.reduce((m, d) => {
      if (d.authorId) m.set(d.authorId, d.uploadedBy || '');
      return m;
    }, new Map<string, string>());
    const combinedAuthorMap = new Map<string, string>(authorMapFromDocs);
    authors.forEach(a => {
      if (a.id && !combinedAuthorMap.has(a.id)) combinedAuthorMap.set(a.id, a.name || '');
      if (a.id && a.name) combinedAuthorMap.set(a.id, a.name);
    });

    // Determine which author IDs match the entered name tokens
    const matchedAuthorIds = new Set<string>();
    if (authorTokens.length) {
      combinedAuthorMap.forEach((name, id) => {
        const hay = normalize(name);
        const ok = authorTokens.every(t => hay.includes(t));
        if (ok) matchedAuthorIds.add(id);
      });
    }

    return documents
      .filter((doc) => {
        const inShelf = doc.issuingUnitId && doc.issuingUnitId === shelfId;

        // Build a searchable haystack from multiple fields
        const haystack = normalize([
          doc.name,
          doc.issuingUnitName,
          doc.documentTypeName,
          doc.type,
          ...(doc.tags || []),
        ].join(' '));

        // All tokens must be present (AND match)
        const matchesSearch = tokens.length === 0 || tokens.every((t) => haystack.includes(t));

        // Separate author matching: search by name, filter by authorId
        const matchesAuthor = authorTokens.length === 0 || (doc.authorId ? matchedAuthorIds.has(doc.authorId) : false);

        // File format filter (by extension)
        const matchesType = filterType === 'all' || doc.type === filterType;

        // Document type (Loại văn bản) filter
        const matchesDocType =
          docTypeFilter === 'all' || normalize(doc.documentTypeName) === normalize(docTypeFilter);

        return inShelf && matchesSearch && matchesAuthor && matchesType && matchesDocType;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'size') {
          const na = parseFloat(a.size) || 0;
          const nb = parseFloat(b.size) || 0;
          return nb - na;
        }
        if (sortBy === 'oldest') return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      });
  }, [documents, searchQuery, authorQuery, authors, filterType, sortBy, shelfId, docTypeFilter]);

  // Reset to page 1 whenever filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, authorQuery, filterType, docTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDocuments = filteredDocuments.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Breadcrumb Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 pt-6">
          <div className="flex items-center text-sm text-blue-600">
            <Home className="h-4 w-4 mr-2 text-blue-600" />
            <Link to="/" className="hover:text-blue-800 hover:underline transition-colors duration-200">
              Trang chủ
            </Link>
            <ChevronRight className="h-4 w-4 mx-2 text-blue-400" />
            <Link to="/documents" className="hover:text-blue-800 hover:underline transition-colors duration-200">
              Phòng ban
            </Link>
            <ChevronRight className="h-4 w-4 mx-2 text-blue-400" />
            <span className="text-blue-800 font-medium">{currentUnit?.name || 'Danh sách tài liệu'}</span>
          </div>
        </div>
      </div>

      {/* Title and Actions Section */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-blue-800 tracking-tight">
                {currentUnit?.name || 'Danh sách tài liệu'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* <Button
                variant="outline"
                className="flex items-center gap-2 border-blue-300 text-blue-600 hover:bg-blue-50 transition-all duration-200 rounded-md"
              >
                <FolderPlus className="h-4 w-4" />
                Tạo thư mục
              </Button> */}
              <Button
                asChild
                className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 rounded-md"
              >
                <Link to="/documents/upload">
                  <UploadIcon className="h-4 w-4 text-white" />
                  <span className='text-white'>Tải lên tài liệu</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
              <Input
                placeholder="Tìm kiếm tài liệu..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white rounded-md transition-all duration-200 hover:shadow-sm"
              />
            </div>

            {/* Author search */}
            <div className="w-64 relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                <Input
                  placeholder="Tìm theo tác giả..."
                  value={authorQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuthorQuery(e.target.value)}
                  className="pl-10 h-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white rounded-md transition-all duration-200 hover:shadow-sm"
                />
              </div>

            {/* Sort, type & view toggle */}
            <div className="flex items-center gap-3">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] h-10 border-blue-200 bg-white rounded-md">
                  <SelectValue placeholder="Định dạng" />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white border-blue-200">
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="XLSX">Excel</SelectItem>
                  <SelectItem value="DOCX">Word</SelectItem>
                  <SelectItem value="JPG">Hình ảnh</SelectItem>
                </SelectContent>
              </Select>

              {/* Loại văn bản */}
              <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
                <SelectTrigger className="w-[140px] h-10 border-blue-200 bg-white rounded-md">
                  <SelectValue placeholder="Loại văn bản" />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white border-blue-200 max-h-64 overflow-y-auto">
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  {docTypes.map((t) => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-[140px] h-10 border-blue-200 bg-white rounded-md">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white border-blue-200">
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="oldest">Cũ nhất</SelectItem>
                  <SelectItem value="name">Tên A-Z</SelectItem>
                  <SelectItem value="size">Kích thước</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1">
                <Button
                  className={`h-10 w-10 rounded-md ${
                    viewMode === 'grid' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white border-blue-200 hover:bg-blue-50'
                  } transition-all duration-200`}
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  aria-label="Dạng lưới"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  className={`h-10 w-10 rounded-md ${
                    viewMode === 'list' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white border-blue-200 hover:bg-blue-50'
                  } transition-all duration-200`}
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode('list')}
                  aria-label="Dạng danh sách"
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {currentDocuments.map((doc: DocumentItem) => (
                <div key={doc.id} className="transform transition-all duration-300 hover:scale-105 hover:shadow-md">
                  <DocumentCard
                    doc={doc}
                    getFileIcon={getFileIcon}
                    getStatusBadge={getStatusBadge}
                    onClick={() => viewDocument(doc.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto border border-blue-200 rounded-md shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead className="w-[40%] text-blue-700 font-medium">Tài liệu</TableHead>
                    <TableHead className="text-blue-700 font-medium">Trạng thái</TableHead>
                    <TableHead className="text-blue-700 font-medium">Người tải lên</TableHead>
                    <TableHead className="text-blue-700 font-medium">Thời gian</TableHead>
                    <TableHead className="text-blue-700 font-medium">Tags</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentDocuments.map((doc: DocumentItem) => (
                    <DocumentTableRow
                      key={doc.id}
                      doc={doc}
                      getFileIcon={getFileIcon}
                      getStatusBadge={getStatusBadge}
                      onClick={() => viewDocument(doc.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-md"
              >
                Trước
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-md ${
                    currentPage === page
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                  } transition-all duration-200`}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-md"
              >
                Tiếp
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentDocuments;


