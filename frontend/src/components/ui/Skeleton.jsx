const Skeleton = ({ className = '', rounded = 'rounded-lg' }) => (
  <div
    className={`relative overflow-hidden bg-panel/10 ${rounded} ${className}`}
    aria-hidden="true"
  >
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
  </div>
);

export const SkeletonCard = () => (
  <div className="overflow-hidden rounded-lg border border-stone/10 bg-mist-subtle shadow-smoke">
    <Skeleton className="aspect-[4/3] w-full" rounded="rounded-none" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-9 w-24" rounded="rounded-md" />
      </div>
    </div>
  </div>
);

export const SkeletonText = ({ lines = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
    ))}
  </div>
);

export default Skeleton;
