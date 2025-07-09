export default function MediaLibraryLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Upload Area Skeleton */}
      <div className="border rounded-lg p-6">
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
          <div className="h-12 w-12 bg-gray-200 rounded mx-auto mb-4 animate-pulse" />
          <div className="h-6 w-48 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 rounded mx-auto mb-4 animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded mx-auto animate-pulse" />
        </div>
      </div>

      {/* Toolbar Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-2">
            <div className="aspect-square bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded mb-1 animate-pulse" />
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
