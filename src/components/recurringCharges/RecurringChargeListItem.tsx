import { EntityLogo } from "../ui/EntityLogo";
import { MoreHorizontal, Share2 } from "lucide-react";
import { useMemo } from "react";
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

import type {
  Beneficiary,
  Profile,
  RecurringCharge,
  User as UserType,
} from "../../types/index";

interface EnrichedRecurringCharge extends RecurringCharge {
  beneficiaries?: Beneficiary;
  profiles?: Profile;
  categoryColor?: string;
}

interface DisplayEntity {
  id: string;
  first_name: string;
  last_name?: string | null;
  email?: string; // Only for Profile
  avatar_url?: string | null;
}

const getEntityDisplayInfo = (
  entity: DisplayEntity | undefined | null,
  currentUser?: UserType | null
) => {
  if (!entity) {
    return {
      avatarUrl: undefined,
      displayName: "N/A",
      fallback: "?",
      fullName: "N/A",
      email: undefined,
    };
  }

  let avatarUrl = entity.avatar_url || undefined;
  let firstName = entity.first_name;
  let lastName =
    "last_name" in entity && entity.last_name !== null ? entity.last_name : "";
  let email =
    "email" in entity && entity.email !== null ? entity.email : undefined;

  // Special handling for current user if entity is the current user's profile
  if (currentUser && entity.id === currentUser.id) {
    avatarUrl = (currentUser.user_metadata?.avatar_url as string) || undefined;
    firstName = (currentUser.user_metadata?.firstName as string) || "Moi";
    lastName = (currentUser.user_metadata?.lastName as string) || "";
    email = currentUser.email || undefined;
  }

  const displayName = `${firstName} ${lastName}`.trim() || email || "Inconnu";
  const fallback = `${firstName[0]}${
    lastName ? lastName[0] : ""
  }`.toUpperCase();
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    avatarUrl,
    displayName,
    fallback,
    fullName,
    email,
  };
};

interface RecurringChargeListItemProps {
  charge: EnrichedRecurringCharge;
  onEdit: (charge: RecurringCharge) => void;
  onDelete: (chargeId: string) => void;
  currentUserId: string | null;
}

export function RecurringChargeListItem({
  charge,
  onEdit,
  onDelete,
  currentUserId,
}: RecurringChargeListItemProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const beneficiaryDisplayInfo = useMemo(() => {
    if (charge.beneficiaries) {
      return getEntityDisplayInfo(charge.beneficiaries, null); // Pass null for currentUser as it's a beneficiary
    } else if (charge.profiles) {
      return getEntityDisplayInfo(charge.profiles, null); // Pass null for currentUser as it's a profile
    }
    return null;
  }, [charge.beneficiaries, charge.profiles]);

  return (
    <TableRow key={charge.id}>
      <TableCell className="font-medium flex items-center gap-2">
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex items-center gap-2">
              {charge.is_shared && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Share2
                        className={`h-4 w-4 ${
                          charge.user_id === currentUserId
                            ? "text-muted-foreground"
                            : "text-blue-500"
                        }`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {charge.user_id === currentUserId
                          ? "Partagé par vous"
                          : `Partagé par ${
                              charge.profiles?.first_name || "un collaborateur"
                            }`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <EntityLogo
                logoUrl={charge.external_logo_url || charge.icon_path}
                altText={`${charge.title} logo`}
                fallbackIcon={<Share2 className="w-5 h-5 text-gray-400" />}
              />
              {charge.title}
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="bg-white p-4 rounded-md shadow-lg text-sm text-gray-800">
            <p className="font-semibold text-base mb-2 flex items-center gap-2">
              <EntityLogo
                logoUrl={charge.external_logo_url || charge.icon_path}
                altText={`${charge.title} logo`}
                fallbackIcon={<Share2 className="w-5 h-5 text-gray-400" />}
              />
              {charge.title}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <p>Montant:</p>
              <p className="font-medium text-right">
                {formatCurrency(charge.amount)}
              </p>
              <p>Fréquence:</p>
              <p className="font-medium text-right">
                <FrequencyBadge frequency={charge.frequency} />
              </p>
              <p>Catégorie:</p>
              <p className="font-medium text-right">{charge.category}</p>
              {charge.description && (
                <>
                  <p>Description:</p>
                  <p className="col-span-2 text-right">{charge.description}</p>
                </>
              )}
              {beneficiaryDisplayInfo && ( // Use the new info
                <>
                  <p>Bénéficiaire:</p>
                  <p className="col-span-2 text-right flex items-center justify-end gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={beneficiaryDisplayInfo.avatarUrl}
                        alt={beneficiaryDisplayInfo.displayName}
                      />
                      <AvatarFallback>
                        {beneficiaryDisplayInfo.fallback}
                      </AvatarFallback>
                    </Avatar>
                    <span>{beneficiaryDisplayInfo.fullName}</span>
                  </p>
                </>
              )}
            </div>
          </HoverCardContent>
        </HoverCard>
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(charge.amount)}
      </TableCell>
      <TableCell>
        <Badge style={{ backgroundColor: charge.categoryColor }}>
          {charge.category}
        </Badge>
      </TableCell>
      <TableCell>
        <FrequencyBadge frequency={charge.frequency} />
      </TableCell>
      <TableCell>
        {beneficiaryDisplayInfo ? ( // Use the new info
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={beneficiaryDisplayInfo.avatarUrl}
                    alt={beneficiaryDisplayInfo.displayName}
                  />
                  <AvatarFallback>
                    {beneficiaryDisplayInfo.fallback}
                  </AvatarFallback>
                </Avatar>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="bg-white p-2 rounded-md shadow-lg text-sm flex items-center gap-2">
              <p>Bénéficiaire: </p>
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={beneficiaryDisplayInfo.avatarUrl}
                  alt={beneficiaryDisplayInfo.displayName}
                />
                <AvatarFallback>
                  {beneficiaryDisplayInfo.fallback}
                </AvatarFallback>
              </Avatar>
              <p className="font-semibold">{beneficiaryDisplayInfo.fullName}</p>
            </HoverCardContent>
          </HoverCard>
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
                onClick={() => onEdit(charge)}
                disabled={charge.user_id !== currentUserId}
              >
                Modifier
              </DropdownMenuItem>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-red-500"
                  disabled={charge.user_id !== currentUserId}
                >
                  Supprimer
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Êtes-vous sûr de vouloir supprimer cette charge ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible et supprimera définitivement cette
                charge de vos enregistrements.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(charge.id)}>
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}
