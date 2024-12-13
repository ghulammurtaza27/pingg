export default function Loading() {
  return (
    <div className="p-6 space-y-4">
      <div className="animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-[#2a3441] rounded"></div>
          <div className="h-6 w-24 bg-[#2a3441] rounded"></div>
        </div>

        {/* Agent info */}
        <div className="h-4 w-64 bg-[#2a3441] rounded mb-4"></div>

        {/* Content blocks */}
        <div className="space-y-6">
          <div>
            <div className="h-4 w-32 bg-[#2a3441] rounded mb-2"></div>
            <div className="h-20 bg-[#2a3441] rounded"></div>
          </div>
          
          <div>
            <div className="h-4 w-40 bg-[#2a3441] rounded mb-2"></div>
            <div className="h-32 bg-[#2a3441] rounded"></div>
          </div>

          {/* Analysis section */}
          <div>
            <div className="h-4 w-36 bg-[#2a3441] rounded mb-2"></div>
            <div className="h-48 bg-[#2a3441] rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
} 