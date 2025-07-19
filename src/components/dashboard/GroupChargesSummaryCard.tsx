import { Users } from "lucide-react";
import React, { useMemo } from "react";
import { useData } from "../../context/data-context-utils";
import { Separator } from "../ui/separator";
import { DashboardSummaryCard } from "./DashboardSummaryCard";

export function GroupChargesSummaryCard() {
  const data = useData();

  const aggregatedCharges = useMemo(() => {
    if (!data) {
      return [];
    }

    const { recurringCharges, groups, user } = data;
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

      // Find which group this beneficiary belongs to
      groups.forEach((group) => {
        if (
          group.group_beneficiaries &&
          group.group_beneficiaries.some(
            (gb) => gb.beneficiary_id === chargeBeneficiaryId
          )
        ) {
          aggregation[group.id] = (aggregation[group.id] || 0) + monthlyAmount;
        }
      });
    });

    const result = Object.keys(aggregation).map((groupId) => {
      const totalAmount = aggregation[groupId];
      const group = groups.find((g) => g.id === groupId);
      return {
        id: groupId,
        name: group ? group.name : "Inconnu",
        totalAmount,
      };
    });

    // Sort by total amount descending
    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [data]);

  if (!data) {
    return null; // or a loading state
  }

  return (
    <DashboardSummaryCard
      title="Charges par Groupe (Mensuel)"
      value=""
      description=""
      icon={<Users className="h-4 w-4" />}
      iconBgColor="bg-yellow-100"
      iconColor="text-yellow-600"
    >
      {aggregatedCharges.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune charge récurrente assignée à un groupe.
        </p>
      ) : (
        <div className="space-y-3">
          {aggregatedCharges.map((item, index) => (
            <React.Fragment key={item.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{item.name}</span>
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
