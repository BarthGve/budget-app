import { CreditCard, Share2 } from "lucide-react";
import { useMemo } from "react";
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

import type { Credit, Profile, User } from "../../types/index";

interface CreditSummaryDetailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  credits: Credit[];
  user: User | null;
  collaboratorProfiles: Profile[];
  totalMonthlyIncome: number;
  yourPercentage: number;
}

export function CreditSummaryDetailModal({
  isOpen,
  onOpenChange,
  credits,
  user,
  collaboratorProfiles,
  totalMonthlyIncome,
  yourPercentage,
}: CreditSummaryDetailModalProps) {
  const getCreditOwnerDisplay = (creditOwnerId: string, label?: string) => {
    let displayAvatarUrl: string | undefined = undefined;
    let displayName: string = "Inconnu";
    let displayFallback: string = "?";

    if (creditOwnerId === user?.id) {
      if (user) {
        displayAvatarUrl =
          typeof user.user_metadata?.avatar_url === "string"
            ? user.user_metadata.avatar_url
            : undefined;
        displayName = (user.user_metadata?.firstName as string) || "Moi";
        displayFallback = (user.user_metadata?.firstName as string)?.[0] || "M";
      }
    } else {
      const ownerProfile = collaboratorProfiles.find(
        (profile: Profile) => profile.id === creditOwnerId
      );

      if (ownerProfile) {
        displayAvatarUrl = ownerProfile.avatar_url || undefined;
        displayName = `${ownerProfile.first_name} ${
          ownerProfile.last_name || ""
        }`;
        displayFallback = `${ownerProfile.first_name?.[0]}${ownerProfile.last_name?.[0]}`;
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

  const totalUserShare = useMemo(() => {
    const calculateUserShare = (credit: Credit): number => {
      if (!user) return 0;

      // If the credit is shared (either by the user or a collaborator)
      if (credit.is_shared) {
        const monthlyPayment = credit.monthly_payment;
        // If the user has no income, or no percentage of the total income, their share is 0
        if (totalMonthlyIncome === 0 || yourPercentage === 0) {
          return 0;
        }
        // Calculate the user's share based on their income percentage
        return (monthlyPayment * yourPercentage) / 100;
      }

      // If the credit is NOT shared, and it belongs to the current user, the user pays the full amount
      if (credit.user_id === user.id && !credit.is_shared) {
        return credit.monthly_payment;
      }

      // If the credit is not shared and does not belong to the current user (e.g., a collaborator's private credit), user pays 0
      return 0;
    };

    return credits
      .filter((c) => !c.is_settled_early)
      .reduce((sum, credit) => sum + calculateUserShare(credit), 0);
  }, [credits, user, totalMonthlyIncome, yourPercentage]);

  const calculateUserShare = (credit: Credit): number => {
    if (!user) return 0;

    // If the credit is shared (either by the user or a collaborator)
    if (credit.is_shared) {
      const monthlyPayment = credit.monthly_payment;
      // If the user has no income, or no percentage of the total income, their share is 0
      if (totalMonthlyIncome === 0 || yourPercentage === 0) {
        return 0;
      }
      // Calculate the user's share based on their income percentage
      return (monthlyPayment * yourPercentage) / 100;
    }

    // If the credit is NOT shared, and it belongs to the current user, the user pays the full amount
    if (credit.user_id === user.id && !credit.is_shared) {
      return credit.monthly_payment;
    }

    // If the credit is not shared and does not belong to the current user (e.g., a collaborator's private credit), user pays 0
    return 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-100">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            Détail des Crédits Mensuels
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Votre part mensuelle totale estimée :{" "}
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
            {credits.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Aucun crédit à afficher.
              </p>
            ) : (
              credits
                .filter((c) => !c.is_settled_early)
                .map((credit) => (
                  <div key={credit.id} className="border rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {(credit.enseignes?.external_logo_url || credit.enseignes?.icon_path) && (
                          <img
                            src={credit.enseignes?.external_logo_url || credit.enseignes?.icon_path || ''}
                            alt={`${credit.loan_name} logo`}
                            className="h-6 w-6 object-contain"
                          />
                        )}
                        <h4 className="font-semibold">{credit.loan_name}</h4>
                        {credit.is_shared && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Share2
                                  className={`h-4 w-4 ${
                                    credit.user_id === user?.id
                                      ? "text-muted-foreground"
                                      : "text-blue-500"
                                  }`}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {credit.user_id === user?.id
                                    ? "Partagé par vous"
                                    : "Partagé par un collaborateur"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <span className="font-bold">
                        {credit.monthly_payment.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}{" "}
                        / mois
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Montant total:{" "}
                      {credit.total_amount.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}{" "}
                      | Taux: {(credit.interest_rate * 100).toFixed(2)}%
                    </p>
                    <div className="flex justify-end items-center text-sm">
                      {getCreditOwnerDisplay(credit.user_id, "Propriétaire")}
                      {credit.is_settled_early && (
                        <Badge variant="secondary">Soldé</Badge>
                      )}
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span>Votre part mensuelle estimée:</span>
                      <span>
                        {calculateUserShare(credit).toLocaleString("fr-FR", {
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
