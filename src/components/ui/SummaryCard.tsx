import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  rightContent?: React.ReactNode; // New prop for content on the right
}

export function SummaryCard({ title, value, icon, iconBgColor, iconColor, rightContent }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-0 pb-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div
          className={`p-2 rounded-full ${iconBgColor || "bg-gray-100"} ${
            iconColor || "text-gray-600"
          }`}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 items-center pt-0">
        <p className="text-2xl font-bold text-left">{value}</p>
        <div className="flex justify-center">{rightContent}</div>
      </CardContent>
    </Card>
  );
}
