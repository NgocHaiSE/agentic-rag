import { useState, useCallback, useRef, useEffect } from 'react'
import ChatHeader from './components/ChatHeader'
import MessageList from './components/MessageList'
import ChatInput from './components/ChatInput'
import ErrorBanner from './components/ErrorBanner'
import { ThinkingIndicator } from './components/ResponseParser'
import type { Message, ToolCall } from './types'
import { sendChatStream, sendChat } from './lib/api'
import { Sidebar } from '@/components/layout/Sidebar'

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const [currentTools, setCurrentTools] = useState<ToolCall[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingContent, setThinkingContent] = useState<string>('')

  // Ref để track tin nhắn đang streaming
  const streamingMessageId = useRef<string | undefined>(undefined)
  const abortControllerRef = useRef<AbortController | undefined>(undefined)

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Parser để xử lý thinking content
  const parseThinkingContent = (content: string) => {
    const thinkingRegex = /<think>([\s\S]*?)<\/think>/gi
    const matches = [...content.matchAll(thinkingRegex)]

    if (matches.length === 0) {
      return { thinking: '', response: content, hasThinking: false }
    }

    const lastMatch = matches[matches.length - 1]
    const thinking = lastMatch[1].trim()
    const thinkingEndIndex = lastMatch.index! + lastMatch[0].length
    const response = content.substring(thinkingEndIndex).trim()

    return { thinking, response, hasThinking: true }
  }

  // Hàm xử lý streaming realtime với thinking parser
  const handleSendStream = useCallback(async (text: string) => {
    setError(null)
    setIsLoading(true)
    setStreamingMessage('')
    setCurrentTools([])
    setIsThinking(false)
    setThinkingContent('')

    // Tạo message của user
    const userMsg: Message = {
      role: 'user',
      content: text,
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      createdAt: Date.now(),
    }

    // Thêm user message
    setMessages(prev => [...prev, userMsg])

    // Tạo message placeholder cho assistant
    const assistantMessageId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
    streamingMessageId.current = assistantMessageId

    try {
      let fullStreamContent = ''
      let assistantMessageAdded = false

      // Gửi streaming request
      await sendChatStream(text, sessionId, {
        onSessionId: (newSessionId: string) => {
          setSessionId(newSessionId)
        },

        onToken: (content: string) => {
          fullStreamContent += content

          // Parse thinking content
          const { thinking, response, hasThinking } = parseThinkingContent(fullStreamContent)

          if (hasThinking && thinking && !response) {
            // Đang trong thinking phase
            setIsThinking(true)
            setThinkingContent(thinking)
            // Không tạo assistant message bubble yet
          } else {
            // Đã có response content hoặc không có thinking
            setIsThinking(false)

            // Tạo assistant message nếu chưa có
            if (!assistantMessageAdded) {
              const assistantMsg: Message = {
                role: 'assistant',
                content: response || fullStreamContent,
                id: assistantMessageId,
                createdAt: Date.now(),
                toolsUsed: []
              }
              setMessages(prev => [...prev, assistantMsg])
              assistantMessageAdded = true
            } else {
              // Cập nhật content của assistant message
              setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, content: response || fullStreamContent }
                  : msg
              ))
            }
          }
        },

        onToolsUsed: (tools: ToolCall[]) => {
          setCurrentTools(tools)

          // Cập nhật tools trong message nếu đã có
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, toolsUsed: tools }
              : msg
          ))
        },

        onComplete: (fullResponse: string) => {
          // Parse final response
          const { response } = parseThinkingContent(fullResponse || fullStreamContent)

          // Kết thúc streaming
          setIsLoading(false)
          setStreamingMessage('')
          setIsThinking(false)
          setThinkingContent('')

          // Cập nhật message cuối cùng
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessageId
              ? {
                ...msg,
                content: response || fullResponse || fullStreamContent,
                toolsUsed: currentTools
              }
              : msg
          ))
        },

        onError: (errorMessage: string) => {
          setError(errorMessage)
          setIsLoading(false)
          setStreamingMessage('')
          setIsThinking(false)
          setThinkingContent('')

          // Tạo error message
          const errorMsg: Message = {
            role: 'assistant',
            content: `Xin lỗi, đã có lỗi xảy ra: ${errorMessage}`,
            id: assistantMessageId,
            createdAt: Date.now(),
            toolsUsed: []
          }

          if (!assistantMessageAdded) {
            setMessages(prev => [...prev, errorMsg])
          } else {
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId ? errorMsg : msg
            ))
          }
        }
      })

    } catch (err) {
      const errorMessage = 'Không thể kết nối đến server. Vui lòng thử lại.'
      setError(errorMessage)
      setIsLoading(false)
      setStreamingMessage('')
      setIsThinking(false)
      setThinkingContent('')

      // Tạo error message
      const errorMsg: Message = {
        role: 'assistant',
        content: errorMessage,
        id: assistantMessageId,
        createdAt: Date.now(),
        toolsUsed: []
      }
      setMessages(prev => [...prev, errorMsg])
    }
  }, [sessionId, currentTools])

  // Xóa lỗi
  const handleClearError = useCallback(() => {
    setError(null)
  }, [])

  // Xóa cuộc trò chuyện
  const handleClearChat = useCallback(() => {
    setMessages([])
    setSessionId(null)
    setError(null)
    setStreamingMessage('')
    setCurrentTools([])
    setIsThinking(false)
    setThinkingContent('')
  }, [])

  // Stop streaming
  const handleStopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsLoading(false)
    setStreamingMessage('')
    setIsThinking(false)
    setThinkingContent('')
  }, [])

  return (
    <div className="flex min-h-screen">
      {/* <Sidebar /> */}
      <div className="flex-1 bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="flex flex-col h-screen">
          <ChatHeader
            title="Chatbot Micco"
            // subtitle="Realtime Chat với Thinking Process ẩn"
            onClearChat={handleClearChat}
            isStreaming={isLoading}
            onStopStreaming={handleStopStreaming}
          />
          {error && (
            <ErrorBanner
              message={error}
              onClose={handleClearError}
            />
          )}

          <main className="flex-1 overflow-hidden">
            <div className="h-full max-w-6xl mx-auto flex flex-col">
              <MessageList
                messages={messages}
                isLoading={isLoading && !isThinking}
                isThinking={isThinking}
                thinkingContent={thinkingContent}
                currentTools={currentTools}
              />
            </div>
          </main>

          <ChatInput
            onSend={handleSendStream}
            disabled={isLoading}
            isStreaming={isLoading}
            onStop={handleStopStreaming}
          />
        </div>
      </div>
    </div>
  )
}