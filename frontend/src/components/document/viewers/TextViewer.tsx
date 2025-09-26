import type { FC } from 'react'

interface TextViewerProps {
  content: string
  title?: string | null
}

const TextViewer: FC<TextViewerProps> = ({ content }) => (
  <pre className="whitespace-pre-wrap text-sm text-blue-800 font-mono bg-white p-4 rounded-lg border border-blue-200 overflow-x-auto">
    {content}
  </pre>
)

export default TextViewer
