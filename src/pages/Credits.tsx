import { ChevronDown, ChevronUp, CreditCard, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CreditForm } from "../components/credits/CreditForm";
import { CreditListItem } from "../components/credits/CreditListItem";
import { SummaryCard } from "../components/ui/SummaryCard";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Table, TableBody } from "../components/ui/table";
import { useData } from "../context/data-context-utils";
import type { Credit } from "../types";

import { CreditListItemSkeleton } from "../components/credits/CreditListItemSkeleton";
import { DashboardSummaryCardSkeleton } from "../components/dashboard/DashboardSummaryCardSkeleton";
import { MiniBarChart } from "../components/ui/MiniBarChart";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

// Function to get a consistent color for each credit
const getCreditColor = (index: number) => {
  const colors = [
    "#D8B4FE", // purple-300
    "#C084FC", // purple-400
    "#A78BFA", // purple-500
    "#9333EA", // purple-600
    "#7E22CE", // purple-700
    "#6B21A8", // purple-800
  ];
  return colors[index % colors.length];
};

function Credits() {
  const dataContext = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null);
  const [isArchivedCardOpen, setIsArchivedCardOpen] = useState(false); // New state for archived card

  const {
    activeCredits,
    archivedCredits,
    totalAmountDue,
    totalMonthlyPayment,
    canShareCredit,
    allArchivedCount,
    monthlyPaymentsChartData, // Ajout de monthlyPaymentsChartData ici
  } = useMemo(() => {
    if (!dataContext) {
      return {
        activeCredits: [],
        archivedCredits: [],
        totalAmountDue: 0,
        totalMonthlyPayment: 0,
        canShareCredit: false,
        allArchivedCount: 0,
        monthlyPaymentsChartData: [], // Initialisation pour éviter les erreurs
      };
    }
    const { credits, user, collaborations, enseignes } = dataContext;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date

    const updatedCredits = credits.map((credit: Credit) => {
      const enseigne = enseignes.find((e) => e.id === credit.enseigne_id);
      const creditWithEnseigne = { ...credit, enseignes: enseigne };

      if (creditWithEnseigne.is_settled_early) {
        return {
          ...creditWithEnseigne,
          remaining_installments: 0,
          current_amount_due: 0,
        };
      }

      const startDate = new Date(creditWithEnseigne.start_date);

      // Calculate the first day of the month AFTER the last payment is due
      const effectiveEndDate = new Date(startDate);
      effectiveEndDate.setMonth(
        effectiveEndDate.getMonth() + creditWithEnseigne.total_installments
      );
      effectiveEndDate.setDate(1); // First day of the month after the last installment
      effectiveEndDate.setHours(0, 0, 0, 0); // Normalize to midnight

      // If today is on or after the effective end date, the credit is fully paid and archived
      if (today >= effectiveEndDate) {
        return {
          ...creditWithEnseigne,
          remaining_installments: 0,
          current_amount_due: 0,
        };
      }

      // Otherwise, it's active. Calculate its current state.
      const monthsPassed =
        (today.getFullYear() - startDate.getFullYear()) * 12 +
        (today.getMonth() - startDate.getMonth());
      const paidInstallments = Math.max(
        0,
        Math.min(monthsPassed, creditWithEnseigne.total_installments)
      );
      const remaining_installments =
        creditWithEnseigne.total_installments - paidInstallments;
      const current_amount_due =
        remaining_installments * creditWithEnseigne.monthly_payment;

      return {
        ...creditWithEnseigne,
        remaining_installments,
        current_amount_due,
      };
    });

    const allArchived = updatedCredits.filter(
      (credit: Credit) => credit.remaining_installments <= 0
    );

    const myPersonalCredits = updatedCredits.filter(
      (credit: Credit) =>
        credit.user_id === user?.id &&
        !credit.is_shared &&
        credit.remaining_installments > 0
    );

    const sharedCreditsFiltered = updatedCredits.filter(
      (credit: Credit) => credit.is_shared && credit.remaining_installments > 0
    );

    const activeCredits = [...myPersonalCredits, ...sharedCreditsFiltered];

    const totalAmountDue = activeCredits.reduce(
      (acc: number, credit: Credit) => acc + credit.current_amount_due,
      0
    );

    const totalMonthlyPayment = activeCredits.reduce(
      (acc: number, credit: Credit) => acc + (credit.monthly_payment || 0),
      0
    );

    const monthlyPaymentsChartData = activeCredits.map((credit, index) => ({
      category: credit.loan_name || credit.organization_name || "Inconnu",
      totalAmount: credit.monthly_payment || 0,
      color: getCreditColor(index),
    }));

    const canShareCredit = collaborations.length > 0;

    return {
      activeCredits,
      archivedCredits: allArchived, // Use all archived credits
      totalAmountDue,
      totalMonthlyPayment,
      monthlyPaymentsChartData,
      canShareCredit,
      allArchivedCount: allArchived.length, // Pass total count for badge
    };
  }, [dataContext]);

  if (!dataContext) {
    return <div>Chargement des données...</div>; // Or a loading spinner
  }

  const {
    credits,
    loading,
    user,
    supabase,
    addCredit,
    updateCredit,
    deleteCredit,
  } = dataContext;

  const handleEditClick = (credit: Credit) => {
    setEditingCredit(credit);
    setIsDialogOpen(true);
  };

  const handleAddClick = () => {
    setEditingCredit(null);
    setIsDialogOpen(true);
  };

  const handleFormSuccess = (newOrUpdatedCredit?: Credit) => {
    setIsDialogOpen(false);
    setEditingCredit(null);
    if (newOrUpdatedCredit) {
      if (editingCredit) {
        updateCredit(newOrUpdatedCredit);
      } else {
        addCredit(newOrUpdatedCredit);
      }
    }
  };

  const handleDelete = async (creditId: string) => {
    const { error } = await supabase
      .from("credits")
      .delete()
      .eq("id", creditId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Crédit supprimé avec succès !");
      deleteCredit(creditId);
    }
  };

  const handleSettleCredit = async (creditId: string) => {
    const creditToSettle = credits.find((c: Credit) => c.id === creditId);
    if (!creditToSettle) {
      toast.error("Crédit non trouvé.");
      return;
    }

    const startDate = new Date(creditToSettle.start_date);
    const today = new Date();
    const monthsPassed =
      (today.getFullYear() - startDate.getFullYear()) * 12 +
      (today.getMonth() - startDate.getMonth()) +
      1;

    const { error } = await supabase
      .from("credits")
      .update({
        total_installments: monthsPassed, // Force remaining_installments to 0
        end_date: today.toISOString(), // Set settlement date
        is_settled_early: true,
      })
      .eq("id", creditId);

    if (error) {
      toast.error("Erreur lors du règlement du crédit: " + error.message);
    } else {
      toast.success("Crédit soldé avec succès !");
      updateCredit({
        ...creditToSettle,
        total_installments: monthsPassed,
        end_date: today.toISOString(),
        is_settled_early: true,
        remaining_installments: 0,
        current_amount_due: 0,
      });
    }
  };

  const handleToggleShare = async (creditId: string, isShared: boolean) => {
    if (!dataContext?.user?.id) {
      toast.error("Utilisateur non connecté.");
      return;
    }

    // Get the old shared status before update
    const oldCredit = credits.find((c) => c.id === creditId);
    const oldIsShared = oldCredit?.is_shared || false;

    const { error } = await dataContext.supabase
      .from("credits")
      .update({ is_shared: isShared })
      .eq("id", creditId);

    if (error) {
      toast.error(`Erreur lors de la mise à jour du partage: ${error.message}`);
    } else {
      toast.success(
        `Crédit ${isShared ? "partagé" : "non partagé"} avec succès !`
      );
      updateCredit({ ...oldCredit, is_shared: isShared } as Credit);

      // Check if sharing status changed from true to false
      if (oldIsShared && !isShared && dataContext.user) {
        try {
          const { data: invokeData, error: invokeError } =
            await dataContext.supabase.functions.invoke(
              "notify-collaborators-on-credit-unshare",
              {
                body: {
                  creditOwnerId: dataContext.user.id,
                  creditOwnerFirstName:
                    dataContext.user.user_metadata?.firstName ||
                    "Un utilisateur",
                  creditName: oldCredit?.loan_name || "un crédit",
                  creditId: creditId,
                },
              }
            );

          if (invokeError) {
            console.error("Error invoking unshare Edge Function:", invokeError);
            toast.error(
              "Erreur lors de l'envoi de la notification de non-partage aux collaborateurs."
            );
          } else {
            console.log("Unshare Edge Function response:", invokeData);
          }
        } catch (error) {
          console.error(
            "Unexpected error invoking unshare Edge Function:",
            error
          );
          toast.error(
            "Une erreur inattendue est survenue lors de l'envoi de la notification de non-partage."
          );
        }
      }

      // Call Edge Function to send notification to collaborators if credit is newly shared
      if (!oldIsShared && isShared && dataContext.user) {
        try {
          const { data: invokeData, error: invokeError } =
            await dataContext.supabase.functions.invoke(
              "notify-collaborators-on-credit-share",
              {
                body: {
                  creditOwnerId: dataContext.user.id,
                  creditOwnerFirstName:
                    dataContext.user.user_metadata?.firstName ||
                    "Un utilisateur",
                  creditName: oldCredit?.loan_name || "un crédit",
                  creditId: creditId,
                },
              }
            );

          if (invokeError) {
            console.error("Error invoking share Edge Function:", invokeError);
            toast.error(
              "Erreur lors de l'envoi de la notification de partage aux collaborateurs."
            );
          } else {
            console.log("Share Edge Function response:", invokeData);
          }
        } catch (error) {
          console.error(
            "Unexpected error invoking share Edge Function:",
            error
          );
          toast.error(
            "Une erreur inattendue est survenue lors de l'envoi de la notification de partage."
          );
        }
      }
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Gestion des Crédits</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {loading ? (
          <>
            <DashboardSummaryCardSkeleton />
            <DashboardSummaryCardSkeleton />
          </>
        ) : (
          <>
            <SummaryCard
              title="Total Paiements Mensuels"
              value={totalMonthlyPayment.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
              icon={<CreditCard className="h-5 w-5" />}
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
              rightContent={
                <MiniBarChart
                  data={monthlyPaymentsChartData}
                  width="100px"
                  height="50px"
                />
              }
            />
            <SummaryCard
              title="Total des Sommes Dues"
              value={totalAmountDue.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
              icon={<CreditCard className="h-5 w-5" />}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
            />
          </>
        )}
      </div>

      <div className="flex justify-end mb-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un crédit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingCredit
                  ? "Modifier le crédit"
                  : "Ajouter un nouveau crédit"}
              </DialogTitle>
            </DialogHeader>
            <CreditForm
              credit={editingCredit}
              onSuccess={handleFormSuccess}
              currentUserId={user?.id ?? null}
              canShareCredit={canShareCredit}
            />
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            Crédits actifs
            <Badge className="ml-2 bg-blue-500 rounded-full">
              {activeCredits.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <Table>
                <TableBody>
                  <CreditListItemSkeleton />
                  <CreditListItemSkeleton />
                  <CreditListItemSkeleton />
                </TableBody>
              </Table>
            ) : activeCredits.length > 0 ? (
              <Table>
                <TableBody>
                  {activeCredits.map((credit: Credit) => (
                    <CreditListItem
                      key={credit.id}
                      credit={credit}
                      onEditClick={handleEditClick}
                      onDelete={handleDelete}
                      onSettle={handleSettleCredit}
                      currentUserId={user?.id ?? null}
                      onToggleShare={handleToggleShare}
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center">Aucun crédit trouvé.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {allArchivedCount > 0 && (
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center">
              Crédits Archivés
              <Badge className="ml-2 bg-blue-500 rounded-full">
                {allArchivedCount}
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsArchivedCardOpen(!isArchivedCardOpen)}
            >
              {isArchivedCardOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CardHeader>
          {isArchivedCardOpen && (
            <CardContent>
              <Table>
                <TableBody>
                  {loading ? (
                    <Table>
                      <TableBody>
                        <CreditListItemSkeleton />
                        <CreditListItemSkeleton />
                        <CreditListItemSkeleton />
                      </TableBody>
                    </Table>
                  ) : archivedCredits.length > 0 ? (
                    archivedCredits.map((credit: Credit) => (
                      <CreditListItem
                        key={credit.id}
                        credit={credit}
                        onEditClick={handleEditClick}
                        onDelete={handleDelete}
                        onSettle={handleSettleCredit}
                        currentUserId={user?.id ?? null}
                        onToggleShare={handleToggleShare}
                      />
                    ))
                  ) : (
                    <p className="text-center">Aucun crédit archivé trouvé.</p>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

export default Credits;
