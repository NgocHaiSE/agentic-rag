import { memo } from 'react'
import type { Message } from '../types'


interface Props {
  msg: Message
}


function MessageBubble({ msg }: Props) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ring-1 transition-all duration-200 ` +
          (isUser
            ? 'bg-blue-600 text-white ring-blue-600/20 rounded-br-sm'
            : 'bg-gray-100 text-gray-900 ring-gray-200 rounded-bl-sm')}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
      </div>
    </div>
  )
}


export default memo(MessageBubble)