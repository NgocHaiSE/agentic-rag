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