interface Props {
  message?: string
}


export default function ErrorBanner({ message = 'Something went wrong.' }: Props) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="mt-2 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
        {message}
      </div>
    </div>
  )
}