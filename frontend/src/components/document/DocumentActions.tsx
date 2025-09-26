import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Download, Share2, Trash2 } from 'lucide-react';

interface DocumentActionsProps {
  onDownload?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}

export function DocumentActions({ onDownload, onShare, onDelete }: DocumentActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border border-blue-100 shadow-lg rounded-md">
        <DropdownMenuItem onClick={onDownload} className="cursor-pointer text-gray-700 hover:bg-blue-50 hover:text-blue-600 focus:bg-blue-50 focus:text-blue-600 transition-colors">
          <Download className="h-4 w-4 mr-2 text-blue-500" />
          Tải xuống
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onShare} className="cursor-pointer text-gray-700 hover:bg-blue-50 hover:text-blue-600 focus:bg-blue-50 focus:text-blue-600 transition-colors">
          <Share2 className="h-4 w-4 mr-2 text-blue-500" />
          Chia sẻ
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-blue-100" />
        <DropdownMenuItem onClick={onDelete} className="text-red-600 cursor-pointer hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 transition-colors">
          <Trash2 className="h-4 w-4 mr-2 text-red-500" />
          Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}