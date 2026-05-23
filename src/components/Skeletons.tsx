export function PageSkeleton() {
  return (
    <div className="animate-pulse flex flex-col items-center justify-center min-h-[50vh] w-full max-w-4xl mx-auto p-8 space-y-6">
      {/* Header Skeleton */}
      <div className="h-10 bg-gray-200 rounded-xl w-3/4 mb-4 dark:bg-gray-700"></div>
      
      {/* Content Skeleton */}
      <div className="w-full space-y-4">
        <div className="h-4 bg-gray-200 rounded w-full dark:bg-gray-700"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 dark:bg-gray-700"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6 dark:bg-gray-700"></div>
        <div className="h-4 bg-gray-200 rounded w-full dark:bg-gray-700"></div>
      </div>

      {/* Cards/Blocks Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-8">
        <div className="h-32 bg-gray-200 rounded-2xl dark:bg-gray-700"></div>
        <div className="h-32 bg-gray-200 rounded-2xl dark:bg-gray-700"></div>
      </div>
    </div>
  )
}

export function EventCardSkeleton() {
  return (
    <div className="animate-pulse bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
      <div className="p-5 space-y-4">
        <div className="h-5 bg-gray-200 rounded w-3/4 dark:bg-gray-700"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 dark:bg-gray-700"></div>
        <div className="pt-4 flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-1/3 dark:bg-gray-700"></div>
          <div className="h-8 bg-gray-200 rounded-lg w-1/4 dark:bg-gray-700"></div>
        </div>
      </div>
    </div>
  )
}
