import { Skeleton } from "../ui/skeleton";
import { TableCell, TableRow } from "../ui/table";

export function SavingsContributionListItemSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-3 w-20 rounded-md" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-3 w-16 rounded-md" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20 rounded-md" />
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-6 w-6 rounded-md" />
      </TableCell>
    </TableRow>
  );
}