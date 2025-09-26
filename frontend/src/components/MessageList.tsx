import { useEffect, useRef, useState } from 'react'
import type { Message, ToolCall } from '../types'
import MessageBubble from './MessageBubble'
import { ThinkingIndicator } from './ResponseParser'

interface Props {
  messages: Message[]
  isLoading?: boolean
  isThinking?: boolean
  thinkingContent?: string
  currentTools?: ToolCall[]
}

function LoadingAnimation() {
  return (
    <div className="flex items-start space-x-4 animate-fade-in">
      <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 border border-slate-300 shadow-sm flex items-center justify-center">
        <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
        </svg>
      </div>
      
      {/* <div className="bg-white border border-slate-200 rounded-3xl rounded-bl-lg px-6 py-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-sm text-slate-500 font-medium">AI đang khởi tạo...</span>
        </div>
        
        <div className="mt-3 flex items-center space-x-2 text-xs text-slate-400">
          <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Đang kết nối với AI engine...</span>
        </div>
      </div> */}
    </div>
  )
}

function WelcomeMessage() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 p-8 animate-fade-in">
      {/* Welcome Icon */}
      <div className="relative">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
          </svg>
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center animate-pulse">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        </div>
      </div>
      
      {/* Welcome Text */}
      <div className="text-center space-y-4 max-w-2xl">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
          Chào mừng bạn đến với 
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> AI Micco</span>
        </h2>
        {/* <div className="flex items-center justify-center space-x-2 text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clipRule="evenodd"/>
          </svg>
          <span className="font-medium">⚡ Smart Thinking Parser enabled</span>
        </div> */}
      </div>
      

    </div>
  )
}

export default function MessageList({ 
  messages, 
  isLoading, 
  isThinking = false, 
  thinkingContent = '',
  currentTools = []
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    
    // Smooth scroll to bottom
    const scrollToBottom = () => {
      el.scrollTo({ 
        top: el.scrollHeight, 
        behavior: 'smooth' 
      })
    }

    // Small delay to ensure content is rendered
    const timeoutId = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timeoutId)
  }, [messages.length, isLoading, isThinking])

  // Handle scroll to see new messages button
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100
      setShowScrollButton(!isNearBottom && messages.length > 0)
    }

    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [messages.length])

  const scrollToBottom = () => {
    const el = scrollerRef.current
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div ref={scrollerRef} className="h-full overflow-y-auto px-4 py-6">
        {messages.length === 0 && !isLoading && !isThinking ? (
          <WelcomeMessage />
        ) : (
          <div className="max-w-5xl mx-auto space-y-6">
            {messages.map((m, i) => (
              <div key={m.id ?? i} className="animate-slide-up">
                <MessageBubble msg={m} />
              </div>
            ))}

            {/* Show thinking indicator when AI is thinking */}
            {isThinking && (
              <div className="animate-fade-in">
                <ThinkingIndicator thinkingContent={thinkingContent} />
              </div>
            )}

            {/* Show loading when starting (not thinking) */}
            {isLoading && !isThinking && (
              <div className="animate-slide-up">
                <LoadingAnimation />
              </div>
            )}

            {/* Spacer for better UX */}
            <div className="h-4"></div>
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-6 right-6 w-12 h-12 bg-white border border-slate-200 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all duration-200 hover:scale-110 z-10 group"
          title="Cuộn xuống tin nhắn mới nhất"
        >
          <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  )
}