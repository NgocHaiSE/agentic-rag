import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Clock } from 'lucide-react';
import type { DocumentItem, StatusType } from '@/types';
import { DocumentActions } from './DocumentActions';

interface DocumentCardProps {
  doc: DocumentItem;
  getFileIcon: (type: string) => React.ReactNode;
  getStatusBadge: (status: StatusType) => React.ReactNode;
  onClick?: () => void;
}

export function DocumentCard({ doc, getFileIcon, getStatusBadge, onClick }: DocumentCardProps) {
  return (
   <Card 
      onClick={onClick} 
      className="group hover:shadow-md transition-shadow duration-200 border border-blue-100 bg-blue-50/5 overflow-hidden rounded-xl cursor-pointer h-full"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 w-full">
            <div className="shrink-0 mt-1 p-2 bg-gray-50 rounded-full">{getFileIcon(doc.type)}</div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                {doc.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {doc.type} • {doc.size}
              </p>
            </div>
          </div>
          <DocumentActions />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">{getStatusBadge(doc.status)}</div>
          <div className="flex flex-wrap gap-1">
            {doc.tags
              .filter(tag => !tag.startsWith('Desc:') && !tag.startsWith('Effective:') && !tag.startsWith('Access:'))
              .map((tag) => {
                const prefixes = ['Type:', 'Unit:', 'Site:']
                const matched = prefixes.find(p => tag.startsWith(p))
                return matched ? tag.slice(matched.length).trim() : tag
              })
              .filter(tag => tag.length > 0)
              .map((label, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                >
                  {label}
                </Badge>
              ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-gray-400" />
            <span className="truncate">{doc.uploadedBy}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span className="truncate">{doc.uploadedAt}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
