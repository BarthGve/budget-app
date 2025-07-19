import { useMemo } from "react";
import { Card, CardContent, CardTitle } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { Goal } from "lucide-react";
import type { SavingsContribution } from "../../types";

interface SavingsProgressCardProps {
  totalMonthlyIncome: number;
  savingsGoalPercentage: number;
  savingsContributions: SavingsContribution[];
}

export function SavingsProgressCard({
  totalMonthlyIncome,
  savingsGoalPercentage,
  savingsContributions,
}: SavingsProgressCardProps) {
  const calculatedSavingsAmount = useMemo(() => {
    return (totalMonthlyIncome * savingsGoalPercentage) / 100;
  }, [totalMonthlyIncome, savingsGoalPercentage]);
  const totalMonthlyContributions = useMemo(() => {
    const today = new Date();
    if (!Array.isArray(savingsContributions)) {
      return 0; // Return 0 if it's not an array
    }
    return savingsContributions
      .filter((contribution) => {
        const startDate = new Date(contribution.start_date);
        return startDate <= today;
      })
      .reduce((sum, contribution) => {
        let monthlyAmount = 0;
        switch (contribution.frequency) {
          case "Mensuel":
            monthlyAmount = contribution.amount;
            break;
          case "Trimestriel":
            monthlyAmount = contribution.amount / 3;
            break;
          case "Annuel":
            monthlyAmount = contribution.amount / 12;
            break;
          default:
            break;
        }
        return sum + monthlyAmount;
      }, 0);
  }, [savingsContributions]);

  const progressPercentage = useMemo(() => {
    if (calculatedSavingsAmount === 0) return 0;
    const percentage =
      (totalMonthlyContributions / calculatedSavingsAmount) * 100;
    return Math.min(Math.round(percentage), 100); // Cap at 100%
  }, [totalMonthlyContributions, calculatedSavingsAmount]);

  return (
    <Card className="w-full ">
      <CardContent className="px-3 py-2 flex items-center justify-between gap-4">
        {/* Title */}
        <CardTitle className="flex items-center gap-2 flex-shrink-0">
          <Goal className="h-4 w-4" /> Progression
        </CardTitle>

        {/* Progress Bar and Text */}
        <div className="flex-grow flex items-center gap-2">
          <Progress value={progressPercentage} className="w-32" />
          <div className="flex-shrink-0 text-right">
            <p className="text-sm font-semibold leading-none">
              {progressPercentage}%
            </p>
            <p className="text-[10px] text-muted-foreground leading-none">
              (
              {totalMonthlyContributions.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}{" "}
              /{" "}
              {calculatedSavingsAmount.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
              )
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
