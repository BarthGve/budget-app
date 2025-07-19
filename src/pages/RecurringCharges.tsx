import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Wallet,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardSummaryCardSkeleton } from "../components/dashboard/DashboardSummaryCardSkeleton";
import { RecurringChargeCardSkeleton } from "../components/recurringCharges/RecurringChargeCardSkeleton";
import RecurringChargeForm from "../components/recurringCharges/RecurringChargeForm";
import { RecurringChargeListItem } from "../components/recurringCharges/RecurringChargeListItem";
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
import { MiniBarChart } from "../components/ui/MiniBarChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { SummaryCard } from "../components/ui/SummaryCard";
import { Table, TableBody } from "../components/ui/table";
import { useData } from "../context/data-context-utils";
import type {
  Beneficiary,
  Profile,
  RecurringCharge as TRecurringCharge,
} from "../types";

// Define the enriched recurring charge type
interface EnrichedRecurringCharge extends TRecurringCharge {
  categoryColor: string;
  beneficiaries?: Beneficiary;
  profiles?: Profile;
}

// Function to get a consistent color for each category
const getCategoryColor = (categoryName: string) => {
  const blueShades = [
    "#4299E1", // blue-500
    "#63B3ED", // blue-400
    "#3182CE", // blue-600
    "#2B6CB0", // blue-700
    "#90CDF4", // blue-300
    "#C3DAFE", // blue-200
    "#1A365D", // blue-900
    "#2C5282", // blue-800
  ];
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % blueShades.length);
  return blueShades[index];
};

