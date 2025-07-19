import { MoreHorizontal, Share2 } from "lucide-react";
import type { Income, Profile } from "../../types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button";
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

// Function to get a consistent color for each frequency
const getFrequencyColor = (frequency: string) => {
  switch (frequency) {
    case "Mensuel":
      return "bg-blue-100 text-blue-800";
    case "Trimestriel":
      return "bg-green-100 text-green-800";
    case "Annuel":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Function to translate frequency to French
const translateFrequency = (frequency: string) => {
  switch (frequency) {
    case "monthly":
      return "Mensuel";
    case "quarterly":
      return "Trimestriel";
    case "annually":
      return "Annuel";
    default:
      return frequency;
  }
};

interface IncomeCardProps {
  income: Income & { profiles?: Profile }; // Ensure profiles is available
  onEditClick: (income: Income) => void;
  onDelete: (incomeId: string) => void;
  currentUserId: string | null;
}

export function IncomeCard({
  income,
  onEditClick,
  onDelete,
  currentUserId,
}: IncomeCardProps) {
  const isSharedIncome = income.contributor_user_id !== income.user_id; // Income is shared if contributor is different from owner

  return (
    <div className="w-full">
      <div className="flex items-center  gap-4 ">
        {/* Share Icon */}
        <div className="flex-shrink-0">
          {isSharedIncome && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Share2
                    className={`h-4 w-4 ${
                      income.contributor_user_id === currentUserId
                        ? "text-muted-foreground"
                        : "text-blue-500"
                    }`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {income.contributor_user_id === currentUserId
                      ? "Partagé par vous"
                      : `Partagé par ${
                          income.profiles?.first_name || "un collaborateur"
                        }`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Main content line: Source, Amount, Frequency, Contributor Avatar */}
        <div className="flex items-center gap-2 flex-grow justify-between">
          <div className="text-sm font-semibold">{income.source_name}</div>
          <span className="text-xs font-medium">
            {income.amount.toLocaleString("fr-FR", {
              style: "currency",
              currency: "EUR",
            })}
          </span>
          <Badge
            variant="outline"
            className={`ml-2 text-xs ${getFrequencyColor(
              translateFrequency(income.frequency)
            )}`}
          >
            {translateFrequency(income.frequency)}
          </Badge>
          {income.profiles && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-6 w-6 cursor-pointer">
                    <AvatarImage
                      src={income.profiles.avatar_url || undefined}
                      alt={income.profiles.first_name}
                    />
                    <AvatarFallback>
                      {income.profiles.first_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {income.profiles.first_name} {income.profiles.last_name}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Dropdown Menu (actions) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onEditClick(income)}
                disabled={income.user_id !== currentUserId}
              >
                Modifier
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-red-500"
                    disabled={income.user_id !== currentUserId}
                  >
                    Supprimer
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Êtes-vous sûr de vouloir supprimer ce revenu ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible et supprimera définitivement
                      ce revenu de vos enregistrements.
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
