import { useMemo, useState, type FC } from 'react'

interface ImageViewerProps {
  documentId: string
  apiBaseUrl: string
  title?: string | null
  extension?: string
}

const ImageViewer: FC<ImageViewerProps> = ({ documentId, apiBaseUrl, title, extension }) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const downloadUrl = useMemo(
    () => `${apiBaseUrl}/documents/${documentId}/download`,
    [apiBaseUrl, documentId],
  )

  const inlineUrl = useMemo(
    () => `${downloadUrl}?inline=1`,
    [downloadUrl],
  )

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-blue-700">
          {(extension || '').toUpperCase() || 'Ảnh'}
        </span>
        <a
          href={downloadUrl}
          className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          Tải xuống
        </a>
      </div>
      <div className="relative flex-1 overflow-auto rounded-2xl border border-blue-200 bg-gray-50 p-4">
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center text-blue-600 text-sm bg-white/70">
            Đang tải hình ảnh...
          </div>
        )}
        {status === 'error' ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-blue-700">
            <span>Không thể hiển thị hình ảnh.</span>
            <a
              href={downloadUrl}
              className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
              Tải xuống để xem
            </a>
          </div>
        ) : (
          <img
            src={inlineUrl}
            alt={title || 'Uploaded image'}
            onLoad={() => setStatus('ready')}
            onError={() => setStatus('error')}
            className="mx-auto block max-w-full max-h-full object-contain shadow-md rounded-lg"
            loading="lazy"
          />
        )}
      </div>
    </div>
  )
}

export default ImageViewer
