import { Repeat, Share2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
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
  User,
} from "../../types/index";

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

interface RecurringChargeDetailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  recurringCharges: RecurringCharge[];
  user: User | null;
  collaboratorProfiles: Profile[];
  beneficiaries: Beneficiary[];
  totalMonthlyIncome: number;
  yourPercentage: number;
}

export function RecurringChargeDetailModal({
  isOpen,
  onOpenChange,
  recurringCharges,
  user,
  collaboratorProfiles,
  beneficiaries,
  totalMonthlyIncome,
  yourPercentage,
}: RecurringChargeDetailModalProps) {
  const getBeneficiaryDisplay = (
    beneficiaryId: string | null | undefined,
    label?: string
  ) => {
    let displayAvatarUrl: string | undefined = undefined;
    let displayName: string = "Inconnu";
    let displayFallback: string = "?";

    if (!beneficiaryId || beneficiaryId === user?.id) {
      if (user) {
        displayAvatarUrl =
          typeof user.user_metadata?.avatar_url === "string"
            ? user.user_metadata.avatar_url
            : undefined;
        displayName =
          typeof user.user_metadata?.firstName === "string"
            ? user.user_metadata.firstName
            : "Moi";
        displayFallback =
          typeof user.user_metadata?.firstName === "string"
            ? user.user_metadata.firstName[0] || "M"
            : "M";
      }
    } else {
      const allPossibleBeneficiaries = [
        ...beneficiaries,
        ...collaboratorProfiles,
      ];
      const beneficiary = allPossibleBeneficiaries.find(
        (b: Beneficiary | Profile) => b.id === beneficiaryId
      );

      if (beneficiary) {
        displayAvatarUrl = beneficiary.avatar_url || undefined;
        const firstName =
          typeof beneficiary.first_name === "string"
            ? beneficiary.first_name
            : "";
        const lastName =
          typeof beneficiary.last_name === "string"
            ? beneficiary.last_name
            : "";
        displayName = `${firstName} ${lastName}`.trim();
        displayFallback = `${firstName[0] || ""}${lastName[0] || ""}` || "?";
      }
    }

    return (
      <div className="flex items-center gap-2">
        {label && <span className="text-muted-foreground">{label}:</span>}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-6 w-6">
                <AvatarImage src={displayAvatarUrl} alt={displayName} />
                <AvatarFallback>{displayFallback}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{displayName}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  const calculateMonthlyAmount = (charge: RecurringCharge): number => {
    let monthlyAmount = 0;
    switch (charge.frequency) {
      case "monthly":
        monthlyAmount = charge.amount;
        break;
      case "quarterly":
        monthlyAmount = charge.amount / 3;
        break;
      case "annually":
        monthlyAmount = charge.amount / 12;
        break;
      default:
        break;
    }
    return monthlyAmount;
  };

  const calculateUserShare = useCallback(
    (charge: RecurringCharge): number => {
      if (!user) return 0;

      // If the charge is shared (either by the user or a collaborator)
      if (charge.is_shared) {
        const monthlyAmount = calculateMonthlyAmount(charge);
        // If the user has no income, or no percentage of the total income, their share is 0
        if (totalMonthlyIncome === 0 || yourPercentage === 0) {
          return 0;
        }
        // Calculate the user's share based on their income percentage
        return (monthlyAmount * yourPercentage) / 100;
      }

      // If the charge is NOT shared, and it belongs to the current user, the user pays the full amount
      if (charge.user_id === user.id && !charge.is_shared) {
        return calculateMonthlyAmount(charge);
      }

      // If the charge is not shared and does not belong to the current user (e.g., a collaborator's private charge), user pays 0
      return 0;
    },
    [user, totalMonthlyIncome, yourPercentage]
  );

  const totalUserShare = useMemo(() => {
    return recurringCharges.reduce(
      (sum, charge) => sum + calculateUserShare(charge),
      0
    );
  }, [recurringCharges, calculateUserShare]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-orange-100">
              <Repeat className="h-5 w-5 text-orange-600" />
            </div>
            Détail des Charges Récurrentes
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Votre part mensuelle totale calculée :{" "}
            <span className="font-semibold">
              {totalUserShare.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
          </p>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4 min-h-[100px] overflow-y-auto">
          <div className="space-y-4">
            {recurringCharges.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Aucune charge récurrente à afficher.
              </p>
            ) : (
              recurringCharges.map((charge) => (
                <div key={charge.id} className="border rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {charge.external_logo_url && (
                        <img
                          src={charge.external_logo_url}
                          alt={`${charge.title} logo`}
                          className="h-6 w-6 object-contain"
                        />
                      )}
                      <h4 className="font-semibold">{charge.title}</h4>
                      {charge.is_shared && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Share2
                                className={`h-4 w-4 ${
                                  charge.user_id === user?.id
                                    ? "text-muted-foreground"
                                    : "text-blue-500"
                                }`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <span>
                                {charge.user_id === user?.id
                                  ? "Partagée par vous"
                                  : "Partagée par un collaborateur"}
                              </span>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <Badge
                        variant="secondary"
                        className={getFrequencyColor(charge.frequency)}
                      >
                        {charge.frequency === "monthly"
                          ? "Mensuel"
                          : charge.frequency === "quarterly"
                          ? "Trimestriel"
                          : "Annuel"}
                      </Badge>
                    </div>
                    <span className="font-bold">
                      {calculateMonthlyAmount(charge).toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}{" "}
                      / mois
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {charge.category && (
                      <Badge variant="secondary">{charge.category}</Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    {getBeneficiaryDisplay(
                      charge.beneficiary_id,
                      "Bénéficiaire"
                    )}
                    {getBeneficiaryDisplay(charge.user_id, "Propriétaire")}
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span>Votre part mensuelle calculée:</span>
                    <span>
                      {calculateUserShare(charge).toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
