import { useState, useRef, useEffect } from 'react'

interface Props {
  onSend: (text: string) => Promise<void> | void
  disabled?: boolean
  isStreaming?: boolean
  onStop?: () => void
}

export default function ChatInput({ onSend, disabled, isStreaming = false, onStop }: Props) {
  const [text, setText] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = text.trim()
    if (!value || disabled || isStreaming) return
    setText('')
    setIsExpanded(false)
    await onSend(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
    
    // ESC để stop streaming
    if (e.key === 'Escape' && isStreaming && onStop) {
      onStop()
    }
  }

  const handleFocus = () => {
    setIsExpanded(true)
  }

  const handleBlur = () => {
    if (!text.trim()) {
      setIsExpanded(false)
    }
  }

  // Auto-focus khi streaming kết thúc
  useEffect(() => {
    if (!isStreaming && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isStreaming])

  const quickPrompts = [
    "Chiến lược AI của Google",
    "Partnership Microsoft-OpenAI"
  ]

  const handleQuickPrompt = (prompt: string) => {
    setText(prompt)
    setIsExpanded(true)
    textareaRef.current?.focus()
  }

  return (
    <div className="sticky bottom-0 z-10 bg-white/90 backdrop-blur-xl border-t border-slate-200/50 shadow-lg">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        

        {/* Streaming Status */}
        {/* {isStreaming && (
          <div className="animate-slide-up">
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3"> */}
              {/* <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm font-medium text-blue-700">
                  AI đang phản hồi theo thời gian thực...
                </span>
              </div> */}
              
              {/* {onStop && (
                <button
                  onClick={onStop}
                  className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 hover:border-red-300 transition-all duration-200"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                  <span>Dừng</span>
                </button>
              )} */}
            {/* </div> */}
          {/* </div> */}
        {/* )} */}

        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <div className={`relative transition-all duration-200 ${
                isExpanded ? 'transform scale-[1.02]' : ''
              } ${isStreaming ? 'opacity-50' : ''}`}>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder={
                    isStreaming 
                      ? "Đang chờ phản hồi... Nhấn ESC để dừng"
                      : "Hỏi tôi về AI, công nghệ, hoặc phân tích doanh nghiệp..."
                  }
                  disabled={disabled || isStreaming}
                  rows={isExpanded ? 3 : 1}
                  maxLength={2000}
                  className={`w-full px-4 py-3 pr-12 text-sm bg-white border rounded-2xl shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed resize-none transition-all duration-200 ${
                    isStreaming 
                      ? 'border-orange-300 focus:ring-orange-500 bg-orange-50/50' 
                      : isExpanded 
                        ? 'border-blue-300 focus:ring-blue-500 shadow-md' 
                        : 'border-slate-300 focus:ring-blue-500 hover:border-slate-400'
                  } ${disabled ? 'opacity-50' : ''}`}
                  style={{ minHeight: '52px' }}
                />
                
                {/* Character count when expanded */}
                {isExpanded && text.length > 0 && (
                  <div className={`absolute bottom-2 right-14 text-xs transition-colors ${
                    text.length > 1800 ? 'text-red-500' : 'text-slate-400'
                  }`}>
                    {text.length}/2000
                  </div>
                )}

                {/* Microphone button */}
                <button
                  type="button"
                  disabled={disabled || isStreaming}
                  className="absolute right-3 bottom-3 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Voice input (coming soon)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Send/Stop button */}
            <button
              type={isStreaming ? "button" : "submit"}
              onClick={isStreaming ? onStop : undefined}
              disabled={(!text.trim() && !isStreaming) || disabled}
              className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl shadow-sm transition-all duration-200 ${
                disabled && !isStreaming
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : isStreaming
                    ? 'bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-md hover:scale-105 active:scale-95 shadow-red-200/50'
                    : !text.trim()
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-md hover:scale-105 active:scale-95 shadow-blue-200/50'
              }`}
              title={isStreaming ? "Dừng phản hồi" : "Gửi tin nhắn"}
            >
              {isStreaming ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
              ) : disabled ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </form>

        {/* Footer info when expanded */}
        {isExpanded && !isStreaming && (
          <div className="flex items-center justify-between text-xs text-slate-500 animate-fade-in">
            <div className="flex items-center space-x-4">
              <span>Nhấn Enter để gửi, Shift+Enter để xuống dòng</span>
              {text.length > 0 && (
                <span>ESC để xóa nội dung</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span>Realtime streaming enabled</span>
              </div>
            </div>
          </div>
        )}

        {/* Streaming controls footer */}
        {isStreaming && (
          <div className="flex items-center justify-center text-xs text-slate-500 animate-fade-in">
            <div className="flex items-center space-x-4">
              <span>⚡ Streaming mode active</span>
              <span>•</span>
              <span>Press ESC or click Stop to interrupt</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}