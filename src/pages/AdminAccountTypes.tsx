import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import AdminGenericTable from "../components/admin/AdminGenericTable";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { useData } from "../context/data-context-utils";
import type { AccountType } from "../types";

const accountTypeSchema = z.object({
  name: z.string().min(1, "Le nom du type de compte est requis."),
});

type AccountTypeFormValues = z.infer<typeof accountTypeSchema>;

function AdminAccountTypes() {
  const data = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccountType, setEditingAccountType] =
    useState<AccountType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AccountTypeFormValues>({
    resolver: zodResolver(accountTypeSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (editingAccountType) {
      form.reset({ name: editingAccountType.name });
    } else {
      form.reset({ name: "" });
    }
  }, [editingAccountType, form]);

  if (!data) {
    return <div>Loading...</div>;
  }

  const {
    supabase,
    accountTypes,
    addAccountType,
    updateAccountType,
    deleteAccountType,
  } = data;

  const handleOpenModal = (accountType?: AccountType) => {
    setEditingAccountType(accountType || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccountType(null);
    form.reset();
  };

  const onSubmit = async (values: AccountTypeFormValues) => {
    setIsSubmitting(true);
    try {
      // Assuming user is always authenticated in admin section, or handle it globally
      // if (!user?.id) {
      //   toast.error("Utilisateur non authentifié.");
      //   return;
      // }

      if (editingAccountType) {
        const { data, error } = await supabase
          .from("account_types")
          .update({ name: values.name })
          .eq("id", editingAccountType.id)
          .select()
          .single();

        if (error) {
          toast.error(`Erreur lors de la mise à jour: ${error.message}`);
        } else {
          toast.success("Type de compte mis à jour avec succès !");
          updateAccountType(data as AccountType);
          handleCloseModal();
        }
      } else {
        const { data, error } = await supabase
          .from("account_types")
          .insert({ name: values.name })
          .select()
          .single();

        if (error) {
          toast.error(`Erreur lors de l'ajout: ${error.message}`);
        } else {
          toast.success("Type de compte ajouté avec succès !");
          addAccountType(data as AccountType);
          handleCloseModal();
        }
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

  const handleDeleteAccountType = async (accountTypeId: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("account_types")
        .delete()
        .eq("id", accountTypeId);

      if (error) {
        toast.error(`Erreur lors de la suppression: ${error.message}`);
      } else {
        toast.success("Type de compte supprimé avec succès !");
        deleteAccountType(accountTypeId);
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
      render: (accountType: AccountType) => accountType.name,
    },
  ];

  return (
    <>
      <AdminGenericTable
        data={accountTypes}
        columns={columns}
        title="Types de Compte d'Épargne"
        searchPlaceholder="Rechercher un type de compte..."
        emptyMessage="Aucun type de compte trouvé."
        loadingMessage="Chargement des types de compte..."
        onAdd={() => handleOpenModal()}
        onEdit={handleOpenModal}
        onDelete={handleDeleteAccountType}
        isSubmitting={isSubmitting}
        loading={!accountTypes}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingAccountType
                ? "Modifier le type de compte"
                : "Ajouter un type de compte"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<AccountTypeFormValues, "name">;
                }) => (
                  <FormItem>
                    <FormLabel>Nom du type de compte</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingAccountType ? "Modifier" : "Ajouter"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AdminAccountTypes;
