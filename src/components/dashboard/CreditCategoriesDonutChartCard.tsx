import { CreditCard } from "lucide-react";
import { useMemo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Credit, User } from "../../types";
import { DashboardSummaryCard } from "./DashboardSummaryCard";

interface CreditCategoriesDonutChartCardProps {
  credits: Credit[];
  user: User | null;
  className?: string;
}

const COLORS = [
  "#8884d8", // purple
  "#82ca9d", // green
  "#ffc658", // yellow
  "#ff8042", // orange
  "#0088FE", // blue
  "#00C49F", // teal
  "#FFBB28", // gold
  "#FF8042", // coral
];

export function CreditCategoriesDonutChartCard({
  credits,
  user,
  className,
}: CreditCategoriesDonutChartCardProps) {
  const data = useMemo(() => {
    if (!user) return [];

    const creditMap = new Map<string, number>();

    credits.forEach((credit) => {
      // Un crédit est considéré comme actif si ses mensualités restantes sont supérieures à 0.
      if (credit.remaining_installments > 0) {
        creditMap.set(
          credit.loan_name,
          (creditMap.get(credit.loan_name) || 0) + credit.monthly_payment
        );
      }
    });

    return Array.from(creditMap.entries()).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));
  }, [credits, user]);

  const totalCredits = data.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <DashboardSummaryCard
      title="Répartition des Crédits"
      value={totalCredits.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      })}
      description="Mensualités par crédit"
      icon={<CreditCard className="h-4 w-4" />}
      iconBgColor="bg-blue-100"
      iconColor="text-blue-600"
      className={className}
    >
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={150}>
          <div className="flex flex-col md:flex-row items-center justify-center h-full">
            <PieChart width={200} height={200}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) =>
                  value.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })
                }
              />
            </PieChart>
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: "10px" }}
            />
          </div>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-muted-foreground">
          Aucun crédit à afficher.
        </p>
      )}
    </DashboardSummaryCard>
  );
}
