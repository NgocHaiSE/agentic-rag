export interface Message {
  role: 'user' | 'assistant'
  content: string
  // Optional future fields
  id?: string
  createdAt?: number
  toolsUsed?: ToolCall[]
}

export interface ToolCall {
  tool_name: string
  args?: {
    query?: string
    limit?: number
    [key: string]: any
  }
  tool_call_id?: string
}

export interface ChatResponse {
  message: string
  session_id: string
  tools_used?: ToolCall[]
}

export type StatusType = 'Đã xử lý' | 'Đang xử lý' | 'Hoàn thành' | 'Lỗi';

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  status: StatusType;
  tags: string[];
  authorId?: string;
  issuingUnitId?: string;
  issuingUnitName?: string;
  documentTypeName?: string;
}

// Detailed document payload returned by GET /documents/{id}
export interface DocumentDetail {
  id: string;
  title: string;
  source?: string | null;
  content?: string | null;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// Ingestion management
export type IngestStatus = 'processing' | 'success' | 'failed' | 'pending';

export interface IngestJob {
  id: string;
  title: string;
  status: IngestStatus;
  progress?: number; // 0-100 if available
  chunksInserted?: number;
  chunksTotal?: number;
  uploadedBy?: string;
  orgUnit?: string;
  site?: string;
  documentType?: string;
  fileName?: string;
  fileSize?: number;
  accessLevel?: string;
  effectiveDate?: string;
  createdAt?: string;
  updatedAt?: string;
  chunksCreated?: number;
  relationshipsCreated?: number;
  errors?: string[];
  raw?: any; // original API record for debugging/details
}
