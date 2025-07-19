import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";


interface CreditSummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
}

export function CreditSummaryCard({ title, value, icon }: CreditSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="p-2 rounded-full bg-purple-100 text-purple-600">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">
          {value.toLocaleString("fr-FR", {
            style: "currency",
            currency: "EUR",
          })}
        </p>
      </CardContent>
    </Card>
  );
}
