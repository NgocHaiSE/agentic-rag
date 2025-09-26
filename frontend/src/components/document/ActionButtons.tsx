import { Button } from '@/components/ui/button';
import {
  Download,
  FileText,
  Trash2,
} from 'lucide-react';
import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

interface ActionButtonsProps {
  onExport: () => void;
  onSummarize: () => void;
  onDelete: () => void;
  className?: string; // allow parent to position
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onExport,
  onSummarize,
  onDelete,
  className,
}) => {
  return (
    <TooltipProvider>
      <div className={`flex flex-col items-center gap-3 ${className ?? ''}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={onExport}
              className="w-10 h-10 rounded-full border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
              aria-label="Xuất file"
            >
              <Download className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Xuất file</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={onSummarize}
              className="w-10 h-10 rounded-full border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
              aria-label="Tóm tắt"
            >
              <FileText className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Tóm tắt</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={onDelete}
              className="w-10 h-10 rounded-full border-blue-200 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
              aria-label="Xóa tài liệu"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Xóa tài liệu</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default ActionButtons;
