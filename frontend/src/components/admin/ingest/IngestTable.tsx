import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { IngestJob } from '@/types'

type Props = {
  jobs: IngestJob[]
  onSelect: (j: IngestJob) => void
}

function StatusBadge({ status }: { status: IngestJob['status'] }) {
  const map = {
    processing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
  } as const
  const label = status === 'processing' ? 'Đang xử lý' : status === 'success' ? 'Thành công' : status === 'failed' ? 'Thất bại' : 'Chờ duyệt'
  return <Badge className={`${map[status]} border`}>{label}</Badge>
}

export default function IngestTable({ jobs, onSelect }: Props) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[32%]">Tài liệu</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Người up</TableHead>
            <TableHead>Đơn vị</TableHead>
            <TableHead>Khu vực</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Thời gian</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((j) => (
            <TableRow key={j.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onSelect(j)}>
              <TableCell className="font-medium text-gray-900">{j.title}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <StatusBadge status={j.status} />
                  {j.status === 'processing' && (
                    <div className="pt-1">
                      <Progress value={typeof j.progress === 'number' ? j.progress : undefined} />
                      <div className="text-[11px] text-gray-500 mt-1">
                        {typeof j.chunksInserted === 'number' ? j.chunksInserted : 0}
                        {typeof j.chunksTotal === 'number' ? `/${j.chunksTotal}` : ''} chunks
                        {typeof j.progress === 'number' ? ` • ${j.progress}%` : ''}
                      </div>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{j.uploadedBy || '-'}</TableCell>
              <TableCell>{j.orgUnit || '-'}</TableCell>
              <TableCell>{j.site || '-'}</TableCell>
              <TableCell>{j.documentType || '-'}</TableCell>
              <TableCell>{j.createdAt ? new Date(j.createdAt).toLocaleString() : '-'}</TableCell>
            </TableRow>
          ))}
          {jobs.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-500 py-8">Không có dữ liệu</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

