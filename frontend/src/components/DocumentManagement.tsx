import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MoreVertical,
  Upload,
  FolderPlus,
  ChevronRight,
  File,
  FileText,
  FileSpreadsheet,
  FileCode,
  FileImage,
  Eye,
  Download,
  Share2,
  Trash2,
  Star,
  Clock,
  User,
  Home,
  FileVideo,
  LayoutGrid,
  List as ListIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  status: StatusType;
  tags: string[];
}

const mockDocuments: DocumentItem[] = [
  {
    id: '1',
    name: 'Báo cáo tài chính Q1',
    type: 'PDF',
    size: '1.2 MB',
    uploadedBy: 'Nguyen Van A',
    uploadedAt: '27/08/2025, 10:30:00',
    status: 'Đã xử lý',
    tags: ['tài chính', 'Q1', '2025'],
  },
  {
    id: '2',
    name: 'Danh sách nhân sự',
    type: 'XLSX',
    size: '540 KB',
    uploadedBy: 'Tran Thi B',
    uploadedAt: '26/08/2025, 14:20:00',
    status: 'Đang xử lý',
    tags: ['nhân sự', 'bảng lương'],
  },
  {
    id: '3',
    name: 'Hướng dẫn sử dụng hệ thống',
    type: 'DOCX',
    size: '860 KB',
    uploadedBy: 'Le Van C',
    uploadedAt: '25/08/2025, 09:15:00',
    status: 'Hoàn thành',
    tags: ['hướng dẫn', 'manual'],
  },
  {
    id: '4',
    name: 'Biểu đồ doanh thu',
    type: 'JPG',
    size: '320 KB',
    uploadedBy: 'Nguyen Van D',
    uploadedAt: '24/08/2025, 17:45:00',
    status: 'Lỗi',
    tags: ['doanh thu', 'biểu đồ'],
  },
];

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type: string) => {
  if (type === 'DOCX') {
    return <FileText className="text-blue-500" />;
  } else if (type === 'XLSX') {
    return <FileSpreadsheet className="text-green-500" />;
  } else if (type === 'JPG' || type === 'JPEG' || type === 'PNG') {
    return <FileImage className="text-red-500" />;
  } else if (type === 'MP4' || type === 'AVI' || type === 'MOV') {
    return <FileVideo className="text-purple-500" />;
  } else if (type === 'TS' || type === 'JS' || type === 'PY') {
    return <FileCode className="text-gray-700" />;
  } else {
    return <File />;
  }
};

interface StatusConfig {
  color: string;
  text: string;
}

type StatusType = 'Đã xử lý' | 'Đang xử lý' | 'Hoàn thành' | 'Lỗi';

const getStatusBadge = (status: StatusType) => {
  const statusConfig: Record<StatusType, StatusConfig> = {
    'Đã xử lý': { color: 'bg-green-100 text-green-800 border-green-200', text: 'Đã xử lý' },
    'Đang xử lý': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Đang xử lý' },
    'Hoàn thành': { color: 'bg-blue-100 text-blue-800 border-blue-200', text: 'Hoàn thành' },
    'Lỗi': { color: 'bg-red-100 text-red-800 border-red-200', text: 'Lỗi' },
  };

  const config = statusConfig[status] || statusConfig['Đã xử lý'];
  return <Badge className={`${config.color} border`}>{config.text}</Badge>;
};

