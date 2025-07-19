import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import { zodResolver } from "@hookform/resolvers/zod";
import { BanknoteArrowUp, CakeSlice, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { DashboardSummaryCardSkeleton } from "../components/dashboard/DashboardSummaryCardSkeleton";
import { IncomeCardSkeleton } from "../components/incomes/IncomeCardSkeleton";
import { IncomeForm } from "../components/incomes/IncomeForm";
import { IncomeListItem } from "../components/incomes/IncomeListItem";
import { incomeSchema } from "../components/incomes/incomeSchema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { SummaryCard } from "../components/ui/SummaryCard";
import { Table, TableBody } from "../components/ui/table";
import { useData } from "../context/data-context-utils";
import type { Collaboration, Income, Profile } from "../types/index";

function Incomes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const data = useData();
  const canShare = useMemo(() => {
    return data?.collaborations?.some((c) => c.status === "accepted") ?? false;
  }, [data?.collaborations]);

  const incomes = useMemo(() => data?.incomes || [], [data?.incomes]);
  const loading = data?.loading ?? true;
  const user = data?.user || null;
  const supabase = data?.supabase || null;
  const addIncome = data?.addIncome || (() => {});
  const updateIncome = data?.updateIncome || (() => {});
  const deleteIncome = data?.deleteIncome || (() => {});

  const form = useForm<z.infer<typeof incomeSchema>>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      source_name: "",
      amount: 0,
      contributor_user_id: user?.id || "",
      frequency: "Mensuel",
      is_shared: false,
    },
  });

  const contributorOptions = useMemo(() => {
    if (!data?.user) return [];

    const uniqueContributorIds = new Set<string>();
    const options: {
      value: string;
      label: string;
      avatar_url?: string | null;
    }[] = [];

    // Add current user
    if (data.user.id) {
      options.push({
        value: data.user.id,
        label: "Moi",
        avatar_url: (data.user.user_metadata?.avatar_url as string) || null,
      });
      uniqueContributorIds.add(data.user.id);
    }

    // Add collaborators, ensuring uniqueness
    data.collaborations?.forEach((collab: Collaboration) => {
      let collaboratorProfile: Profile | null = null;
      if (collab.inviter_id === data.user?.id) {
        collaboratorProfile = collab.invitee;
      } else if (collab.invitee_id === data.user?.id) {
        collaboratorProfile = collab.inviter;
      }

      if (
        collaboratorProfile &&
        !uniqueContributorIds.has(collaboratorProfile.id)
      ) {
        options.push({
          value: collaboratorProfile.id,
          label: collaboratorProfile.first_name
            ? `${collaboratorProfile.first_name} ${
                collaboratorProfile.last_name || ""
              }`.trim()
            : collaboratorProfile.email,
          avatar_url: collaboratorProfile.avatar_url || null,
        });
        uniqueContributorIds.add(collaboratorProfile.id);
      }
    });

    return options;
  }, [data?.user, data?.collaborations]);

  const { totalMonthlyIncome, yourPercentage } = useMemo(() => {
    if (!data || !data.incomes || !data.user)
      return { totalMonthlyIncome: 0, yourMonthlyIncome: 0, yourPercentage: 0 };
    const totalMonthlyIncome = data.incomes
      .filter((income: Income) => income.frequency === "Mensuel")
      .reduce((acc: number, income: Income) => acc + income.amount, 0);

    const yourMonthlyIncome = data.incomes
      .filter(
        (income: Income) =>
          income.frequency === "Mensuel" &&
          income.contributor_user_id === data.user?.id
      )
      .reduce((acc: number, income: Income) => acc + income.amount, 0);

    const yourPercentage =
      totalMonthlyIncome > 0
        ? (yourMonthlyIncome / totalMonthlyIncome) * 100
        : 0;

    return { totalMonthlyIncome, yourMonthlyIncome, yourPercentage };
  }, [data]);

  useEffect(() => {
    if (incomes && incomes.length > 0) {
      const ids = incomes.map((income) => income.id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        const duplicateIds = ids.filter(
          (id, index) => ids.indexOf(id) !== index
        );
        console.warn("Duplicate income IDs found:", [...new Set(duplicateIds)]);
      }
    }
  }, [incomes]);

  if (!data || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Chargement des données ou utilisateur non connecté...
      </div>
    );
  }

  const handleEditClick = (income: Income) => {
    if (!user || !user.id) {
      toast.error("Utilisateur non connecté.");
      return;
    }
    setEditingIncome(income);
    form.reset({
      ...income,
      contributor_user_id: income.contributor_user_id || user.id,
    });
    setIsDialogOpen(true);
  };

  const handleAddClick = () => {
    if (!user || !user.id) {
      toast.error("Utilisateur non connecté.");
      return;
    }
    setEditingIncome(null);
    // form.reset({
    //   source_name: "",
    //   amount: 0,
    //   contributor_user_id: user.id,
    //   frequency: "Mensuel",
    // });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof incomeSchema>) => {
    if (!user || !user.id) {
      toast.error("Vous devez être connecté pour effectuer cette action.");
      return;
    }

    if (!supabase) {
      toast.error("Erreur de connexion à la base de données.");
      return;
    }

    let incomeToProcess: Income | null = null;
    let error: unknown = null;

    if (editingIncome) {
      // Update existing income
      const { data, error: updateError } = await supabase
        .from("incomes")
        .update(values)
        .eq("id", editingIncome.id)
        .select("*, profiles(first_name, last_name, email, avatar_url)")
        .single();

      incomeToProcess = data;
      error = updateError;
      console.log("Income to process (update):", incomeToProcess);

      if (!error) {
        toast.success("Revenu mis à jour avec succès !");
        updateIncome(incomeToProcess as Income);
      }
    } else {
      // Add new income
      const { data, error: insertError } = await supabase
        .from("incomes")
        .insert({ ...values, user_id: user.id })
        .select("*, profiles(first_name, last_name, email, avatar_url)")
        .single();

      incomeToProcess = data;
      error = insertError;
      console.log("Income to process (insert):", incomeToProcess);

      if (!error) {
        toast.success("Revenu ajouté avec succès !");
        addIncome(incomeToProcess as Income);
      }
    }

    if (error) {
      toast.error((error as { message: string }).message);
    } else {
      setIsDialogOpen(false);
      setEditingIncome(null);
    }
    form.reset();
  };

  const handleDelete = async (incomeId: string) => {
    if (!user || !user.id) {
      toast.error("Vous devez être connecté pour effectuer cette action.");
      return;
    }

    if (!supabase) {
      toast.error("Erreur de connexion à la base de données.");
      return;
    }

    const { error } = await supabase
      .from("incomes")
      .delete()
      .eq("id", incomeId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Revenu supprimé avec succès !");
      deleteIncome(incomeId);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Gestion des Revenus</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {loading ? (
          <>
            <DashboardSummaryCardSkeleton />
            <DashboardSummaryCardSkeleton />
          </>
        ) : (
          <>
            <SummaryCard
              title="Revenu Total Mensuel"
              value={totalMonthlyIncome.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
              icon={<BanknoteArrowUp className="h-5 w-5" />}
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
            />
            <SummaryCard
              title="Votre Part"
              value={`${yourPercentage.toFixed(2)}%`}
              icon={<CakeSlice className="h-5 w-5" />}
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
              Ajouter un revenu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingIncome
                  ? "Modifier le revenu"
                  : "Ajouter un nouveau revenu"}
              </DialogTitle>
            </DialogHeader>
            <IncomeForm
              form={form}
              onSubmit={onSubmit}
              contributorOptions={contributorOptions}
              editingIncome={editingIncome}
              canShare={canShare}
              key={editingIncome?.id || "new"}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Revenus</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-4">
              {[...Array(3)].map((_, i) => (
                <IncomeCardSkeleton key={i} />
              ))}
            </div>
          ) : incomes.length > 0 ? (
            <Table>
              <TableBody>
                {incomes.map((income: Income) => (
                  <IncomeListItem
                    key={income.id}
                    income={income}
                    onEditClick={handleEditClick}
                    onDelete={handleDelete}
                    currentUserId={user?.id ?? null}
                  />
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucun revenu trouvé.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Incomes;
