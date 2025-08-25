import { useState } from 'react'
import ChatHeader from './components/ChatHeader'
import MessageList from './components/MessageList'
import ChatInput from './components/ChatInput'
import ErrorBanner from './components/ErrorBanner'
import type { Message } from './types'
import { sendChat } from './lib/api'


export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)


  async function handleSend(text: string) {
    setError(null)
    const userMsg: Message = {
      role: 'user',
      content: text,
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      createdAt: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])


    try {
      setIsLoading(true)
      const res = await sendChat(text, sessionId)
      setSessionId(res.session_id)
      const botMsg: Message = {
        role: 'assistant',
        content: res.message,
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        createdAt: Date.now(),
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (e) {
      setError('Error fetching response')
      const botMsg: Message = {
        role: 'assistant',
        content: 'Error fetching response',
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        createdAt: Date.now(),
      }
      setMessages((prev) => [...prev, botMsg])
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <ChatHeader title="Chatbot" subtitle="Tailwind + Components" />


      {error && <ErrorBanner message={error} />}


      <main className="mx-auto max-w-2xl h-[calc(100vh-140px)] flex flex-col">
        <MessageList messages={messages} isLoading={isLoading} />
      </main>


      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  )
}