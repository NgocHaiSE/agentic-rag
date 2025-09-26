import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from "@/lib/utils";
import { ChevronLeft, X } from 'lucide-react';
import BlurModal from '@/components/ui/blur-modal';
import ActionButtons from '@/components/document/ActionButtons';
import PdfViewer from '@/components/document/viewers/PdfViewer';
import WordViewer from '@/components/document/viewers/WordViewer';
import ImageViewer from '@/components/document/viewers/ImageViewer';
import TextViewer from '@/components/document/viewers/TextViewer';
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
  const [versions, setVersions] = useState<any[]>([]);
  const [showVersionForm, setShowVersionForm] = useState<boolean>(false);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionSummary, setNewVersionSummary] = useState<string>("");
  const [newVersionBump, setNewVersionBump] = useState<'minor' | 'major'>('minor');
  const [newVersionString, setNewVersionString] = useState<string>("");
  const [newVersionDocTypeId, setNewVersionDocTypeId] = useState<string>("");
  const [docTypes, setDocTypes] = useState<{ id: string; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [diffText, setDiffText] = useState<string>("");
  const [diffWithVersionId, setDiffWithVersionId] = useState<string | null>(null);
  const [authors, setAuthors] = useState<{ id: string; name: string }[]>([]);
  const fileExtension = useMemo(() => {
    const metaExt = (doc?.metadata?.file_extension || doc?.metadata?.extension) as string | undefined;
    if (metaExt && typeof metaExt === 'string') {
      return metaExt.replace(/^\./, '').toLowerCase();
    }
    const source = doc?.source;
    if (typeof source === 'string' && source.includes('.')) {
      return source.split('.').pop()?.toLowerCase() || '';
    }
    return '';
  }, [doc]);

  const formatDate = (s?: string | null) => {
    if (!s) return '';
    const d = new Date(s);
    return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString();
  };

  const viewerElement = useMemo(() => {
    if (!doc) return null;

    const commonProps = {
      documentId: doc.id,
      apiBaseUrl: API_BASE_URL,
      title: doc.title,
    } as const;

    if (fileExtension === 'pdf') {
      return (
        <div className="h-[calc(100vh-260px)]">
          <PdfViewer {...commonProps} />
        </div>
      );
    }

    if (fileExtension === 'doc' || fileExtension === 'docx') {
      return (
        <div className="h-[calc(100vh-260px)]">
          <WordViewer {...commonProps} extension={fileExtension} />
        </div>
      );
    }

    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tif', 'tiff', 'webp'].includes(fileExtension)) {
      return (
        <div className="h-[calc(100vh-260px)]">
          <ImageViewer {...commonProps} extension={fileExtension} />
        </div>
      );
    }

    if (doc.content) {
      return <TextViewer content={doc.content} title={doc.title} />;
    }

    return null;
  }, [doc, fileExtension]);

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

  const fetchVersions = async () => {
    if (!docId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${docId}/versions`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setVersions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load versions', e);
      setVersions([]);
    }
  };

  const fetchAuthors = async () => {
    try {
      const candidates = [
        `${API_BASE_URL}/metadata/accounts`,
        `${API_BASE_URL}/accounts`,
        `${API_BASE_URL}/users`,
      ];
      for (const url of candidates) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const data = await res.json();
          const items: { id: string; name: string }[] = Array.isArray(data)
            ? data.map((a: any) => ({ id: a.id || a.user_id || a.uuid, name: a.name || a.full_name || a.username || a.email || '' })).filter((a: any) => a.id)
            : Array.isArray((data as any).accounts)
              ? (data as any).accounts.map((a: any) => ({ id: a.id || a.user_id || a.uuid, name: a.name || a.full_name || a.username || a.email || '' })).filter((a: any) => a.id)
              : [];
          setAuthors(items);
          if (items.length) return;
        } catch {}
      }
      setAuthors([]);
    } catch {
      setAuthors([]);
    }
  };

  const fetchDocTypes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/metadata/document-types`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setDocTypes(data);
    } catch (e) {
      console.error('Failed to load document types', e);
    }
  };

  useEffect(() => {
    if (docId) {
      fetchDocument();
      fetchVersions();
      fetchAuthors();
      fetchDocTypes();
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

  const authorName = useMemo(() => {
    const md: any = doc?.metadata || {};
    if (md.author) return md.author;
    if (md.uploaded_by) return md.uploaded_by;
    const authorId = md.author_id;
    if (authorId && authors.length) {
      const found = authors.find(a => a.id === authorId);
      if (found?.name) return found.name;
    }
    return '—';
  }, [doc, authors]);

  const handleUploadNewVersion = async () => {
    if (!docId || !newVersionFile || !newVersionSummary.trim()) return;
    try {
      const fd = new FormData();
      fd.append('file', newVersionFile);
      fd.append('change_summary', newVersionSummary);
      fd.append('bump', newVersionBump);
      if (newVersionString.trim()) fd.append('version', newVersionString.trim());
      if (newVersionDocTypeId) fd.append('document_type_id', newVersionDocTypeId);
      const res = await fetch(`${API_BASE_URL}/documents/${docId}/versions`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Refresh
      setShowVersionForm(false);
      setNewVersionFile(null);
      setNewVersionSummary('');
      setNewVersionString('');
      setNewVersionDocTypeId('');
      await fetchDocument();
      await fetchVersions();
    } catch (e) {
      console.error('Upload new version failed', e);
    }
  };

  const handleCompareWith = async (versionId: string) => {
    if (!docId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${docId}/versions/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ left: 'current', right: versionId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDiffText(data.diff || '');
      setDiffWithVersionId(versionId);
    } catch (e) {
      console.error('Compare failed', e);
      setDiffText('');
      setDiffWithVersionId(null);
    }
  };

  const handleRollback = async (versionId: string) => {
    if (!docId) return;
    if (!confirm('Khôi phục phiên bản này? Tài liệu sẽ trở về nội dung của phiên bản đã chọn.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${docId}/versions/${versionId}/rollback`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchDocument();
      await fetchVersions();
      setDiffText('');
      setDiffWithVersionId(null);
    } catch (e) {
      console.error('Rollback failed', e);
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
                <h1 className='text-blue-700 font-bold text-md mb-2'>{doc?.title}</h1>
                {loading ? (
                  <div className="text-center text-blue-600">Đang tải nội dung...</div>
                ) : doc ? (
                  viewerElement ?? (
                    <div className="text-center text-blue-600">Không có nội dung để hiển thị.</div>
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

            {/* Version history and diff */}
            <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-blue-800">Lịch sử phiên bản</h3>
                <Button
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 rounded-md"
                  onClick={() => setShowVersionForm(true)}
                >
                  Cập nhật phiên bản mới
                </Button>
              </div>

              {showVersionForm && (
                <BlurModal open={showVersionForm} onClose={() => setShowVersionForm(false)}>
                  <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 ease-in-out">
                    <div className="flex items-center justify-between border-b border-blue-200 pb-4 mb-4">
                      <h3 className="text-lg font-semibold text-blue-800">Cập nhật phiên bản mới</h3>
                      <Button
                        variant="ghost"
                        onClick={() => setShowVersionForm(false)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full w-8 h-8"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">Tệp nội dung</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            readOnly
                            value={newVersionFile?.name || ''}
                            placeholder="Chưa chọn tệp"
                            className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-md bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            aria-label="Selected file"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Chọn tệp
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".txt,.md,.markdown"
                            onChange={(e) => setNewVersionFile(e.target.files?.[0] || null)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">Loại tài liệu</label>
                        <select
                          value={newVersionDocTypeId}
                          onChange={(e) => setNewVersionDocTypeId(e.target.value)}
                          className="w-full border border-blue-200 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Chọn loại tài liệu...</option>
                          {docTypes.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">Tóm tắt thay đổi</label>
                        <textarea
                          value={newVersionSummary}
                          onChange={(e) => setNewVersionSummary(e.target.value)}
                          className="w-full border border-blue-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                          placeholder="Ví dụ: Cập nhật mục 3.2 về khoảng cách an toàn"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">Phiên bản</label>
                        <Input
                          placeholder="Ví dụ: 1.2 hoặc 2.0"
                          value={newVersionString}
                          onChange={(e) => setNewVersionString(e.target.value)}
                          className="w-full border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-3 mt-4">
                        <Button
                          className="bg-blue-600 text-white hover:bg-blue-700 w-full py-2 rounded-md"
                          disabled={!newVersionFile || !newVersionSummary.trim()}
                          onClick={handleUploadNewVersion}
                        >
                          Xác nhận tải lên
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowVersionForm(false)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 w-full py-2 rounded-md"
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  </div>
                </BlurModal>
              )}

              {versions.length === 0 ? (
                <div className="text-sm text-blue-600">Chưa cập nhật phiên bản nào</div>
              ) : (
                <div className="space-y-3">
                  {versions.map((v, idx) => {
                    const currentVer = String((doc?.metadata as any)?.version || '');
                    const isCurrent = Boolean(v.is_current) || (v.version && currentVer && v.version === currentVer);
                    return (
                    <div key={idx} className="border border-blue-100 rounded-md p-3 flex items-start justify-between gap-3">
                      <div className="text-sm">
                        <div className="font-medium text-blue-800">Phiên bản {v.version}{isCurrent ? ' (hiện tại)' : ''}</div>
                        <div className="text-blue-600">
                          {v.created_by_name ? `Bởi ${v.created_by_name}` : ''}
                          {v.created_at ? ` • ${new Date(v.created_at).toLocaleString()}` : ''}
                        </div>
                        {v.change_summary && <div className="text-blue-700 mt-1">{v.change_summary}</div>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {!isCurrent && v.version_id && (
                          <>
                            <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => handleCompareWith(v.version_id)}>
                              So sánh với phiên bản hiện tại
                            </Button>
                            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => handleRollback(v.version_id)}>
                              Khôi phục
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              )}

              {diffText && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-blue-700">So sánh: hiện tại ↔ {diffWithVersionId}</div>
                    <Button variant="ghost" className="text-blue-600" onClick={() => { setDiffText(''); setDiffWithVersionId(null); }}>Đóng</Button>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs bg-white p-3 rounded-md border border-blue-200 overflow-x-auto">
                    {diffText}
                  </pre>
                </div>
              )}
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
                  <dd className="text-right break-words">{authorName}</dd>
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
