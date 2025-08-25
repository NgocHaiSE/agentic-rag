import { useEffect, useRef } from 'react'
import type { Message } from '../types'
import MessageBubble from './MessageBubble'


interface Props {
  messages: Message[]
  isLoading?: boolean
}


export default function MessageList({ messages, isLoading }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)


  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages.length, isLoading])


  return (
    <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((m, i) => (
        <MessageBubble key={m.id ?? i} msg={m} />
      ))}


      {isLoading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <span className="h-2 w-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.2s]" />
          <span className="h-2 w-2 bg-gray-300 rounded-full animate-bounce" />
          <span className="h-2 w-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
          <span className="ml-2">Assistant is typing…</span>
        </div>
      )}
    </div>
  )
}