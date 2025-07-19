import { MoreHorizontal, Share2 } from "lucide-react";
import type { Beneficiary, Profile, RecurringCharge } from "../../types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { CardContent, CardTitle } from "../ui/card";
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

// Function to get a consistent color for each category
const getCategoryColor = (categoryName: string) => {
  const blueShades = [
    "#4299E1", // blue-500
    "#63B3ED", // blue-400
    "#3182CE", // blue-600
    "#2B6CB0", // blue-700
    "#90CDF4", // blue-300
    "#C3DAFE", // blue-200
    "#1A365D", // blue-900
    "#2C5282", // blue-800
  ];
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % blueShades.length);
  return blueShades[index];
};

// Définir une interface pour les props qui inclut les relations
interface RecurringChargeCardProps {
  charge: RecurringCharge & {
    beneficiaries?: Beneficiary | null; // Peut être null ou undefined
    profiles?: Profile | null; // Pour le créateur/partageur
  };
  currentUserId: string;
  onEdit: (charge: RecurringCharge) => void;
  onDelete: (chargeId: string) => void;
}

// Function to get a consistent color for each frequency
const getFrequencyColor = (frequency: string) => {
  switch (frequency) {
    case "monthly":
      return "bg-blue-100 text-blue-800";
    case "quarterly":
      return "bg-green-100 text-green-800";
    case "annually":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Mapping pour les fréquences
const frequencyMap = {
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  annually: "Annuel",
};

export function RecurringChargeCard({
  charge,
  currentUserId,
  onEdit,
  onDelete,
}: RecurringChargeCardProps) {
  const isSharedByOther = charge.is_shared && charge.user_id !== currentUserId;

  return (
    <div className=" w-full">
      <div className="flex items-center justify-between gap-4 ">
        {/* Share Icon */}
        {charge.is_shared && (
          <div className="w-6 flex-shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Share2
                    className={`h-4 w-4 ${
                      isSharedByOther
                        ? "text-blue-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isSharedByOther
                      ? `Partagé par ${
                          charge.profiles?.first_name || "un collaborateur"
                        }`
                      : "Partagé par vous"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Logo, Title, Category, Frequency */}
        <div className="flex items-center gap-2 flex-grow">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={charge.external_logo_url || undefined}
              alt={charge.title}
            />
            <AvatarFallback>{charge.title?.[0]}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-sm font-semibold">
            {charge.title}
          </CardTitle>
          <Badge
            variant="outline"
            className={`ml-2 text-xs ${getCategoryColor(charge.category)}`}
          >
            {charge.category}
          </Badge>
          <Badge
            variant="outline"
            className={`ml-2 text-xs ${getFrequencyColor(charge.frequency)}`}
          >
            {frequencyMap[charge.frequency]}
          </Badge>
        </div>

        {/* Amount and Dropdown Menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {(charge.beneficiaries || charge.profiles) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-6 w-6 cursor-pointer">
                    <AvatarImage
                      src={
                        charge.beneficiaries?.avatar_url ||
                        charge.profiles?.avatar_url ||
                        undefined
                      }
                      alt={
                        charge.beneficiaries?.first_name ||
                        charge.profiles?.first_name ||
                        "Bénéficiaire"
                      }
                    />
                    <AvatarFallback>
                      {charge.beneficiaries?.first_name?.[0] ||
                        charge.profiles?.first_name?.[0] ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {charge.beneficiaries?.first_name ||
                      charge.profiles?.first_name ||
                      "Bénéficiaire"}
                    {charge.beneficiaries?.last_name &&
                      ` ${charge.beneficiaries.last_name}`}
                    {charge.profiles?.last_name &&
                      ` ${charge.profiles.last_name}`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <span className="text-xs font-medium">
            {charge.amount.toLocaleString("fr-FR", {
              style: "currency",
              currency: "EUR",
            })}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(charge)}>
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(charge.id)}
                className="text-red-500"
              >
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="text-sm text-muted-foreground space-y-2 pt-2">
        {/* No beneficiary info here anymore */}
      </CardContent>
    </div>
  );
}
