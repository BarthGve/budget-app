import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MoreHorizontal, Share2, User } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { FrequencyBadge } from "../ui/FrequencyBadge";
import { TableCell, TableRow } from "../ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

import type { Income } from "../../types/index";

interface IncomeListItemProps {
  income: Income;
  onEditClick: (income: Income) => void;
  onDelete: (incomeId: string) => void;
  currentUserId: string | null;
}

export function IncomeListItem({
  income,
  onEditClick,
  onDelete,
  currentUserId,
}: IncomeListItemProps) {
  console.log("IncomeListItem received income:", income);
  return (
    <TableRow key={income.id}>
      <TableCell>
        <div className="flex items-center gap-2">
          {income.is_shared && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Share2
                    className={`h-4 w-4 ${
                      income.user_id === currentUserId
                        ? "text-muted-foreground"
                        : "text-blue-500"
                    }`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {income.user_id === currentUserId
                      ? "Partagé par vous"
                      : `Partagé par ${income.profiles?.first_name || "un collaborateur"}`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {income.source_name}
        </div>
      </TableCell>
      <TableCell>
        {income.amount.toLocaleString("fr-FR", {
          style: "currency",
          currency: "EUR",
        })}
      </TableCell>
      <TableCell>
        <FrequencyBadge frequency={income.frequency} />
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage
              src={
                income.profiles?.avatar_url || "https://github.com/shadcn.png"
              }
              alt="Avatar"
            />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <span>
            {income.profiles
              ? income.profiles.first_name && income.profiles.last_name
                ? `${income.profiles.first_name} ${income.profiles.last_name}`
                : income.profiles.email
              : "N/A"}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Ouvrir le menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onEditClick(income)}
                disabled={income.user_id !== currentUserId} // Disable if not owner
              >
                Modifier
              </DropdownMenuItem>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-red-500"
                  disabled={income.user_id !== currentUserId} // Disable if not owner
                >
                  Supprimer
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Êtes-vous sûr de vouloir supprimer ce revenu ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible et supprimera définitivement ce
                revenu de vos enregistrements.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(income.id)}>
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}