export const RecurringCharges: React.FC = () => {
  const dataContext = useData();
  const [editingCharge, setEditingCharge] = useState<
    TRecurringCharge | undefined
  >(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [chargesPerPage, setChargesPerPage] = useState(10);
  const [showAllCharges, setShowAllCharges] = useState(false);

  // Extract data from context with fallback values to ensure hooks are always called
  const {
    user,
    recurringCharges = [],
    supabase,
    beneficiaries = [],
    chargeCategories = [],
    collaboratorProfiles = [],
    collaborations = [],
    loading: dataContextLoading,
    addRecurringCharge,
    updateRecurringCharge,
    deleteRecurringCharge: deleteRecurringChargeContext,
  } = dataContext || {};

  const totalMonthlyCharges = useMemo(() => {
    return recurringCharges.reduce((sum: number, charge: TRecurringCharge) => {
      if (charge.frequency === "monthly") return sum + charge.amount;
      if (charge.frequency === "quarterly") return sum + charge.amount / 3;
      if (charge.frequency === "annually") return sum + charge.amount / 12;
      return sum;
    }, 0);
  }, [recurringCharges]);

  const totalAnnualCharges = useMemo(() => {
    return recurringCharges.reduce((sum: number, charge: TRecurringCharge) => {
      if (charge.frequency === "monthly") return sum + charge.amount * 12;
      if (charge.frequency === "quarterly") return sum + charge.amount * 4;
      if (charge.frequency === "annually") return sum + charge.amount;
      return sum;
    }, 0);
  }, [recurringCharges]);

  const handleEdit = useCallback((charge: TRecurringCharge) => {
    setEditingCharge(charge);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (chargeId: string) => {
      if (!user || !supabase || !deleteRecurringChargeContext) return;
      const { error } = await supabase
        .from("recurring_charges")
        .delete()
        .eq("id", chargeId);

      if (error) {
        toast.error(
          "Erreur lors de la suppression de la charge: " + error.message
        );
      } else {
        toast.success("Charge récurrente supprimée avec succès !");
        deleteRecurringChargeContext(chargeId);
      }
    },
    [user, supabase, deleteRecurringChargeContext]
  );

  const filteredCharges = useMemo(() => {
    return recurringCharges
      .map((charge) => {
        const category = chargeCategories.find(
          (c) => c.name === charge.category
        );

        const enrichedCharge: EnrichedRecurringCharge = {
          ...charge,
          categoryColor: category?.color || "#A0A0A0", // Default color if not found
        };

        if (charge.beneficiary_id) {
          const foundBeneficiary = beneficiaries.find(
            (b) => b.id === charge.beneficiary_id
          );
          if (foundBeneficiary) {
            enrichedCharge.beneficiaries = foundBeneficiary;
          } else {
            const foundProfile = collaboratorProfiles.find(
              (p) => p.id === charge.beneficiary_id
            );
            if (foundProfile) {
              enrichedCharge.profiles = foundProfile;
            }
          }
        } else if (charge.user_id === user?.id && user?.user_metadata) {
          // Helper function to safely extract string values from user metadata
          const getStringOrNull = (value: unknown): string | null => {
            if (typeof value === "string" && value.trim() !== "") {
              return value;
            }
            return null;
          };

          enrichedCharge.beneficiaries = {
            id: user.id,
            created_at: new Date().toISOString(),
            user_id: user.id,
            first_name: getStringOrNull(user.user_metadata.firstName) || "Moi",
            last_name: getStringOrNull(user.user_metadata.lastName),
            avatar_url: getStringOrNull(user.user_metadata.avatar_url),
          };
        }

        return enrichedCharge;
      })
      .filter((charge) =>
        charge.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(
        (charge) =>
          categoryFilter === "all" || charge.category === categoryFilter
      );
  }, [
    recurringCharges,
    searchTerm,
    categoryFilter,
    beneficiaries,
    collaboratorProfiles,
    user,
    chargeCategories,
  ]);

  const paginatedCharges = useMemo(() => {
    if (showAllCharges) {
      return filteredCharges;
    }
    const startIndex = (currentPage - 1) * chargesPerPage;
    return filteredCharges.slice(startIndex, startIndex + chargesPerPage);
  }, [filteredCharges, currentPage, chargesPerPage, showAllCharges]);

  const totalPages = useMemo(() => {
    if (showAllCharges) {
      return 1; // Only one "page" if all charges are shown
    }
    return Math.ceil(filteredCharges.length / chargesPerPage);
  }, [filteredCharges, chargesPerPage, showAllCharges]);

  const monthlyChartData = useMemo(() => {
    const aggregated: { [key: string]: number } = {};
    recurringCharges.forEach((charge) => {
      let amount = 0;
      switch (charge.frequency) {
        case "monthly":
          amount = charge.amount;
          break;
        case "quarterly":
          amount = charge.amount / 3;
          break;
        case "annually":
          amount = charge.amount / 12;
          break;
      }
      aggregated[charge.category] = (aggregated[charge.category] || 0) + amount;
    });
    return Object.keys(aggregated).map((category) => ({
      category,
      totalAmount: parseFloat(aggregated[category].toFixed(2)),
      color: getCategoryColor(category),
    }));
  }, [recurringCharges]);

  // Handle the case where useData returns null - moved after all hooks
  if (!dataContext) {
    return <div>Loading...</div>;
  }

  const handleAddOrUpdateCharge = async (data: {
    title: string;
    amount: number;
    category: string;
    is_shared: boolean;
    external_logo_url?: string | null;
    icon_path?: string | null;
    frequency?: "monthly" | "quarterly" | "annually";
    description?: string | null;
    beneficiary_id?: string | null;
    enseigne_id?: string | null;
  }) => {
    if (!user || !supabase || !updateRecurringCharge || !addRecurringCharge) {
      toast.error(
        "Vous devez être connecté pour ajouter ou modifier une charge récurrente."
      );
      return;
    }

    const chargeData = { ...data };

    if (editingCharge) {
      const { error } = await supabase
        .from("recurring_charges")
        .update(chargeData)
        .eq("id", editingCharge.id);

      if (error) {
        toast.error(
          "Erreur lors de la modification de la charge: " + error.message
        );
      } else {
        toast.success("Charge récurrente modifiée avec succès !");
        setEditingCharge(undefined);
        setIsFormOpen(false);
        updateRecurringCharge({
          ...chargeData,
          id: editingCharge.id,
          user_id: user.id,
          created_at: editingCharge.created_at,
        } as TRecurringCharge);
      }
    } else {
      const { data, error } = await supabase
        .from("recurring_charges")
        .insert({ ...chargeData, user_id: user.id })
        .select();

      if (error) {
        toast.error("Erreur lors de l'ajout de la charge: " + error.message);
      } else {
        toast.success("Charge récurrente ajoutée avec succès !");
        setIsFormOpen(false);
        if (data && data.length > 0) {
          addRecurringCharge(data[0] as TRecurringCharge);
        }
      }
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">
        Gestion des Charges Récurrentes
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {dataContextLoading ? (
          <>
            <DashboardSummaryCardSkeleton />
            <DashboardSummaryCardSkeleton />
          </>
        ) : (
          <>
            <SummaryCard
              title="Total Mensuel"
              value={totalMonthlyCharges.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
              icon={<Wallet className="h-5 w-5" />}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
              rightContent={
                <MiniBarChart
                  data={monthlyChartData}
                  width="100px"
                  height="50px"
                />
              }
            />
            <SummaryCard
              title="Total Annuel"
              value={totalAnnualCharges.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
              icon={<CalendarDays className="h-5 w-5" />}
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
            />
          </>
        )}
      </div>

      <div className="flex justify-end mb-4">
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCharge(undefined)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une nouvelle charge
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingCharge
                  ? "Modifier une charge"
                  : "Ajouter une nouvelle charge"}
              </DialogTitle>
            </DialogHeader>
            <RecurringChargeForm
              onSubmit={handleAddOrUpdateCharge}
              initialData={editingCharge}
              hasActiveCollaborations={
                collaborations.filter((c) => c.status === "accepted").length > 0
              }
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les Charges</CardTitle>
          <div className="flex items-center gap-4 mt-4">
            <Input
              placeholder="Rechercher par titre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {chargeCategories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">Afficher:</span>
              <Select
                value={showAllCharges ? "all" : chargesPerPage.toString()}
                onValueChange={(value) => {
                  if (value === "all") {
                    setShowAllCharges(true);
                    setCurrentPage(1);
                  } else {
                    setShowAllCharges(false);
                    setChargesPerPage(Number(value));
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
          {dataContextLoading ? (
            <Table>
              <TableBody>
                {[...Array(chargesPerPage)].map((_, i) => (
                  <RecurringChargeCardSkeleton key={i} />
                ))}
              </TableBody>
            </Table>
          ) : paginatedCharges.length > 0 ? (
            <Table>
              <TableBody>
                {paginatedCharges.map((charge) => (
                  <RecurringChargeListItem
                    key={charge.id}
                    charge={charge}
                    currentUserId={user?.id || ""}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune charge récurrente trouvée.
            </p>
          )}
        </CardContent>
        {filteredCharges.length > 0 && !showAllCharges && (
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
};

export default RecurringCharges;
