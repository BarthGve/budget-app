import { EntityLogo } from "../ui/EntityLogo";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal, PiggyBank, Share2, User } from "lucide-react";
import { useMemo } from "react";
import { useData } from "../../context/data-context-utils";
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
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { FrequencyBadge } from "../ui/FrequencyBadge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { TableCell, TableRow } from "../ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

import type { SavingsContribution } from "../../types/index";

interface SavingsContributionListItemProps {
  contribution: SavingsContribution;
  onEditClick: (contribution: SavingsContribution) => void;
  onDelete: (contributionId: string) => void;
  currentUserId: string | null;
}

export function SavingsContributionListItem({
  contribution,
  onEditClick,
  onDelete,
  currentUserId,
}: SavingsContributionListItemProps) {
  const data = useData();
  const beneficiaries = data?.beneficiaries ?? [];

  const displayAmount = useMemo(() => {
    return contribution.amount;
  }, [contribution.amount]);

  const beneficiary = beneficiaries.find(
    (b) => b.id === contribution.beneficiary_id
  );

  const isNew =
    Date.now() - new Date(contribution.created_at).getTime() < 86400000;

  const totalSavedForThisContribution = useMemo(() => {
    let total = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(contribution.start_date);
    startDate.setHours(0, 0, 0, 0);

    if (isNaN(startDate.getTime()) || startDate > today) {
      return 0;
    }

    const tempDate = new Date(startDate);

    while (tempDate <= today) {
      total += contribution.amount;

      if (contribution.frequency === "Mensuel") {
        tempDate.setMonth(tempDate.getMonth() + 1);
      } else if (contribution.frequency === "Trimestriel") {
        tempDate.setMonth(tempDate.getMonth() + 3);
      } else if (contribution.frequency === "Annuel") {
        tempDate.setFullYear(tempDate.getFullYear() + 1);
      } else {
        break;
      }
    }
    return total;
  }, [contribution]);

  return (
    <TableRow key={contribution.id}>
      <TableCell>
        <div className="flex items-center space-x-2">
          {contribution.is_shared && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Share2
                    className={`h-4 w-4 ${
                      contribution.user_id === currentUserId
                        ? "text-muted-foreground"
                        : "text-blue-500"
                    }`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {contribution.user_id === currentUserId
                      ? "Partagé par vous"
                      : `Partagé par ${
                          contribution.creator_profile?.first_name ||
                          "un collaborateur"
                        }`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <div className="flex items-center gap-2">
            <EntityLogo
              logoUrl={contribution.logo_url}
              altText={`${contribution.type} logo`}
              fallbackIcon={<PiggyBank className="w-5 h-5 text-gray-400" />}
            />
            <div className="flex flex-col">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <span className="cursor-pointer font-medium">
                    {contribution.account_types?.name || contribution.type}
                  </span>
                </HoverCardTrigger>
                <HoverCardContent>
                  <p>
                    Depuis le{" "}
                    {format(new Date(contribution.start_date), "PPP", {
                      locale: fr,
                    })}
                    , ce versement a contribué à votre épargne à hauteur de{" "}
                    {totalSavedForThisContribution.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                    .
                  </p>
                </HoverCardContent>
              </HoverCard>
              {/* Affichage de l'enseigne en gris clair */}
              {contribution.enseignes?.name && (
                <span className="text-xs text-muted-foreground">
                  {contribution.enseignes.name}
                </span>
              )}
            </div>
          </div>

          <AnimatePresence>
            {isNew && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <Badge variant="secondary" className="bg-pink-500 text-white">
                  Nouveau
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-center font-medium">
          {displayAmount.toLocaleString("fr-FR", {
            style: "currency",
            currency: "EUR",
          })}
        </div>
      </TableCell>
      <TableCell>
        <FrequencyBadge frequency={contribution.frequency} />
      </TableCell>
      <TableCell>
        {beneficiary ? (
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={beneficiary.avatar_url || "https://github.com/shadcn.png"}
                alt="Avatar"
              />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span>
              {beneficiary.first_name} {beneficiary.last_name}
            </span>
          </div>
        ) : (
          "N/A"
        )}
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
                onClick={() => onEditClick(contribution)}
                disabled={contribution.user_id !== currentUserId}
              >
                Modifier
              </DropdownMenuItem>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-red-500"
                  onSelect={(e) => e.preventDefault()} // Prevent closing dropdown
                  disabled={contribution.user_id !== currentUserId}
                >
                  Supprimer
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Êtes-vous sûr de vouloir supprimer ce versement ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible et supprimera définitivement ce
                versement de vos enregistrements.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(contribution.id)}>
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}
