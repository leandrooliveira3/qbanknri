import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  type?: 'question' | 'card' | 'list';
  count?: number;
}

export const LoadingSkeleton = ({ type = 'question', count = 3 }: LoadingSkeletonProps) => {
  const items = Array.from({ length: count }, (_, index) => index);

  if (type === 'question') {
    return (
      <div className="space-y-6">
        {items.map((index) => (
          <div key={index} className="professional-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32 skeleton-shimmer" />
              <Skeleton className="h-8 w-8 rounded-full skeleton-shimmer" />
            </div>
            
            <Skeleton className="h-4 w-full skeleton-shimmer" />
            <Skeleton className="h-4 w-4/5 skeleton-shimmer" />
            <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
            
            <div className="space-y-3 pt-4">
              {Array.from({ length: 5 }).map((_, altIndex) => (
                <div key={altIndex} className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-4 rounded skeleton-shimmer" />
                  <Skeleton className="h-4 flex-1 skeleton-shimmer" />
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Skeleton className="h-9 w-24 skeleton-shimmer" />
              <Skeleton className="h-9 w-24 skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((index) => (
          <div key={index} className="professional-card p-4 space-y-3">
            <Skeleton className="h-6 w-3/4 skeleton-shimmer" />
            <Skeleton className="h-4 w-full skeleton-shimmer" />
            <Skeleton className="h-4 w-2/3 skeleton-shimmer" />
            <div className="flex justify-between pt-2">
              <Skeleton className="h-8 w-16 skeleton-shimmer" />
              <Skeleton className="h-8 w-16 skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-3">
        {items.map((index) => (
          <div key={index} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
            <Skeleton className="h-12 w-12 rounded-full skeleton-shimmer" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3 skeleton-shimmer" />
              <Skeleton className="h-3 w-full skeleton-shimmer" />
            </div>
            <Skeleton className="h-8 w-20 skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  return null;
};