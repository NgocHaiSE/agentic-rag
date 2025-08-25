import { memo } from 'react'


interface Props {
  title?: string
  subtitle?: string
}


function ChatHeader({ title = 'Chatbot', subtitle = 'Powered by your API' }: Props) {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          Online
        </div>
      </div>
    </header>
  )
}


export default memo(ChatHeader)