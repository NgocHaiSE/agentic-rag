import React from 'react'
import { Button } from '@/components/ui/button'
import type { DocumentDetail } from '@/types'

export interface DocumentViewerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  doc: DocumentDetail | null
}

export default function DocumentViewerModal({ open, onOpenChange, loading, doc }: DocumentViewerModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{doc?.title || 'Xem tài liệu'}</h2>
            {doc?.metadata && (doc.metadata as any)?.author && (
              <p className="text-sm text-gray-600 mt-1">Người tải lên: {(doc.metadata as any).author}</p>
            )}
          </div>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
          >
            Đóng
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {loading ? (
            <div className="text-center text-gray-600">Đang tải nội dung...</div>
          ) : doc ? (
            doc.content ? (
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto">
                {doc.content}
              </pre>
            ) : (
              <div className="text-center text-gray-600">Không có nội dung văn bản để hiển thị.</div>
            )
          ) : (
            <div className="text-center text-red-500">Không tải được tài liệu.</div>
          )}
        </div>
      </div>
    </div>
  )
}