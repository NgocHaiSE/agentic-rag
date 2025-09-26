import type { IngestJob, IngestStatus } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8058'

// Map backend document to an ingest job row
function mapDocToJob(doc: any): IngestJob {
  const md = doc?.metadata || {}
  // Status normalization
  const rawStatus = (md.status || md.ingest_status || md.approval_status || '').toString().toLowerCase()
  let status: IngestStatus = 'success'
  if (rawStatus.includes('fail') || rawStatus.includes('error')) status = 'failed'
  else if (rawStatus.includes('process') || rawStatus === 'processing') status = 'processing'
  else if (rawStatus.includes('pending') || rawStatus.includes('await') || rawStatus.includes('approval')) status = 'pending'

  // If errors array present, treat as failed
  if (Array.isArray(md.errors) && md.errors.length) status = 'failed'

  // File info
  const filePath = md.file_path || md.source || ''
  const fileName = filePath.split(/[\\/]/).pop() || undefined
  const fileSize = Number(md.file_size || 0) || undefined

  const createdAt = doc.created_at ? new Date(doc.created_at).toISOString() : undefined
  const updatedAt = doc.updated_at ? new Date(doc.updated_at).toISOString() : undefined

  // Progress and chunk info
  const chunksInserted = typeof doc.chunk_count === 'number' ? doc.chunk_count : (typeof md.chunks_inserted === 'number' ? md.chunks_inserted : undefined)
  const chunksTotal = (
    typeof md.chunks_total === 'number' ? md.chunks_total :
    typeof md.total_chunks === 'number' ? md.total_chunks :
    typeof md.expected_chunks === 'number' ? md.expected_chunks :
    undefined
  )
  let progress: number | undefined = undefined
  if (typeof md.progress === 'number') {
    progress = md.progress
  } else if (typeof chunksInserted === 'number' && typeof chunksTotal === 'number' && chunksTotal > 0) {
    progress = Math.round((chunksInserted / chunksTotal) * 100)
  }

  return {
    id: doc.id,
    title: doc.title || md.title || fileName || 'Untitled',
    status,
    progress,
    chunksInserted,
    chunksTotal,
    uploadedBy: md.author || md.uploaded_by,
    orgUnit: md.issuing_unit_name || md.issuing_unit_id,
    site: md.site_name || md.site_id,
    documentType: md.document_type_name || md.document_type_id,
    fileName,
    fileSize,
    accessLevel: md.access_level,
    effectiveDate: md.effective_date,
    createdAt,
    updatedAt,
    chunksCreated: md.chunks_created,
    relationshipsCreated: md.relationships_created,
    errors: Array.isArray(md.errors) ? md.errors : md.error ? [String(md.error)] : undefined,
    raw: doc,
  }
}

export async function fetchIngestJobs(): Promise<IngestJob[]> {
  const res = await fetch(`${API_BASE_URL}/documents`)
  if (!res.ok) throw new Error(`Failed to load documents: ${res.status}`)
  const data = await res.json()
  const docs = Array.isArray(data?.documents) ? data.documents : []
  return docs.map(mapDocToJob)
}

export function summarizeJobs(jobs: IngestJob[]) {
  const summary = {
    total: jobs.length,
    processing: 0,
    success: 0,
    failed: 0,
    pending: 0,
  }
  for (const j of jobs) {
    // @ts-ignore keep dynamic increment for our keys
    summary[j.status]++
  }
  return summary
}
