import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import AdminGenericTable from "../components/admin/AdminGenericTable";
import { useData } from "../context/data-context-utils";
import type { ChargeCategory } from "../types";
import AdminReferenceForm from "../components/admin/AdminReferenceForm";

const categorySchema = z.object({
  name: z.string().min(1, "Le nom de la catégorie est requis."),
  color: z
    .string()
    .regex(
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      "La couleur doit être un code hexadécimal valide (ex: #RRGGBB)."
    ),
});

function AdminCategories() {
  const data = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ChargeCategory | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!data) {
    return <div>Loading...</div>;
  }

  const {
    supabase,
    chargeCategories,
    addChargeCategory,
    updateChargeCategory,
    deleteChargeCategory,
  } = data;

  const handleOpenModal = (category?: ChargeCategory) => {
    setEditingCategory(category || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("charge_categories")
        .delete()
        .eq("id", categoryId);

      if (error) {
        toast.error(`Erreur lors de la suppression: ${error.message}`);
      } else {
        toast.success("Catégorie supprimée avec succès !");
        deleteChargeCategory(categoryId);
      }
    } catch (error: unknown) {
      toast.error(
        `Une erreur inattendue est survenue: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Nom",
      sortable: true,
      render: (category: ChargeCategory) => (
        <div className="font-medium flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          {category.name}
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminGenericTable
        data={chargeCategories}
        columns={columns}
        title="Catégories de Charges"
        searchPlaceholder="Rechercher une catégorie..."
        emptyMessage="Aucune catégorie trouvée."
        loadingMessage="Chargement des catégories..."
        onAdd={() => handleOpenModal()}
        onEdit={handleOpenModal}
        onDelete={handleDeleteCategory}
        isSubmitting={isSubmitting}
        loading={data.loading}
      />

      <AdminReferenceForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingItem={editingCategory}
        schema={categorySchema}
        tableName="charge_categories"
        addContextFn={addChargeCategory}
        updateContextFn={updateChargeCategory}
        dialogTitle={editingCategory ? "Modifier la catégorie" : "Ajouter une catégorie"}
      />
    </>
  );
}

export default AdminCategories;