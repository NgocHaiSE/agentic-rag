import React, { useState, useRef } from 'react';
import { 
  Upload,
  FileText,
  X,
  Plus,
  ChevronDown,
  Home,
  ChevronRight,
  File,
  Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';

const categories = [
  'Báo cáo',
  'Quy trình', 
  'Hướng dẫn',
  'An toàn',
  'Sản xuất',
  'Quản lý',
  'Kỹ thuật',
  'Tài chính'
];

const suggestedTags = [
  'báo cáo',
  'quy trình', 
  'hướng dẫn',
  'an toàn',
  'sản xuất'
];

type SelectedFile = {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
};

export default function DocumentUploadPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);
  const [accessLevel, setAccessLevel] = useState('public');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const newFiles = files.map((file: File) => ({
      id: Math.random().toString(36).substr(2, 9),
      file: file,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || 'application/octet-stream'
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleTagAdd = (tag: string) => {
    if (tag && !tagList.includes(tag)) {
      setTagList(prev => [...prev, tag]);
      setTags('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setTagList(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleTagAdd(tags.trim());
    }
  };

  const handleSubmit = () => {
    // Handle form submission
    console.log({
      title,
      description,
      category,
      tags: tagList,
      accessLevel,
      files: selectedFiles
    });
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setTags('');
    setTagList([]);
    setAccessLevel('public');
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
            <span className="text-gray-900 font-medium">Upload</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thông tin tài liệu</h1>
            <p className="text-gray-600 mt-1">Điền thông tin để dễ dàng tìm kiếm và quản lý</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Form Fields */}
              <div className="lg:col-span-2 space-y-6">
                {/* File Upload Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Chọn tài liệu</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* File Input */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                      />
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Kéo thả tài liệu vào đây hoặc
                      </p>
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        className="mb-2"
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        Chọn từ máy tính
                      </Button>
                      <p className="text-sm text-gray-500">
                        Hỗ trợ: PDF, Word, Excel, PowerPoint, TXT, JPG, PNG (Tối đa 10MB mỗi file)
                      </p>
                    </div>

                    {/* Selected Files */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tài liệu đã chọn:</Label>
                        {selectedFiles.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <File className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">{file.size}</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Document Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Thông tin tài liệu</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium">
                        Tiêu đề tài liệu <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        placeholder="Nhập tiêu đề tài liệu..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Phân loại</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn phân loại..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat.toLowerCase()}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Thẻ tag</Label>
                      <Input
                        placeholder="Ví dụ: báo cáo, phân tích, dữ liệu..."
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        onKeyPress={handleTagKeyPress}
                      />
                      <p className="text-xs text-gray-500">
                        Phân cách bằng dấu phẩy, ví dụ: báo cáo, phân tích, dữ liệu
                      </p>
                      
                      {/* Suggested Tags */}
                      <div>
                        <Label className="text-xs text-gray-600">Gợi ý:</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {suggestedTags.map((tag) => (
                            <Button
                              key={tag}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => handleTagAdd(tag)}
                            >
                              {tag}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Selected Tags */}
                      {tagList.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tagList.map((tag) => (
                            <Badge key={tag} variant="secondary" className="bg-blue-100 text-blue-800">
                              {tag}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-1 hover:bg-blue-200"
                                onClick={() => handleTagRemove(tag)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">Mô tả</Label>
                      <Textarea
                        id="description"
                        placeholder="Mô tả ngắn gọn về nội dung tài liệu..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - File Info & Permissions */}
              <div className="space-y-6">
                {/* File Information */}
                {selectedFiles.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Thông tin tệp</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedFiles.map((file, index) => (
                        <div key={file.id} className="text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tên tệp:</span>
                            <span className="font-medium text-right max-w-[150px] truncate" title={file.name}>
                              {file.name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Kích thước:</span>
                            <span className="font-medium">{file.size}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Loại tệp:</span>
                            <span className="font-medium">{file.type.split('/')[1]?.toUpperCase() || 'Unknown'}</span>
                          </div>
                          {index < selectedFiles.length - 1 && <hr className="my-3" />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Access Permissions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Quyền truy cập</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={accessLevel} onValueChange={setAccessLevel}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="public" id="public" />
                        <Label htmlFor="public" className="text-sm">
                          <span className="font-medium text-blue-600">Công khai</span> - Tất cả thành viên có thể xem
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="team" id="team" />
                        <Label htmlFor="team" className="text-sm">
                          <span className="font-medium text-orange-600">Nhóm</span> - Chỉ thành viên nhóm
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="private" id="private" />
                        <Label htmlFor="private" className="text-sm">
                          <span className="font-medium text-red-600">Riêng tư</span> - Chỉ tôi có thể xem
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button type="button" variant="outline" onClick={handleReset}>
                Quay lại
              </Button>
              <Button 
                type="button"
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!title || selectedFiles.length === 0}
              >
                Xem trước
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}