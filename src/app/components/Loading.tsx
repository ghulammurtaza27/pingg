export function Loading() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  )
} 