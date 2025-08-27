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
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onDownload} className="cursor-pointer">
          <Download className="h-4 w-4 mr-2" />
          Tải xuống
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onShare} className="cursor-pointer">
          <Share2 className="h-4 w-4 mr-2" />
          Chia sẻ
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-red-600 cursor-pointer">
          <Trash2 className="h-4 w-4 mr-2" />
          Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}