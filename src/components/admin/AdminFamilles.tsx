import React, { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useData } from "../../context/data-context-utils";
import type { IFamille } from "../../types";
import AdminGenericTable from "./AdminGenericTable";
import AdminReferenceForm from "./AdminReferenceForm";

const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  color: z
    .string()
    .regex(
      /^#[0-9a-fA-F]{6}$/,
      "La couleur doit être un code hexadécimal valide (ex: #RRGGBB)."
    )
    .optional(),
});

const AdminFamilles: React.FC = () => {
  const data = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFamille, setEditingFamille] = useState<IFamille | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!data) {
    return null; // Ou un indicateur de chargement/erreur
  }

  const {
    supabase,
    familles,
    addFamille,
    updateFamille,
    deleteFamille,
    loading: dataLoading,
  } = data;

  const handleDeleteFamille = async (id: string) => {
    setIsSubmitting(true);
    try {
      // Vérifier si des enseignes sont liées à cette famille
      const { count, error: countError } = await supabase
        .from("enseignes")
        .select("id", { count: "exact" })
        .eq("family_id", id);

      if (countError) {
        throw countError;
      }

      if (count && count > 0) {
        toast.error(
          `Impossible de supprimer cette famille. ${count} enseigne(s) y sont encore liées. Veuillez d'abord les réaffecter ou les supprimer.`
        );
        return;
      }

      const { error } = await supabase.from("familles").delete().eq("id", id);
      if (error) {
        toast.error("Erreur lors de la suppression de la famille.");
      } else {
        toast.success("Famille supprimée avec succès !");
        deleteFamille(id);
      }
    } catch (error: unknown) {
      console.error("Erreur lors de la suppression de la famille:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur inattendue est survenue lors de la suppression.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDialog = (famille?: IFamille) => {
    setEditingFamille(famille || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingFamille(null);
  };

  const columns = [
    {
      key: "name",
      header: "Nom",
      sortable: true,
      render: (famille: IFamille) => (
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded-full border"
            style={{ backgroundColor: famille.color }}
          ></div>
          <span>{famille.name}</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminGenericTable
        data={familles || []}
        columns={columns}
        title="Familles"
        searchPlaceholder="Rechercher une famille..."
        emptyMessage="Aucune famille trouvée."
        loadingMessage="Chargement des familles..."
        onAdd={() => handleOpenDialog()}
        onEdit={handleOpenDialog}
        onDelete={handleDeleteFamille}
        isSubmitting={isSubmitting}
        loading={dataLoading}
      />

      <AdminReferenceForm
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        editingItem={editingFamille}
        schema={formSchema}
        tableName="familles"
        addContextFn={addFamille}
        updateContextFn={updateFamille}
        dialogTitle={
          editingFamille ? "Modifier la famille" : "Ajouter une famille"
        }
      />
    </>
  );
};

export default AdminFamilles;
