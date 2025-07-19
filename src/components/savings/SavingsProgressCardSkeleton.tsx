import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "../ui/card";

export function SavingsProgressCardSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="px-3 py-2 flex items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>

        {/* Progress Bar and Text */}
        <div className="flex-grow flex items-center gap-2">
          <Skeleton className="h-2 w-32 rounded-md" />
          <div className="flex-shrink-0 text-right space-y-1">
            <Skeleton className="h-4 w-12 rounded-md" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}