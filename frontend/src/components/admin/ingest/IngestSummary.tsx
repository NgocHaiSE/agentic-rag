import { CheckCircle2, Clock4, Hourglass, XCircle } from 'lucide-react'
import { summarizeJobs } from '@/data/ingest'
import type { IngestJob } from '@/types'

type Props = {
  jobs: IngestJob[]
}

export default function IngestSummary({ jobs }: Props) {
  const s = summarizeJobs(jobs)
  const cards = [
    { label: 'Tổng số', value: s.total, icon: <Clock4 className="h-5 w-5 text-gray-500" />, color: 'bg-gray-50' },
    { label: 'Đang xử lý', value: s.processing, icon: <Clock4 className="h-5 w-5 text-yellow-600" />, color: 'bg-yellow-50' },
    { label: 'Chờ duyệt', value: s.pending, icon: <Hourglass className="h-5 w-5 text-amber-600" />, color: 'bg-amber-50' },
    { label: 'Thành công', value: s.success, icon: <CheckCircle2 className="h-5 w-5 text-green-600" />, color: 'bg-green-50' },
    { label: 'Thất bại', value: s.failed, icon: <XCircle className="h-5 w-5 text-red-600" />, color: 'bg-red-50' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-lg ${c.color} p-4 border border-gray-200`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">{c.label}</div>
              <div className="text-2xl font-bold text-gray-900">{c.value}</div>
            </div>
            {c.icon}
          </div>
        </div>
      ))}
    </div>
  )
}

