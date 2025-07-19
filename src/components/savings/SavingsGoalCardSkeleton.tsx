import { Skeleton } from "../ui/skeleton";
import { Card, CardContent, CardFooter } from "../ui/card";

export function SavingsGoalCardSkeleton() {
  return (
    <Card className="w-full mb-8">
      <CardContent className="px-3 py-2 flex items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>

        {/* Slider */}
        <div className="flex-grow max-w-xs">
          <Skeleton className="h-2 w-full rounded-md" />
        </div>

        {/* Percentage and Calculated Amount */}
        <div className="flex-shrink-0 text-right space-y-1">
          <Skeleton className="h-4 w-12 rounded-md" />
          <Skeleton className="h-3 w-20 rounded-md" />
        </div>
      </CardContent>
      <CardFooter className="py-1 px-3">
        <Skeleton className="h-3 w-48 rounded-md" />
      </CardFooter>
    </Card>
  );
}