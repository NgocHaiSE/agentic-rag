import { useState, useEffect } from 'react'

interface Props {
  content: string
  isStreaming?: boolean
  onContentUpdate?: (visibleContent: string) => void
}

export function ResponseParser({ content, isStreaming = false, onContentUpdate }: Props) {
  const [visibleContent, setVisibleContent] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingContent, setThinkingContent] = useState('')

  useEffect(() => {
    parseResponse(content)
  }, [content])

  const parseResponse = (fullContent: string) => {
    // Regex để tìm thinking blocks
    const thinkingRegex = /<think>([\s\S]*?)<\/think>/gi
    const thinkingMatches = [...fullContent.matchAll(thinkingRegex)]
    
    if (thinkingMatches.length > 0) {
      // Có thinking content
      const lastThinkingMatch = thinkingMatches[thinkingMatches.length - 1]
      const thinkingEndIndex = lastThinkingMatch.index! + lastThinkingMatch[0].length
      
      // Lấy thinking content (ẩn đi)
      const thinking = lastThinkingMatch[1].trim()
      setThinkingContent(thinking)
      
      // Lấy response content (hiển thị)
      const response = fullContent.substring(thinkingEndIndex).trim()
      
      if (response) {
        // Đã có response, ẩn thinking và hiển thị response
        setIsThinking(false)
        setVisibleContent(response)
        onContentUpdate?.(response)
      } else if (isStreaming) {
        // Đang trong thinking phase
        setIsThinking(true)
        setVisibleContent('')
        onContentUpdate?.('')
      }
    } else {
      // Không có thinking tags, hiển thị toàn bộ content
      setIsThinking(false)
      setVisibleContent(fullContent)
      onContentUpdate?.(fullContent)
    }
  }

  return {
    visibleContent,
    isThinking,
    thinkingContent
  }
}

// Hook để sử dụng response parser
export function useResponseParser(content: string, isStreaming: boolean = false) {
  const [visibleContent, setVisibleContent] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingContent, setThinkingContent] = useState('')

  useEffect(() => {
    parseResponse(content)
  }, [content, isStreaming])

  const parseResponse = (fullContent: string) => {
    if (!fullContent) {
      setVisibleContent('')
      setIsThinking(false)
      setThinkingContent('')
      return
    }

    // Regex để tìm thinking blocks (case insensitive)
    const thinkingRegex = /<think>([\s\S]*?)<\/think>/gi
    const matches = [...fullContent.matchAll(thinkingRegex)]
    
    if (matches.length === 0) {
      // Không có thinking tags
      setIsThinking(false)
      setVisibleContent(fullContent)
      setThinkingContent('')
      return
    }

    // Có thinking content
    const lastMatch = matches[matches.length - 1]
    const thinking = lastMatch[1].trim()
    setThinkingContent(thinking)
    
    // Lấy content sau thinking tag cuối cùng
    const thinkingEndIndex = lastMatch.index! + lastMatch[0].length
    const responseContent = fullContent.substring(thinkingEndIndex).trim()
    
    if (responseContent) {
      // Đã có response content, chuyển sang hiển thị response
      setIsThinking(false)
      setVisibleContent(responseContent)
    } else {
      // Chỉ có thinking, chưa có response
      if (isStreaming) {
        setIsThinking(true)
        setVisibleContent('')
      } else {
        // Không streaming nhưng chỉ có thinking - hiển thị fallback
        setIsThinking(false)
        setVisibleContent('...')
      }
    }
  }

  return {
    visibleContent,
    isThinking,
    thinkingContent,
    hasThinking: thinkingContent.length > 0
  }
}

// Component hiển thị thinking indicator
export function ThinkingIndicator({ thinkingContent }: { thinkingContent?: string }) {
  const [dots, setDots] = useState('.')
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.')
    }, 500)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-start space-x-4 animate-fade-in">
      <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 border border-amber-200 shadow-sm flex items-center justify-center">
        <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
        </svg>
      </div>
      
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl rounded-bl-lg px-6 py-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-sm text-amber-700 font-medium">
            AI đang suy nghĩ{dots}
          </span>
        </div>
        
        {/* Optional: Hiển thị một phần thinking content nếu cần */}
        {thinkingContent && (
          <div className="mt-3 text-xs text-amber-600 opacity-70 italic">
            Đang phân tích câu hỏi và lên kế hoạch trả lời...
          </div>
        )}
      </div>
    </div>
  )
}