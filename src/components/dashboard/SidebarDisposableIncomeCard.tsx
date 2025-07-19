import { HandCoinsIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface SidebarDisposableIncomeCardProps {
  estimatedDisposableIncome: number;
  isSidebarOpen: boolean;
}

export function SidebarDisposableIncomeCard({
  estimatedDisposableIncome,
  isSidebarOpen,
}: SidebarDisposableIncomeCardProps) {
  const isPositive = estimatedDisposableIncome >= 0;
  const textColorClass = isPositive ? "text-green-400" : "text-red-400";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={cn(
              "bg-gray-700 text-white border-none shadow-none transition-all duration-300 ease-in-out",
              isSidebarOpen ? "w-full" : "w-16"
            )}
          >
            <CardHeader
              className={cn(
                "flex flex-row items-center justify-between space-y-0 ",
                isSidebarOpen ? "px-4" : "px-2"
              )}
            >
              {isSidebarOpen && (
                <CardTitle className="text-sm font-medium">
                  Revenu Disponible
                </CardTitle>
              )}
              <HandCoinsIcon className={`h-4 w-4 ${textColorClass}`} />
            </CardHeader>
            <CardContent className={isSidebarOpen ? "px-4" : "px-2"}>
              {isSidebarOpen ? (
                <div className={`text-lg font-bold ${textColorClass}`}>
                  {estimatedDisposableIncome.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </div>
              ) : (
                <div className="h-6" /> // Placeholder to maintain height when collapsed
              )}
              {isSidebarOpen && (
                <p className="text-xs text-gray-400">
                  Après crédits, charges et épargne
                </p>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        {!isSidebarOpen && (
          <TooltipContent>
            <p>
              Revenu Disponible Estimé :{" "}
              {estimatedDisposableIncome.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
