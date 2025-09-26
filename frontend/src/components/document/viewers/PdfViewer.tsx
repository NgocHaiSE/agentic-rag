import { useEffect, useMemo, useRef, useState, type FC } from 'react'
import DocViewer, {
  DocViewerRenderers,
  type DocViewerRef,
  type IDocument,
} from '@cyntler/react-doc-viewer'
import '@cyntler/react-doc-viewer/dist/index.css'

interface PdfViewerProps {
  documentId: string
  apiBaseUrl: string
  title?: string | null
}

const LoadingRenderer: FC<{ document: IDocument | undefined; fileName: string }> = () => (
  <div className="flex items-center justify-center h-full text-blue-600">
    Đang tải PDF...
  </div>
)

const PdfViewer: FC<PdfViewerProps> = ({ documentId, apiBaseUrl, title }) => {
  const viewerRef = useRef<DocViewerRef | null>(null)
  const [ready, setReady] = useState(false)

  const downloadUrl = useMemo(
    () => `${apiBaseUrl}/documents/${documentId}/download`,
    [apiBaseUrl, documentId],
  )

  const documents = useMemo(() => {
    if (!documentId) return []
    return [
      {
        uri: `${downloadUrl}?inline=1`,
        fileType: 'pdf',
        fileName: title || undefined,
      },
    ]
  }, [downloadUrl, documentId, title])

  useEffect(() => {
    setReady(false)
  }, [downloadUrl])

  const config = useMemo(
    () => ({
      header: { disableFileName: true, disableHeader: false, retainURLParams: true },
      loadingRenderer: { overrideComponent: LoadingRenderer },
      pdfZoom: { defaultZoom: 1.0, zoomJump: 0.25 },
      pdfVerticalScrollByDefault: true,
    }),
    [],
  )

  const goPrevious = () => viewerRef.current?.prev()
  const goNext = () => viewerRef.current?.next()

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-blue-700">Xem trước PDF</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrevious}
            disabled={!ready}
            className="px-3 py-1.5 rounded-md border border-blue-200 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Trang trước
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!ready}
            className="px-3 py-1.5 rounded-md border border-blue-200 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Trang tiếp
          </button>
          <a
            href={downloadUrl}
            className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            Tải xuống
          </a>
        </div>
      </div>
      <div className="flex-1 overflow-auto rounded-2xl border border-blue-200 bg-white">
        <DocViewer
          ref={viewerRef}
          documents={documents}
          pluginRenderers={DocViewerRenderers}
          style={{ width: '100%', height: '100%' }}
          config={config}
          requestHeaders={{ Accept: '*/*' }}
          onDocumentChange={() => setReady(true)}
        />
      </div>
    </div>
  )
}

export default PdfViewer
