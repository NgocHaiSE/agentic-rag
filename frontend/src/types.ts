export interface Message {
  role: 'user' | 'assistant'
  content: string
  // Optional future fields
  id?: string
  createdAt?: number
}


export interface ChatResponse {
  message: string
  session_id: string
}