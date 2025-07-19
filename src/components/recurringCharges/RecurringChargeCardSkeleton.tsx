import { Skeleton } from "../ui/skeleton";
import { TableCell, TableRow } from "../ui/table";

export function RecurringChargeCardSkeleton() {
  return (
    <TableRow>
      <TableCell className="font-medium flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-24 rounded-md" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20 rounded-md" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-24 rounded-md" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20 rounded-md" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-6 rounded-full" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-8 rounded-md" />
      </TableCell>
    </TableRow>
  );
}
