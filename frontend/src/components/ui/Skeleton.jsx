const Skeleton = ({ className = '', rounded = 'rounded-xl' }) => (
    <div
        className={`relative overflow-hidden bg-gray-200/70 ${rounded} ${className}`}
        aria-hidden="true"
    >
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
);

export const SkeletonCard = () => (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4">
        <Skeleton className="h-44 w-full" rounded="rounded-xl" />
        <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="mt-4 flex items-center justify-between">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-9 w-24" rounded="rounded-lg" />
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
