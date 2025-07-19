import { CreditCard } from "lucide-react";
import { useData } from "../../context/data-context-utils";
import { DashboardSummaryCard } from "./DashboardSummaryCard";

interface CreditSummaryCardProps {
  totalMonthlyCreditsPayment: number;
}

export function CreditSummaryCard({
  totalMonthlyCreditsPayment,
}: CreditSummaryCardProps) {
  const data = useData();

  return (
    <DashboardSummaryCard
      title="Crédits Mensuels"
      value={totalMonthlyCreditsPayment.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      })}
      description="Total des mensualités"
      icon={<CreditCard className="h-4 w-4" />}
      iconBgColor="bg-blue-100"
      iconColor="text-blue-600"
      isClickable={(data?.collaborations?.length ?? 0) > 0}
    />
  );
}
