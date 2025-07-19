import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

interface SignupData {
  signup_date: string;
  signup_count: number;
}

interface RecentSignupsChartProps {
  data: SignupData[];
  loading: boolean;
}

export function RecentSignupsChart({ data, loading }: RecentSignupsChartProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Inscriptions des 7 derniers jours</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        {loading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <ChartContainer config={{}} className="h-[250px] w-full">
            <RechartsBarChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="signup_date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                fontSize={12}
              />
              <YAxis allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="signup_count" fill="#8884d8" radius={4} />
            </RechartsBarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
