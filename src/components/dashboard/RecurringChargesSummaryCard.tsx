import { Repeat } from "lucide-react";
import { DashboardSummaryCard } from "./DashboardSummaryCard";

interface RecurringChargesSummaryCardProps {
  totalMonthlyRecurringCharges: number;
}

export function RecurringChargesSummaryCard({
  totalMonthlyRecurringCharges,
}: RecurringChargesSummaryCardProps) {
  return (
    <DashboardSummaryCard
      title="Charges Mensuelles"
      value={totalMonthlyRecurringCharges.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      })}
      description="Estimé"
      icon={<Repeat className="h-4 w-4" />}
      iconBgColor="bg-orange-100"
      iconColor="text-orange-600"
    />
  );
}