export default function DocumentManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/documents`);
      const data = await res.json();
      const docs: DocumentItem[] = (data.documents || []).map((d: any) => ({
        id: d.id,
        name: d.title,
        type: (d.metadata?.file_path?.split('.').pop() || '').toUpperCase(),
        size: formatFileSize(d.metadata?.file_size || 0),
        uploadedBy: d.metadata?.uploaded_by || 'Unknown',
        uploadedAt: d.created_at ? new Date(d.created_at).toLocaleString() : '',
        status: (d.metadata?.status || 'Đã xử lý') as StatusType,
        tags: d.metadata?.tags || [],
        starred: false,
      }));
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  useEffect(() => {
    // fetchDocuments();
    setDocuments(mockDocuments);
  }, []);

  const filteredDocuments = documents
    .filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || doc.type === filterType;
      const matchesStatus = filterStatus === 'all' || doc.status === (filterStatus as StatusType);
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') {
        const na = parseFloat(a.size);
        const nb = parseFloat(b.size);
        return nb - na;
      }
      if (sortBy === 'oldest') return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      // newest default
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDocuments = filteredDocuments.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Home className="h-4 w-4 mr-1" />
            <span>Trang chủ</span>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span>Tài liệu</span>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900 font-medium">Danh sách</span>
          </div>

          {/* Title and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Thư viện Tài liệu</h1>
              <p className="text-gray-600 mt-1">Quản lý và tìm kiếm tài liệu một cách hiệu quả</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-2 hover:bg-zinc-200">
                <FolderPlus className="h-4 w-4" />
                Tạo folder
              </Button>
              <Button className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 ">
                <Upload className="h-4 w-4" />
                Tải lên tài liệu
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm tài liệu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px] h-10">
                  <SelectValue placeholder="Tất cả định dạng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả định dạng</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="XLSX">Excel</SelectItem>
                  <SelectItem value="DOCX">Word</SelectItem>
                  <SelectItem value="JPG">Hình ảnh</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w=[130px] h-10">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="Đã xử lý">Đã xử lý</SelectItem>
                  <SelectItem value="Đang xử lý">Đang xử lý</SelectItem>
                  <SelectItem value="Hoàn thành">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[130px] h-10">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="oldest">Cũ nhất</SelectItem>
                  <SelectItem value="name">Tên A-Z</SelectItem>
                  <SelectItem value="size">Kích thước</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Lọc
              </Button>

              {/* View mode toggle */}
              <div className="flex items-center gap-1">
                <Button
                  className={viewMode === 'grid' ? 'bg-blue-500' : ''}
                  variant='outline'
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  className={viewMode === 'list' ? 'bg-blue-500' : ''}
                  variant='outline'
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
            <span>
              Hiển thị {startIndex + 1} đến {Math.min(startIndex + itemsPerPage, filteredDocuments.length)} của {filteredDocuments.length} tài liệu
            </span>
          </div>
        </div>
      </div>

      {/* Document Area */}
      <div className="px-6 py-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentDocuments.map((doc) => (
              <Card key={doc.id} className="group hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white cursor-pointer">
                <CardContent className="p-4">
                  {/* File Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 w-full">
                      <div className="shrink-0 mt-1">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 hover:line-clamp-none group-hover:text-blue-600">
                          {doc.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">{doc.type} • {doc.size}</p>
                      </div>
                    </div>
                    {/* DropdownMenu moved outside flex-1 for better clickability */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2 cursor-pointer" />
                          Tải xuống
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2 cursor-pointer" />
                          Chia sẻ
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2 cursor-pointer" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Status and Tags */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(doc.status as StatusType)}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {doc.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span className="truncate">{doc.uploadedBy}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="truncate">{doc.uploadedAt}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Tài liệu</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Người tải lên</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead></TableHead> {/* Dropdown column */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentDocuments.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.type)}
                        <div>
                          <div className="font-medium text-gray-900">{doc.name}</div>
                          <div className="text-xs text-gray-500">{doc.type} • {doc.size}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(doc.status as StatusType)}</TableCell>
                    <TableCell className="text-sm text-gray-500">{doc.uploadedBy}</TableCell>
                    <TableCell className="text-sm text-gray-500">{doc.uploadedAt}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2 cursor-pointer" />
                            Tải xuống
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2 cursor-pointer" />
                            Chia sẻ
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2 cursor-pointer" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
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
    </div>
  );
}
