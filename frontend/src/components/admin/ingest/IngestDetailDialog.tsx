import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import type { IngestJob } from '@/types'

type Props = {
  job?: IngestJob | null
  open: boolean
  onOpenChange: (o: boolean) => void
}

export default function IngestDetailDialog({ job, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết tài liệu</DialogTitle>
        </DialogHeader>
        {!job ? (
          <div className="text-gray-500">Không có dữ liệu</div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Tên tài liệu</div>
              <div className="text-lg font-semibold">{job.title}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <Info label="Trạng thái" value={job.status === 'processing' ? 'Đang xử lý' : job.status === 'success' ? 'Thành công' : job.status === 'failed' ? 'Thất bại' : 'Chờ duyệt'} />
              <Info label="Người tải lên" value={job.uploadedBy || '-'} />
              <Info label="Đơn vị" value={job.orgUnit || '-'} />
              <Info label="Khu vực" value={job.site || '-'} />
              <Info label="Loại tài liệu" value={job.documentType || '-'} />
              <Info label="Ngày hiệu lực" value={job.effectiveDate || '-'} />
              <Info label="Tên tệp" value={job.fileName || '-'} />
              <Info label="Kích thước" value={job.fileSize ? `${(job.fileSize / 1024 / 1024).toFixed(2)} MB` : '-'} />
              <Info label="Quyền truy cập" value={job.accessLevel || '-'} />
              <Info label="Thời gian tải" value={job.createdAt ? new Date(job.createdAt).toLocaleString() : '-'} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <Info label="Số chunk" value={job.chunksCreated?.toString() || '-'} />
              <Info label="Số quan hệ" value={job.relationshipsCreated?.toString() || '-'} />
            </div>

            {job.status === 'processing' && (
              <div className="border rounded-md p-3">
                <div className="text-sm text-gray-600 mb-2">Tiến trình ingest</div>
                <Progress value={typeof job.progress === 'number' ? job.progress : undefined} />
                <div className="text-xs text-gray-500 mt-1">
                  {typeof job.chunksInserted === 'number' ? job.chunksInserted : 0}
                  {typeof job.chunksTotal === 'number' ? `/${job.chunksTotal}` : ''} chunks
                  {typeof job.progress === 'number' ? ` • ${job.progress}%` : ''}
                </div>
              </div>
            )}

            {job.errors && job.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-sm font-medium text-red-700">Lỗi</div>
                <ul className="list-disc text-sm text-red-700 ml-5 mt-1 space-y-1">
                  {job.errors.map((e, i) => (
                    <li key={i} className="break-all">{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-gray-500">{label}</div>
      <div className="text-gray-900 font-medium">{value || '-'}</div>
    </div>
  )
}

