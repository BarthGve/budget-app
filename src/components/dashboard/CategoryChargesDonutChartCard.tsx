import { Repeat } from "lucide-react";
import { useMemo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { RecurringCharge } from "../../types";
import { DashboardSummaryCard } from "./DashboardSummaryCard";

interface CategoryChargesDonutChartCardProps {
  recurringCharges: RecurringCharge[];
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

export function CategoryChargesDonutChartCard({
  recurringCharges,
  className,
}: CategoryChargesDonutChartCardProps) {
  const data = useMemo(() => {
    const categoryMap = new Map<string, number>();

    recurringCharges.forEach((charge) => {
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
      categoryMap.set(
        charge.category,
        (categoryMap.get(charge.category) || 0) + monthlyAmount
      );
    });

    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));
  }, [recurringCharges]);

  return (
    <DashboardSummaryCard
      title="Répartition des Charges"
      value="" // Required prop, but not displayed when children is provided
      description="Charges mensuelles récurrentes"
      icon={<Repeat className="h-4 w-4" />}
      iconBgColor="bg-orange-100"
      iconColor="text-orange-600"
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
          Aucune charge récurrente pour le moment.
        </p>
      )}
    </DashboardSummaryCard>
  );
}
