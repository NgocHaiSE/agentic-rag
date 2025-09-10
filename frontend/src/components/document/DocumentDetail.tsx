import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import ActionButtons from '@/components/document/ActionButtons';
import type { DocumentDetail as DocumentDetailType } from '@/types';

const API_BASE_URL: string = import.meta.env.VITE_API_URL || '';

const DocumentDetail: React.FC = () => {
  const { shelfId, docId } = useParams<{ shelfId: string; docId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [doc, setDoc] = useState<DocumentDetailType | null>(null);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/documents/${docId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DocumentDetailType = await res.json();
      setDoc(data);
    } catch (e) {
      console.error('Failed to load document detail', e);
      setDoc(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (docId) {
      fetchDocument();
    }
  }, [docId]);

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${docId}/download`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc?.title || 'document';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  const handleSummarize = () => {
    alert('Tóm tắt tài liệu: Chức năng này đang được phát triển.');
  };

  const handleDelete = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
      try {
        const res = await fetch(`${API_BASE_URL}/documents/${docId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        navigate(`/documents/shelf/${shelfId}`);
      } catch (e) {
        console.error('Delete failed', e);
      }
    }
  };

  const handleBack = () => {
    if (shelfId) {
      navigate(`/documents/shelf/${shelfId}`)
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative bg-white rounded-2xl border border-blue-200 shadow-sm p-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md mb-6"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-blue-800">{doc?.title || 'Xem tài liệu'}</h1>
            {doc?.metadata && (doc.metadata as any)?.author && (
              <p className="text-sm text-blue-600 mt-1">Người tải lên: {(doc.metadata as any).author}</p>
            )}
          </div>
          <div className="relative bg-blue-50 rounded-lg border border-blue-200">
            {/* Scrollable content only */}
            <div className="max-h-[calc(100vh-250px)] overflow-y-auto p-6 pb-24 pr-24">
              {loading ? (
                <div className="text-center text-blue-600">Đang tải nội dung...</div>
              ) : doc ? (
                doc.content ? (
                  <pre className="whitespace-pre-wrap text-sm text-blue-800 font-mono bg-white p-4 rounded-lg border border-blue-200 overflow-x-auto">
                    {doc.content}
                  </pre>
                ) : (
                  <div className="text-center text-blue-600">Không có nội dung văn bản để hiển thị.</div>
                )
              ) : (
                <div className="text-center text-red-500">Không tải được tài liệu.</div>
              )}
            </div>
            {/* Fixed action buttons at bottom-right of the content container */}
            <div className="pointer-events-none absolute bottom-4 right-4">
              <div className="pointer-events-auto">
                <ActionButtons
                  onExport={handleExport}
                  onSummarize={handleSummarize}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;
