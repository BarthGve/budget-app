import { useEffect, useMemo, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import { useData } from "../context/data-context-utils";
import type { Collaboration, Profile as ProfileType } from "../types/index";

import Credits from "./Credits";
import Incomes from "./Incomes";
import ProfileComponent from "./Profile";
import { RecurringCharges } from "./RecurringCharges";
import Savings from "./Savings";
import Settings from "./Settings";

import { CreditSummaryDetailModal } from "../components/credits/CreditSummaryDetailModal";
import { BeneficiaryChargesSummaryCard } from "../components/dashboard/BeneficiaryChargesSummaryCard";
import { CategoryChargesDonutChartCard } from "../components/dashboard/CategoryChargesDonutChartCard";
import { CreditCategoriesDonutChartCard } from "../components/dashboard/CreditCategoriesDonutChartCard";
import { CreditSummaryCard } from "../components/dashboard/CreditSummaryCard";
import { DashboardSummaryCardSkeleton } from "../components/dashboard/DashboardSummaryCardSkeleton";
import { GroupChargesSummaryCard } from "../components/dashboard/GroupChargesSummaryCard";
import { IncomeSummaryCard } from "../components/dashboard/IncomeSummaryCard";
import { RecurringChargesSummaryCard } from "../components/dashboard/RecurringChargesSummaryCard";
import { SavingsSummaryCard } from "../components/dashboard/SavingsSummaryCard";
import { RecurringChargeDetailModal } from "../components/recurringCharges/RecurringChargeDetailModal";

import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "../components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

function UserDashboardContent() {
  const [isRecurringChargeModalOpen, setIsRecurringChargeModalOpen] =
    useState(false);
  const [isCreditSummaryDetailModalOpen, setIsCreditSummaryDetailModalOpen] =
    useState(false);
  const [firstName, setFirstName] = useState("");
  const [collaborators, setCollaborators] = useState<ProfileType[]>([]);

  const data = useData();

  const {
    user,
    incomes,
    credits,
    recurringCharges,
    savingsContributions,
    profile,
    beneficiaries,
    loading,
    collaborations: dataCollaborations,
  } = data || {};

  useEffect(() => {
    if (user) {
      const firstName = user.user_metadata?.firstName;
      setFirstName(typeof firstName === "string" ? firstName : "");
    }
  }, [user]);

  useEffect(() => {
    if (dataCollaborations) {
      const activeCollaborations = dataCollaborations.filter(
        (collab: Collaboration) => collab.status === "accepted"
      );
      const collaboratorProfiles = activeCollaborations
        .map((collab: Collaboration) => {
          if (collab.inviter_id === user?.id) return collab.invitee;
          return collab.inviter;
        })
        .filter((p): p is ProfileType => !!p);
      setCollaborators(collaboratorProfiles);
    }
  }, [dataCollaborations, user]);

  const totalMonthlyIncome = useMemo(() => {
    return (
      incomes
        ?.filter((i) => i.frequency === "Mensuel")
        .reduce((sum, i) => sum + i.amount, 0) ?? 0
    );
  }, [incomes]);

  const totalMonthlyCreditsPayment = useMemo(() => {
    return (
      credits
        ?.filter((c) => !c.is_settled_early)
        .reduce((sum, c) => sum + c.monthly_payment, 0) ?? 0
    );
  }, [credits]);

  const totalMonthlyRecurringCharges = useMemo(() => {
    let total = 0;
    recurringCharges?.forEach((charge) => {
      let monthlyAmount = 0;
      const amountToConsider = charge.amount;
      switch (charge.frequency) {
        case "monthly":
          monthlyAmount = amountToConsider;
          break;
        case "quarterly":
          monthlyAmount = amountToConsider / 3;
          break;
        case "annually":
          monthlyAmount = amountToConsider / 12;
          break;
        default:
          break;
      }
      total += monthlyAmount;
    });
    return total;
  }, [recurringCharges]);

  const calculatedSavingsAmount = useMemo(() => {
    const savingsGoalPercentage = profile?.savings_goal_percentage ?? 10; // Use profile.savings_goal_percentage
    return (totalMonthlyIncome * savingsGoalPercentage) / 100;
  }, [totalMonthlyIncome, profile]); // Depend on profile

  const totalMonthlyContributions = useMemo(() => {
    let total = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Array.isArray(savingsContributions)) {
      savingsContributions.forEach((contribution) => {
        let monthlyAmount = 0;
        const amountToConsider = contribution.amount;
        const startDate = new Date(contribution.start_date);
        startDate.setHours(0, 0, 0, 0);

        if (isNaN(startDate.getTime()) || startDate > today) {
          return; // Skip invalid dates or future contributions
        }

        switch (contribution.frequency) {
          case "Mensuel":
            monthlyAmount = amountToConsider;
            break;
          case "Trimestriel":
            monthlyAmount = amountToConsider / 3;
            break;
          case "Annuel":
            monthlyAmount = amountToConsider / 12;
            break;
          default:
            break;
        }
        total += monthlyAmount;
      });
    }
    return total;
  }, [savingsContributions]);

  const yourPercentage = useMemo(() => {
    if (!user || !incomes || totalMonthlyIncome === 0) return 0;

    const yourMonthlyIncome = incomes
      .filter(
        (income) =>
          income.frequency === "Mensuel" &&
          income.contributor_user_id === user.id
      )
      .reduce((sum, income) => sum + income.amount, 0);

    return (yourMonthlyIncome / totalMonthlyIncome) * 100;
  }, [incomes, user, totalMonthlyIncome]);

  const handleUserUpdate = () => {
    toast.success("Profil mis à jour avec succès !");
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <h1 className="text-4xl font-bold mb-4">👋 Bonjour {firstName}</h1>
            <p className="mb-4 flex items-center flex-wrap ">
              Ceci est ton espace personnel pour gérer ton budget
              {collaborators.length > 0 && (
                <>
                  {" avec "}
                  <TooltipProvider>
                    {collaborators.map((collab) => (
                      <Tooltip key={collab.id}>
                        <TooltipTrigger asChild>
                          <Avatar className="inline-block h-8 w-8 rounded-full ring-2 ring-white ml-1">
                            <AvatarImage
                              src={
                                collab.avatar_url ||
                                `https://ui-avatars.com/api/?name=${collab.first_name}+${collab.last_name}&background=random`
                              }
                            />
                            <AvatarFallback>
                              {collab.first_name?.[0]}
                              {collab.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {collab.first_name}{" "}
                            {collab.last_name || collab.email}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </>
              )}
            </p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {loading ? (
                <DashboardSummaryCardSkeleton />
              ) : (
                profile?.dashboard_preferences?.showIncomeSummary && (
                  <IncomeSummaryCard
                    totalMonthlyIncome={totalMonthlyIncome}
                    incomes={incomes || []}
                    collaborators={collaborators}
                    user={user || null}
                  />
                )
              )}
              {loading ? (
                <DashboardSummaryCardSkeleton />
              ) : (
                profile?.dashboard_preferences?.showCreditSummary &&
                (collaborators.length > 0 ? (
                  <Dialog
                    open={isCreditSummaryDetailModalOpen}
                    onOpenChange={setIsCreditSummaryDetailModalOpen}
                  >
                    <DialogTrigger asChild>
                      <div className="cursor-pointer">
                        <CreditSummaryCard
                          totalMonthlyCreditsPayment={
                            totalMonthlyCreditsPayment
                          }
                        />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                      <CreditSummaryDetailModal
                        isOpen={isCreditSummaryDetailModalOpen}
                        onOpenChange={setIsCreditSummaryDetailModalOpen}
                        credits={credits || []}
                        user={user || null}
                        collaboratorProfiles={collaborators}
                        totalMonthlyIncome={totalMonthlyIncome}
                        yourPercentage={yourPercentage}
                      />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <CreditSummaryCard
                    totalMonthlyCreditsPayment={totalMonthlyCreditsPayment}
                  />
                ))
              )}
              {loading ? (
                <DashboardSummaryCardSkeleton />
              ) : (
                profile?.dashboard_preferences?.showRecurringChargesSummary &&
                (collaborators.length > 0 ? (
                  <Dialog
                    open={isRecurringChargeModalOpen}
                    onOpenChange={setIsRecurringChargeModalOpen}
                  >
                    <DialogTrigger asChild>
                      <div className="cursor-pointer">
                        <RecurringChargesSummaryCard
                          totalMonthlyRecurringCharges={
                            totalMonthlyRecurringCharges
                          }
                        />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                      <RecurringChargeDetailModal
                        isOpen={isRecurringChargeModalOpen}
                        onOpenChange={setIsRecurringChargeModalOpen}
                        recurringCharges={recurringCharges || []}
                        user={user || null}
                        collaboratorProfiles={collaborators}
                        beneficiaries={beneficiaries || []}
                        totalMonthlyIncome={totalMonthlyIncome}
                        yourPercentage={yourPercentage}
                      />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <RecurringChargesSummaryCard
                    totalMonthlyRecurringCharges={totalMonthlyRecurringCharges}
                  />
                ))
              )}
              {loading ? (
                <DashboardSummaryCardSkeleton />
              ) : (
                profile?.dashboard_preferences?.showSavingsSummary && (
                  <SavingsSummaryCard
                    calculatedSavingsAmount={calculatedSavingsAmount}
                    totalMonthlyContributions={totalMonthlyContributions}
                  />
                )
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 mb-8">
              {loading ? (
                <>
                  <DashboardSummaryCardSkeleton />
                  <DashboardSummaryCardSkeleton />
                </>
              ) : (
                <>
                  {profile?.dashboard_preferences?.showBeneficiaryCharges && (
                    <BeneficiaryChargesSummaryCard />
                  )}
                  {profile?.dashboard_preferences?.showGroupCharges && (
                    <GroupChargesSummaryCard />
                  )}
                </>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {loading ? (
                <>
                  <DashboardSummaryCardSkeleton />
                  <DashboardSummaryCardSkeleton />
                </>
              ) : (
                <>
                  {profile?.dashboard_preferences?.showCategoryChargesDonut && (
                    <CategoryChargesDonutChartCard
                      recurringCharges={recurringCharges || []}
                      className="lg:col-span-1"
                    />
                  )}
                  {profile?.dashboard_preferences
                    ?.showCreditCategoriesDonut && (
                    <CreditCategoriesDonutChartCard
                      credits={credits || []}
                      user={user || null}
                      className="lg:col-span-1"
                    />
                  )}
                </>
              )}
            </div>
          </>
        }
      />
      <Route path="/incomes" element={<Incomes />} />
      <Route path="/credits" element={<Credits />} />
      <Route
        path="/profile"
        element={<ProfileComponent onUserUpdate={handleUserUpdate} />}
      />
      <Route path="/settings" element={<Settings />} />

      <Route path="/recurring-charges" element={<RecurringCharges />} />
      <Route path="/savings" element={<Savings />} />
    </Routes>
  );
}

export default UserDashboardContent;
