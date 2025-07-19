import { Wallet } from "lucide-react";
import { useMemo } from "react";
import type { Income, Profile, User } from "../../types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Progress } from "../ui/progress";
import { DashboardSummaryCard } from "./DashboardSummaryCard";

interface IncomeSummaryCardProps {
  totalMonthlyIncome: number;
  incomes: Income[];
  collaborators: Profile[];
  user: User | null;
}

export function IncomeSummaryCard({
  totalMonthlyIncome,
  incomes,
  collaborators,
  user,
}: IncomeSummaryCardProps) {
  const isClickable = collaborators.length > 0;

  const incomeBreakdown = useMemo(() => {
    if (!user) return [];

    // Create a unified list of contributors with a consistent structure
    const allContributors = [
      {
        id: user.id,
        name: "Moi",
        avatar_url:
          typeof user.user_metadata?.avatar_url === "string"
            ? user.user_metadata.avatar_url
            : null,
      },
      ...collaborators.map((collab) => ({
        id: collab.id,
        name:
          `${collab.first_name || ""} ${collab.last_name || ""}`.trim() ||
          collab.email,
        avatar_url:
          typeof collab.avatar_url === "string" ? collab.avatar_url : null,
      })),
    ];

    return allContributors.map((contributor) => {
      const contributorIncomes = incomes.filter(
        (income) =>
          income.contributor_user_id === contributor.id &&
          income.frequency === "Mensuel"
      );
      const contributorTotal = contributorIncomes.reduce(
        (sum, income) => sum + income.amount,
        0
      );
      const percentage =
        totalMonthlyIncome > 0
          ? (contributorTotal / totalMonthlyIncome) * 100
          : 0;

      return {
        ...contributor,
        total: contributorTotal,
        percentage: percentage,
      };
    });
  }, [incomes, collaborators, user, totalMonthlyIncome]);

  const dialogContent = (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Voici la répartition de votre revenu mensuel total, incluant vos
        contributions personnelles et celles de vos collaborateurs.
      </p>
      {incomeBreakdown.map((item) => (
        <div
          key={item.id}
          className={`space-y-2 p-2 rounded-md ${
            item.id === user?.id ? "bg-blue-50/50 border border-blue-200" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={item.avatar_url ?? "https://github.com/shadcn.png"}
                />
                <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{item.name}</span>
            </div>
            <div className="text-right">
              <p className="font-bold">
                {item.total.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.percentage.toFixed(1)}%
              </p>
            </div>
          </div>
          <Progress value={item.percentage} />
        </div>
      ))}
    </div>
  );

  return (
    <DashboardSummaryCard
      title="Revenu Mensuel Total"
      value={totalMonthlyIncome.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      })}
      description="Estimé"
      icon={<Wallet className="h-4 w-4" />}
      iconBgColor="bg-blue-100"
      iconColor="text-blue-600"
      dialogContent={dialogContent}
      dialogTitle="Répartition du Revenu Mensuel"
      isClickable={isClickable}
    />
  );
}
