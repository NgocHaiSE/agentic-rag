interface Props {
    message?: string
    onClose?: () => void
  }
  
  export default function ErrorBanner({ 
    message = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
    onClose 
  }: Props) {
    return (
      <div className="sticky top-0 z-10 animate-slide-down">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Lỗi kết nối
                  </h3>
                  <p className="text-sm text-red-700">
                    {message}
                  </p>
                </div>
              </div>
              
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-red-400 hover:text-red-600 hover:bg-red-100 p-1 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }