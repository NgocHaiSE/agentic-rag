import { useState } from 'react'


interface Props {
  onSend: (text: string) => Promise<void> | void
  disabled?: boolean
}


export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('')


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    setText('')
    await onSend(value)
  }


  return (
    <form onSubmit={handleSubmit} className="p-3 border-t bg-white">
      <div className="mx-auto max-w-2xl flex gap-2">
        <input
          className="flex-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message…"
          disabled={disabled}
          aria-label="Message input"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-xl px-4 py-2 bg-blue-600 text-white shadow-sm disabled:opacity-50 hover:bg-blue-500"
        >
          Send
        </button>
      </div>
    </form>
  )
}