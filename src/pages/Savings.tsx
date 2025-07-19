import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import Confetti from "react-confetti";
import { useForm } from "react-hook-form";
import { useWindowSize } from "react-use";
import { toast } from "sonner";
import { z } from "zod";
import { GamifiedSavingsForm } from "../components/savings/GamifiedSavingsForm";
import { SavingsContributionListItem } from "../components/savings/SavingsContributionListItem";
import { SavingsContributionListItemSkeleton } from "../components/savings/SavingsContributionListItemSkeleton";
import { SavingsGoalCardSkeleton } from "../components/savings/SavingsGoalCardSkeleton";
import { SavingsProgressCard } from "../components/savings/SavingsProgressCard";
import { SavingsProgressCardSkeleton } from "../components/savings/SavingsProgressCardSkeleton";
import { savingsContributionSchema } from "../components/savings/savingsSchema";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Table, TableBody, TableCell, TableRow } from "../components/ui/table";
import { useData } from "../context/data-context-utils";
import type { SavingsContribution } from "../types";

import { SavingsGoalCard } from "../components/savings/SavingsGoalCard";

function Savings() {
  const data = useData();

  const [isContributionDialogOpen, setIsContributionDialogOpen] =
    useState(false);
  const [editingContribution, setEditingContribution] =
    useState<SavingsContribution | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [contributionsPerPage, setContributionsPerPage] = useState(10);
  const [showAllContributions, setShowAllContributions] = useState(false);

  const hasActiveCollaboration = useMemo(() => {
    return data?.collaborations?.some((c) => c.status === "accepted") ?? false;
  }, [data?.collaborations]);

  const totalMonthlyIncome = useMemo(() => {
    return (
      data?.incomes
        ?.filter((i) => i.frequency === "Mensuel")
        .reduce((sum, i) => sum + i.amount, 0) ?? 0
    );
  }, [data?.incomes]);

  const savingsContributionForm = useForm({
    resolver: zodResolver(savingsContributionSchema),
    defaultValues: {
      account_type_id: "",
      enseigne_id: undefined,
      amount: 0,
      frequency: "Mensuel",
      start_date: new Date(),
      logo_url: undefined,
      beneficiary_id: undefined,
      is_shared: false,
    },
  });

  const {
    user,
    supabase,
    savingsContributions,
    beneficiaries,
    setSavingsContributions,
  } = data || {};

  const filteredContributions = useMemo(() => {
    return (data?.savingsContributions || []).filter((contribution) =>
      (contribution.type || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data?.savingsContributions, searchTerm]);

  const paginatedContributions = useMemo(() => {
    if (showAllContributions) {
      return filteredContributions;
    }
    const startIndex = (currentPage - 1) * contributionsPerPage;
    return filteredContributions.slice(
      startIndex,
      startIndex + contributionsPerPage
    );
  }, [
    filteredContributions,
    currentPage,
    contributionsPerPage,
    showAllContributions,
  ]);

  const totalPages = useMemo(() => {
    if (showAllContributions) {
      return 1; // Only one "page" if all contributions are shown
    }
    return Math.ceil(filteredContributions.length / contributionsPerPage);
  }, [filteredContributions, contributionsPerPage, showAllContributions]);

  const handleAddContributionClick = () => {
    setEditingContribution(null);
    savingsContributionForm.reset();
    setIsContributionDialogOpen(true);
  };

  const handleEditContributionClick = (contribution: SavingsContribution) => {
    setEditingContribution(contribution);
    savingsContributionForm.reset({
      ...contribution,
      start_date: new Date(contribution.start_date),
      logo_url: contribution.logo_url ?? undefined,
      beneficiary_id: contribution.beneficiary_id ?? undefined,
    });
    setIsContributionDialogOpen(true);
  };

  const onSubmitContribution = async (
    values: z.infer<typeof savingsContributionSchema>
  ) => {
    if (!user?.id || !supabase || !data?.enseignes) {
      toast.error("Vous devez être connecté pour effectuer cette action.");
      return;
    }

    const selectedEnseigne = values.enseigne_id
      ? data.enseignes.find((e) => e.id === values.enseigne_id)
      : null;

    const payload = {
      ...values,
      start_date: format(values.start_date, "yyyy-MM-dd"),
      is_shared: values.is_shared,
      organization_name: selectedEnseigne?.name || null,
      logo_url:
        selectedEnseigne?.external_logo_url ||
        selectedEnseigne?.icon_path ||
        null,
    };
    // delete payload.enseigne_id; // Clean up the payload

    const selectQuery =
      "*, creator_profile:user_id(first_name, last_name, avatar_url), account_types(*)";

    const query = editingContribution
      ? supabase
          .from("savings_contributions")
          .update(payload)
          .eq("id", editingContribution.id)
          .select(selectQuery)
      : supabase
          .from("savings_contributions")
          .insert([{ ...payload, user_id: user.id }])
          .select(selectQuery);

    const { data: updatedOrNewContribution, error } = await query;

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        editingContribution
          ? "Versement d'épargne mis à jour avec succès !"
          : "Versement d'épargne ajouté avec succès !"
      );

      if (
        updatedOrNewContribution &&
        updatedOrNewContribution.length > 0 &&
        setSavingsContributions
      ) {
        const newOrUpdatedItem = updatedOrNewContribution[0];
        if (editingContribution) {
          setSavingsContributions((prev) =>
            prev.map((item) =>
              item.id === newOrUpdatedItem.id ? newOrUpdatedItem : item
            )
          );
        } else {
          setSavingsContributions((prev) => [...prev, newOrUpdatedItem]);
        }
      }

      setIsContributionDialogOpen(false);
      setEditingContribution(null);
      savingsContributionForm.reset();
      if (!editingContribution) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  };

  const handleDeleteContribution = async (id: string) => {
    if (!user?.id || !supabase || !setSavingsContributions) {
      toast.error("Vous devez être connecté pour effectuer cette action.");
      return;
    }
    const { error } = await supabase
      .from("savings_contributions")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Versement d'épargne supprimé avec succès !");
      setSavingsContributions((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div>
      {showConfetti && <Confetti width={width} height={height} />}
      <h1 className="text-4xl font-bold mb-8">Épargne</h1>

      {hasActiveCollaboration && (
        <Alert className="mb-8">
          <Users className="h-4 w-4" />
          <AlertTitle>Objectif synchronisé</AlertTitle>
          <AlertDescription>
            Votre objectif d'épargne est synchronisé avec vos collaborateurs.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        {data?.loading ? (
          <div className="w-1/2">
            <SavingsGoalCardSkeleton />
          </div>
        ) : (
          <div className="w-1/2">
            {data?.supabase && data?.setProfile && (
              <SavingsGoalCard
                user={data?.user || null}
                profile={data?.profile || null}
                incomes={data?.incomes || []}
                supabase={data.supabase}
                setProfile={data.setProfile}
              />
            )}
          </div>
        )}

        {data?.loading ? (
          <div className="w-1/2">
            <SavingsProgressCardSkeleton />
          </div>
        ) : (
          <div className="w-1/2">
            <SavingsProgressCard
              totalMonthlyIncome={totalMonthlyIncome}
              savingsGoalPercentage={
                data?.profile?.savings_goal_percentage ?? 10
              }
              savingsContributions={savingsContributions || []}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end mb-4">
        <Dialog
          open={isContributionDialogOpen}
          onOpenChange={setIsContributionDialogOpen}
        >
          <DialogTrigger asChild>
            <Button onClick={handleAddContributionClick}>
              <div className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un versement
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingContribution
                  ? "Modifier le versement"
                  : "Ajouter un nouveau versement"}
              </DialogTitle>
            </DialogHeader>
            <GamifiedSavingsForm
              form={savingsContributionForm}
              onSubmit={onSubmitContribution}
              contributorOptions={(beneficiaries || []).map((b) => ({
                value: b.id,
                label: `${b.first_name} ${b.last_name || ""}`.trim(),
                avatar_url: b.avatar_url || null,
              }))}
              editingContribution={editingContribution}
              canShare={(data?.collaborations?.length || 0) > 0}
              supabase={supabase!} // Passer la prop supabase
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des versements</CardTitle>
          <div className="flex items-center gap-4 mt-4">
            <Input
              placeholder="Rechercher par type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">Afficher:</span>
              <Select
                value={
                  showAllContributions ? "all" : contributionsPerPage.toString()
                }
                onValueChange={(value) => {
                  if (value === "all") {
                    setShowAllContributions(true);
                    setCurrentPage(1);
                  } else {
                    setShowAllContributions(false);
                    setContributionsPerPage(Number(value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="all">Toutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              {data?.loading ? (
                [...Array(3)].map((_, i) => (
                  <SavingsContributionListItemSkeleton key={i} />
                ))
              ) : paginatedContributions.length > 0 ? (
                paginatedContributions.map((contribution) => (
                  <SavingsContributionListItem
                    key={contribution.id}
                    contribution={contribution}
                    onEditClick={() =>
                      handleEditContributionClick(contribution)
                    }
                    onDelete={() => handleDeleteContribution(contribution.id)}
                    currentUserId={user?.id || null}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Aucun versement trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {filteredContributions.length > 0 && !showAllContributions && (
          <div className="flex justify-center items-center gap-4 pt-4">
            <Button
              variant={"outline"}
              size={"sm"}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </span>
            <Button
              variant={"outline"}
              size={"sm"}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default Savings;
