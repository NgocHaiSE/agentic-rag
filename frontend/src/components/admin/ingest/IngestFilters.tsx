import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

type Props = {
  q: string
  setQ: (v: string) => void
  status: string
  setStatus: (v: string) => void
  timeframe: string
  setTimeframe: (v: string) => void
}

export default function IngestFilters({ q, setQ, status, setStatus, timeframe, setTimeframe }: Props) {
  return (
    <div className="bg-white rounded-lg border p-4 mb-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Tìm theo tên, người up, đơn vị..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả</SelectItem>
          <SelectItem value="processing">Đang xử lý</SelectItem>
          <SelectItem value="pending">Chờ duyệt</SelectItem>
          <SelectItem value="success">Thành công</SelectItem>
          <SelectItem value="failed">Thất bại</SelectItem>
        </SelectContent>
      </Select>
      <Select value={timeframe} onValueChange={setTimeframe}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Thời gian" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả thời gian</SelectItem>
          <SelectItem value="7d">7 ngày</SelectItem>
          <SelectItem value="30d">30 ngày</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

