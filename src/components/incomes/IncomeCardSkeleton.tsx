import { Skeleton } from "../ui/skeleton";

export function IncomeCardSkeleton() {
  return (
    <div className="w-full">
      <div className="flex items-center gap-4">
        {/* Share Icon Skeleton - Optional, as it might not always be present */}
        <div className="flex-shrink-0">
          <Skeleton className="h-4 w-4 rounded-md" />
        </div>

        {/* Main content line skeleton */}
        <div className="flex items-center gap-2 flex-grow justify-between">
          <Skeleton className="h-5 w-32 rounded-md" /> {/* Source */}
          <Skeleton className="h-5 w-24 rounded-md" /> {/* Amount */}
          <Skeleton className="h-5 w-20 rounded-md" /> {/* Frequency */}
          <Skeleton className="h-6 w-6 rounded-full" /> {/* Avatar */}
        </div>

        {/* Dropdown Menu (actions) Skeleton */}
        <div className="flex-shrink-0">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}
