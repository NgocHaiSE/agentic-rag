import { memo } from 'react'
import type { Message } from '../types'
import { useResponseParser } from './ResponseParser'

interface Props {
  msg: Message
  isStreaming?: boolean
}

function MessageBubble({ msg, isStreaming = false }: Props) {
  const isUser = msg.role === 'user'
  
  // Parse response để ẩn thinking và chỉ hiển thị response
  const { visibleContent, isThinking, hasThinking } = useResponseParser(
    msg.content, 
    isStreaming
  )
  
  const hasTools = msg.toolsUsed && msg.toolsUsed.length > 0

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Nếu là assistant message và đang thinking, không hiển thị gì
  if (!isUser && isThinking && !visibleContent) {
    return null
  }

  // Nếu là assistant message và không có visible content, không hiển thị
  if (!isUser && !visibleContent.trim()) {
    return null
  }

  return (
    <div className={`flex items-start space-x-4 group animate-slide-up ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-200 ${
        isUser 
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200/50' 
          : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 border border-slate-300 shadow-slate-200/50'
      }`}>
        {isUser ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
          </svg>
        )}
      </div>
      
      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block px-6 py-4 shadow-sm transition-all duration-200 group-hover:shadow-md ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-3xl rounded-br-lg shadow-blue-200/50'
            : 'bg-white text-slate-800 border border-slate-200 rounded-3xl rounded-bl-lg shadow-slate-200/50 hover:border-slate-300'
        } ${isStreaming && !isUser ? 'border-l-4 border-l-green-500' : ''}`}>
          
          {/* Thinking indicator (chỉ hiển thị khi đang thinking) */}
          {!isUser && isThinking && (
            <div className="flex items-center space-x-2 text-amber-600 mb-2">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs font-medium">Đang suy nghĩ...</span>
            </div>
          )}

          {/* Streaming indicator */}
          {!isUser && isStreaming && visibleContent && (
            <div className="flex items-center space-x-2 text-green-600 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">Streaming realtime</span>
            </div>
          )}
          
          {/* Main content */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
            {isUser ? msg.content : visibleContent}
            {/* Typing cursor cho streaming */}
            {!isUser && isStreaming && visibleContent && (
              <span className="inline-block w-0.5 h-4 bg-current animate-pulse ml-1"></span>
            )}
          </div>

          {/* Debug info - chỉ hiển thị trong development */}
          {process.env.NODE_ENV === 'development' && hasThinking && (
            <details className="mt-3 text-xs text-slate-500">
              <summary className="cursor-pointer hover:text-slate-700">
                Debug: Thinking content (click to expand)
              </summary>
              <div className="mt-2 p-2 bg-slate-100 rounded border text-slate-600 font-mono text-xs">
                {msg.content}
              </div>
            </details>
          )}
        </div>
        
        {/* Tools Used Display */}
        {hasTools && !isUser && visibleContent && (
          <div className="mt-4 ml-2 space-y-3">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
              <span className="font-medium">Công cụ đã sử dụng:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {msg.toolsUsed?.map((tool, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 hover:bg-slate-100 transition-colors">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 capitalize">
                        {tool.tool_name.replace('_', ' ')}
                      </div>
                      {tool.args && (
                        <div className="text-xs text-slate-500 mt-1 space-y-1">
                          {tool.args.query && (
                            <div className="truncate">
                              <span className="font-medium">Query:</span> {tool.args.query}
                            </div>
                          )}
                          {tool.args.limit && (
                            <div>
                              <span className="font-medium">Limit:</span> {tool.args.limit}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Timestamp */}
        <div className={`mt-2 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
          isUser ? 'text-right' : 'text-left'
        }`}>
          {msg.createdAt !== undefined ? formatTime(msg.createdAt) : ''}
        </div>
      </div>
    </div>
  )
}

export default memo(MessageBubble)