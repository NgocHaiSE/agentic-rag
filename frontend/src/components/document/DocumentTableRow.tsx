import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TableRow, TableCell } from '@/components/ui/table';
import type { DocumentItem, StatusType } from '@/types';
import { DocumentActions } from './DocumentActions';

interface DocumentTableRowProps {
  doc: DocumentItem;
  getFileIcon: (type: string) => React.ReactNode;
  getStatusBadge: (status: StatusType) => React.ReactNode;
}

export function DocumentTableRow({ doc, getFileIcon, getStatusBadge }: DocumentTableRowProps) {
  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell>
        <div className="flex items-center gap-3">
          {getFileIcon(doc.type)}
          <div>
            <div className="font-medium text-gray-900">{doc.name}</div>
            <div className="text-xs text-gray-500">
              {doc.type} • {doc.size}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(doc.status)}</TableCell>
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
        <DocumentActions />
      </TableCell>
    </TableRow>
  );
}