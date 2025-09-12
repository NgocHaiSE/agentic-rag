import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import { ChevronLeft, X } from 'lucide-react';
import ActionButtons from '@/components/document/ActionButtons';
import type { DocumentDetail as DocumentDetailType } from '@/types';

const API_BASE_URL: string = import.meta.env.VITE_API_URL || '';

const DocumentDetail: React.FC = () => {
  const { shelfId, docId } = useParams<{ shelfId: string; docId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [doc, setDoc] = useState<DocumentDetailType | null>(null);
  const [summarizing, setSummarizing] = useState<boolean>(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState<boolean>(false);

  const formatDate = (s?: string | null) => {
    if (!s) return '';
    const d = new Date(s);
    return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString();
  };

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
    if (docId) fetchDocument();
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

  const handleSummarize = async () => {
    if (!docId) return;
    setShowSummary(true);
    setSummarizing(true);
    setSummary(null);
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${docId}/summarize`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { summary?: string } = await res.json();
      setSummary(data.summary || '- Không thể tạo tóm tắt.');
    } catch (e) {
      console.error('Summarize failed', e);
      setSummary('- Đã xảy ra lỗi khi tóm tắt tài liệu.');
    } finally {
      setSummarizing(false);
    }
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
    if (shelfId) navigate(`/documents/shelf/${shelfId}`);
    else navigate(-1);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="max-w-8xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        {/* Container for Document Content */}
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Container for Document Content */}
            <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6 pr-0.5 mb-6">
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
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
              {/* Action Buttons */}
              <div className="pointer-events-none absolute bottom-4 right-4">
                <div className="pointer-events-auto">
                  <ActionButtons onExport={handleExport} onSummarize={handleSummarize} onDelete={handleDelete} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            showSummary ? "w-96" : "w-80"
          )}>
            {/* Container for Thông tin tài liệu */}
            <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6 mb-6">
              <h3 className="text-base font-semibold text-blue-800 mb-3">Thông tin tài liệu</h3>
              <dl className="text-sm text-blue-800 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-blue-600">Tác giả</dt>
                  <dd className="text-right break-words">{(doc?.metadata as any)?.author || (doc?.metadata as any)?.uploaded_by || '—'}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-blue-600">Ngày hiệu lực</dt>
                  <dd className="text-right">{formatDate((doc?.metadata as any)?.effective_date)}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-blue-600">Ngày upload</dt>
                  <dd className="text-right">{formatDate(doc?.created_at || null)}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-blue-600">Phiên bản</dt>
                  <dd className="text-right">{(doc?.metadata as any)?.version || (doc?.metadata as any)?.revision || (doc?.metadata as any)?.doc_version || '—'}</dd>
                </div>
              </dl>
            </div>

            {/* Container for Summary */}
            {showSummary && (
              <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-blue-800">Tóm tắt tài liệu</h3>
                  <Button
                    variant="ghost"
                    onClick={() => setShowSummary(false)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full w-7 h-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-[calc(100vh-500px)] overflow-y-auto pr-2 scroll-smooth">
                  {summarizing ? (
                    <div className="text-sm text-blue-600 flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                      Đang tóm tắt...
                    </div>
                  ) : summary ? (
                    <div className="text-[15px] text-blue-800">
                      {summary.split('\n').map((line, idx) => {
                        const item = line.trim().replace(/^[-•*]\s*/, '');
                        if (!item) return null;
                        return (
                          <div key={idx} className="flex gap-3 mb-3">
                            <span className="text-blue-400 shrink-0">•</span>
                            <span className="leading-relaxed">{item}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-blue-600">Chưa có nội dung tóm tắt.</div>
                  )}
                </div>
              </div>
            )}

            {/* Container for Mô tả */}
            {Boolean((doc?.metadata as any)?.description) && (
              <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6">
                <h3 className="text-base font-semibold text-blue-800 mb-2">Mô tả</h3>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">
                  {(doc?.metadata as any)?.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;