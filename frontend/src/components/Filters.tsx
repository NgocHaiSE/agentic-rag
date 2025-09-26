import { Filter, LayoutGrid, List as ListIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filterType: string;
  setFilterType: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (value: 'grid' | 'list') => void;
  startIndex: number;
  itemsPerPage: number;
  filteredDocuments: any[]; // Replace 'any' with your document type if available
}

export default function Filters({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  startIndex,
  itemsPerPage,
  filteredDocuments,
}: FiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm kiếm tài liệu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 w-full"
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[130px] h-10">
            <SelectValue placeholder="Tất cả định dạng" />
          </SelectTrigger>
          <SelectContent className="z-[100]">
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
          <SelectContent className="z-[100]">
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
          <SelectContent className="z-[100]">
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
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-blue-600 text-white' : ''}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-blue-600 text-white' : ''}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="text-sm text-gray-600 mt-2 lg:mt-0">
        Hiển thị {startIndex + 1} đến {Math.min(startIndex + itemsPerPage, filteredDocuments.length)} của{' '}
        {filteredDocuments.length} tài liệu
      </div>
    </div>
  );
}