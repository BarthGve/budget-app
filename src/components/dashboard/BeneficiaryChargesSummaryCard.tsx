import { User } from "lucide-react";
import React, { useMemo } from "react";
import { useData } from "../../context/data-context-utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { DashboardSummaryCard } from "./DashboardSummaryCard";

export function BeneficiaryChargesSummaryCard() {
  const data = useData();
  const user = data?.user ?? null;

  const aggregatedCharges = useMemo(() => {
    const beneficiaries = data?.beneficiaries ?? [];
    const recurringCharges = data?.recurringCharges ?? [];
    const aggregation: { [key: string]: number } = {};

    recurringCharges.forEach((charge) => {
      const chargeBeneficiaryId =
        charge.beneficiary_id || (user ? user.id : null);
      if (!chargeBeneficiaryId) return; // Skip if no beneficiary and no user

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
      aggregation[chargeBeneficiaryId] =
        (aggregation[chargeBeneficiaryId] || 0) + monthlyAmount;
    });

    const result = Object.keys(aggregation).map((beneficiaryId) => {
      const totalAmount = aggregation[beneficiaryId];
      if (user && beneficiaryId === user.id) {
        return {
          id: user.id,
          name: String(user.user_metadata?.firstName || "Moi"),
          avatar_url: user.user_metadata?.avatar_url,
          totalAmount,
        };
      } else {
        const beneficiary = beneficiaries.find((b) => b.id === beneficiaryId);
        return {
          id: beneficiaryId,
          name: beneficiary
            ? String(`${beneficiary.first_name} ${beneficiary.last_name || ""}`)
            : "Inconnu",
          avatar_url: beneficiary?.avatar_url,
          totalAmount,
        };
      }
    });

    // Sort by total amount descending
    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [data?.recurringCharges, data?.beneficiaries, user]);

  return (
    <DashboardSummaryCard
      title="Charges par Bénéficiaire (Mensuel)"
      value=""
      description=""
      icon={<User className="h-4 w-4" />}
      iconBgColor="bg-purple-100"
      iconColor="text-purple-600"
    >
      {aggregatedCharges.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune charge récurrente assignée.
        </p>
      ) : (
        <div className="space-y-3">
          {aggregatedCharges.map((item, index) => (
            <React.Fragment key={item.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {item.id !== "unassigned" && (
                    <Avatar className="h-6 w-6" withShadow={true}>
                      <AvatarImage
                        src={
                          typeof item.avatar_url === "string"
                            ? item.avatar_url
                            : undefined
                        }
                      />
                      <AvatarFallback>
                        {item.name &&
                        typeof item.name === "string" &&
                        item.name.length > 0
                          ? item.name[0].toUpperCase()
                          : "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className="text-sm font-medium">
                    {item.name || "Inconnu"}
                  </span>
                </div>
                <span className="text-sm font-bold">
                  {item.totalAmount.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </span>
              </div>
              {index < aggregatedCharges.length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </div>
      )}
    </DashboardSummaryCard>
  );
}
