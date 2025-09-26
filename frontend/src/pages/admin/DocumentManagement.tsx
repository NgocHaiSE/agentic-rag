import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/admin/layout/Sidebar'
import IngestSummary from '@/components/admin/documents/IngestSummary'
import IngestFilters from '@/components/admin/documents/IngestFilter'
import IngestTable from '@/components/admin/documents/IngestTable'
import IngestDetailDialog from '@/components/admin/documents/IngestDetailDialog'
import { fetchIngestJobs } from '@/data/ingest'
import type { IngestJob } from '@/types'

export default function AdminIngest() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const [jobs, setJobs] = useState<IngestJob[]>([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [timeframe, setTimeframe] = useState('all')
  const [selected, setSelected] = useState<IngestJob | null>(null)
  const [open, setOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchIngestJobs()
      setJobs(data)
    } catch (e) {
      console.error('Failed to load ingest jobs', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 5000) // poll for progress updates
    return () => clearInterval(t)
  }, [])

  const filtered = useMemo(() => {
    const now = Date.now()
    const tfMs = timeframe === '7d' ? 7 * 24 * 3600 * 1000 : timeframe === '30d' ? 30 * 24 * 3600 * 1000 : 0
    return jobs.filter((j) => {
      if (status !== 'all' && j.status !== (status as any)) return false
      if (tfMs && j.createdAt) {
        if (now - new Date(j.createdAt).getTime() > tfMs) return false
      }
      const text = `${j.title} ${j.uploadedBy || ''} ${j.orgUnit || ''} ${j.site || ''}`.toLowerCase()
      return text.includes(q.toLowerCase())
    })
  }, [jobs, q, status, timeframe])

  const onSelect = (j: IngestJob) => {
    setSelected(j)
    setOpen(true)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user ?? {}} signOut={signOut} navigate={navigate} />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quản lý Ingest Tài liệu</h2>
          <IngestSummary jobs={jobs} />
          <IngestFilters q={q} setQ={setQ} status={status} setStatus={setStatus} timeframe={timeframe} setTimeframe={setTimeframe} />
          {loading && <div className="text-sm text-gray-500 mb-2">Đang tải dữ liệu...</div>}
          <IngestTable jobs={filtered} onSelect={onSelect} />
        </div>
      </div>

      <IngestDetailDialog job={selected} open={open} onOpenChange={setOpen} />
    </div>
  )
}

