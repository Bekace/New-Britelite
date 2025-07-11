import { DashboardLayout } from "@/components/dashboard-layout"

export default function MediaLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex gap-4 items-center">
            <div className="h-10 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="ml-auto flex gap-2">
              <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border overflow-hidden">
              <div className="aspect-square bg-gray-200 animate-pulse"></div>
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex justify-between">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
