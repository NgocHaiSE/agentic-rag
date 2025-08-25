import { memo } from 'react'

interface Props {
  title?: string
  subtitle?: string
  onClearChat?: () => void
  isStreaming?: boolean
  onStopStreaming?: () => void
}

function ChatHeader({ 
  title = 'AI Assistant', 
  subtitle = 'Hệ thống quản lý tri thức',
  onClearChat,
  isStreaming = false,
  onStopStreaming
}: Props) {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Logo/Icon */}
            <div className="relative">
              <div className={`w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
                isStreaming ? 'animate-pulse' : ''
              }`}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white transition-all duration-200 ${
                isStreaming 
                  ? 'bg-orange-500 animate-pulse' 
                  : 'bg-green-500 animate-pulse'
              }`}></div>
            </div>

            {/* Title and Subtitle */}
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-slate-600 font-medium">
                {isStreaming ? (
                  <span className="flex items-center space-x-2">
                    <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Đang trả lời...</span>
                  </span>
                ) : (
                  subtitle
                )}
              </p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-3">
            {/* Status Display */}
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl border transition-all duration-200 ${
              isStreaming 
                ? 'bg-orange-50 border-orange-200/50'
                : 'bg-green-50 border-green-200/50'
            }`}>
              <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                isStreaming 
                  ? 'bg-orange-500 animate-pulse'
                  : 'bg-green-500 animate-pulse'
              }`}></div>
              <span className={`text-sm font-medium transition-colors duration-200 ${
                isStreaming 
                  ? 'text-orange-700'
                  : 'text-green-700'
              }`}>
                {isStreaming ? 'Đang xử lý' : 'Sẵn sàng'}
              </span>
            </div>

            {/* Stop Streaming Button */}
            {isStreaming && onStopStreaming && (
              <button
                onClick={onStopStreaming}
                className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                title="Dừng phản hồi"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            
            {/* Clear Chat Button */}
            {onClearChat && (
              <button
                onClick={onClearChat}
                disabled={isStreaming}
                className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                title="Xóa cuộc trò chuyện"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H7a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            
          </div>
        </div>

      </div>
    </header>
  )
}

export default memo(ChatHeader)