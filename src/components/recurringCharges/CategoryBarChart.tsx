import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

import type { ChartData } from "../../types/index";

interface CategoryBarChartProps {
  data: ChartData[];
  frequency: string;
}

import type { TooltipProps } from "recharts";

interface CustomTooltipProps extends TooltipProps<number, string> {
  payload?: Array<{ payload: ChartData }>; // Explicitly define payload structure
}

const CustomTooltip = (props: CustomTooltipProps) => {
  const active = props && props.active;
  const payload = props.payload;
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartData; // Get the data for the hovered bar
    return (
      <div className="custom-tooltip bg-white p-2 border border-gray-300 rounded shadow-md">
        <p className="label">{`${data.category}`}</p>
        <p className="intro">{`Montant: ${data.totalAmount.toLocaleString(
          "fr-FR",
          { style: "currency", currency: "EUR" }
        )}`}</p>
      </div>
    );
  }
  return null;
};

const CategoryBarChart: React.FC<CategoryBarChartProps> = ({
  data,
  frequency,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Répartition des charges par catégorie ({frequency})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="90%" height={200}>
          <BarChart data={data} layout="vertical" barCategoryGap={-10}>
            <YAxis
              dataKey="category"
              type="category"
              axisLine={false}
              tickLine={false}
              width={150}
              interval={0}
              textAnchor="end"
            />
            <XAxis
              type="number"
              tickFormatter={(value: number) =>
                value.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })
              }
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {data.map((entry, index) => (
              <Bar
                key={`bar-${index}`}
                dataKey="totalAmount"
                fill={entry.color}
                barSize={20}
                radius={[0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default CategoryBarChart;
