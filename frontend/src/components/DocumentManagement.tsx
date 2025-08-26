import React, { useState } from 'react';
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
  Home
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

// Mock data
const mockDocuments = [
  {
    id: '1',
    name: 'Quy trình vận hành máy nghiền',
    type: 'PDF',
    size: '2.4 MB',
    uploadedBy: 'Admin',
    uploadedAt: '2 giờ trước',
    status: 'Đã xử lý',
    tags: ['Quy trình', 'Vận hành'],
    starred: false
  },
  {
    id: '2',
    name: 'Báo cáo sản xuất tháng 3',
    type: 'XLSX',
    size: '1.8 MB',
    uploadedBy: 'Manager',
    uploadedAt: '1 ngày trước',
    status: 'Đang xử lý',
    tags: ['Báo cáo', 'Sản xuất'],
    starred: true
  },
  {
    id: '3',
    name: 'Sơ đồ quy trình sản xuất',
    type: 'JPG',
    size: '856 KB',
    uploadedBy: 'Designer',
    uploadedAt: '3 ngày trước',
    status: 'Hoàn thành',
    tags: ['Sơ đồ', 'Hình ảnh'],
    starred: false
  },
  {
    id: '4',
    name: 'Hướng dẫn an toàn lao động',
    type: 'PDF',
    size: '3.2 MB',
    uploadedBy: 'Admin',
    uploadedAt: '1 tuần trước',
    status: 'Đã xử lý',
    tags: ['An toàn', 'Hướng dẫn'],
    starred: true
  },
  {
    id: '5',
    name: 'Danh sách thiết bị',
    type: 'XLSX',
    size: '945 KB',
    uploadedBy: 'Supervisor',
    uploadedAt: '2 tuần trước',
    status: 'Đã xử lý',
    tags: ['Thiết bị', 'Danh sách'],
    starred: false
  },
  {
    id: '6',
    name: 'Quy định nội bộ',
    type: 'DOCX',
    size: '1.5 MB',
    uploadedBy: 'HR',
    uploadedAt: '3 tuần trước',
    status: 'Đã xử lý',
    tags: ['Quy định', 'Nội bộ'],
    starred: false
  }
];

const getFileIcon = (type: string) => {
  switch (type) {
    case 'PDF': return <FileText className="h-8 w-8 text-red-500" />;
    case 'XLSX': 
    case 'XLS': return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    case 'DOCX':
    case 'DOC': return <FileText className="h-8 w-8 text-blue-500" />;
    case 'JPG':
    case 'PNG': return <FileImage className="h-8 w-8 text-purple-500" />;
    case 'TXT': return <FileCode className="h-8 w-8 text-gray-500" />;
    default: return <File className="h-8 w-8 text-gray-400" />;
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
    'Lỗi': { color: 'bg-red-100 text-red-800 border-red-200', text: 'Lỗi' }
  };
  
  const config = statusConfig[status] || statusConfig['Đã xử lý'];
  return (
    <Badge className={`${config.color} border`}>
      {config.text}
    </Badge>
  );
};

export default function DocumentManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
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
              <Button variant="outline" className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4" />
                Tải lên tài liệu
              </Button>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
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
                <SelectTrigger className="w-[130px] h-10">
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
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
            <span>Hiển thị {startIndex + 1} đến {Math.min(startIndex + itemsPerPage, filteredDocuments.length)} của {filteredDocuments.length} tài liệu</span>
          </div>
        </div>
      </div>

      {/* Document Grid */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentDocuments.map((doc) => (
            <Card key={doc.id} className="group hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white">
              <CardContent className="p-4">
                {/* File Icon and Actions */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getFileIcon(doc.type)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate text-sm">
                        {doc.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {doc.type} • {doc.size}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {/* Handle star */}}
                    >
                      <Star className={`h-4 w-4 ${doc.starred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Xem
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Tải xuống
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          Chia sẻ
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Status */}
                <div className="mb-3">
                  {getStatusBadge(doc.status as StatusType)}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {doc.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Meta Info */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{doc.uploadedBy}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{doc.uploadedAt}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Trước
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {page}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Tiếp
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}