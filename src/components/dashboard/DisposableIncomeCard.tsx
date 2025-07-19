import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TrendingUp } from "lucide-react";

interface DisposableIncomeCardProps {
  estimatedDisposableIncome: number;
}

export function DisposableIncomeCard({
  estimatedDisposableIncome,
}: DisposableIncomeCardProps) {
  const isPositive = estimatedDisposableIncome >= 0;
  const textColorClass = isPositive ? "text-green-500" : "text-red-500";

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">
          Revenu Disponible Estimé
        </CardTitle>
        <TrendingUp className={`h-4 w-4 ${textColorClass}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${textColorClass}`}>
          {estimatedDisposableIncome.toLocaleString("fr-FR", {
            style: "currency",
            currency: "EUR",
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Après crédits, charges et épargne
        </p>
      </CardContent>
    </Card>
  );
}
