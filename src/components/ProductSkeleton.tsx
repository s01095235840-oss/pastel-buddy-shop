export const ProductSkeleton = ({ index }: { index: number }) => {
  return (
    <div
      className="group block animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="bg-card rounded-3xl overflow-hidden shadow-card dark:bg-sidebar dark:shadow-none">
        {/* Image skeleton */}
        <div className="relative aspect-square overflow-hidden bg-muted animate-pulse" />

        {/* Content skeleton */}
        <div className="p-4">
          {/* Tags skeleton */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
            <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
          </div>

          {/* Name skeleton */}
          <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-2" />

          {/* Price skeleton */}
          <div className="h-6 w-24 bg-muted rounded animate-pulse mt-2" />
        </div>
      </div>
    </div>
  );
};

