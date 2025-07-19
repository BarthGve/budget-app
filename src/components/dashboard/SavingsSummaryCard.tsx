import { Progress } from "../ui/progress";
import { PiggyBank } from "lucide-react";
import { DashboardSummaryCard } from "./DashboardSummaryCard";

interface SavingsSummaryCardProps {
  calculatedSavingsAmount: number;
  totalMonthlyContributions: number;
}

export function SavingsSummaryCard({
  calculatedSavingsAmount,
  totalMonthlyContributions,
}: SavingsSummaryCardProps) {
  const progressPercentage = Math.min(
    Math.round((totalMonthlyContributions / calculatedSavingsAmount) * 100),
    100
  );

  return (
    <DashboardSummaryCard
      title="Épargne mensuel"
      value=""
      description=""
      icon={<PiggyBank className="h-4 w-4" />}
      iconBgColor="bg-green-100"
      iconColor="text-green-600"
    >
      <div>
        <div className="flex justify-between text-2xl font-bold">
          <span>
            {totalMonthlyContributions.toLocaleString("fr-FR", {
              style: "currency",
              currency: "EUR",
            })}
          </span>
        </div>
        <Progress value={progressPercentage} className="mt-2" />
        <p className="text-xs text-muted-foreground text-right mt-1">
          {progressPercentage}% de la ciblé fixée à{" "}
          <span className="font-bold">
            {calculatedSavingsAmount.toLocaleString("fr-FR", {
              style: "currency",
              currency: "EUR",
            })}
          </span>{" "}
          atteint
        </p>
      </div>
    </DashboardSummaryCard>
  );
}
