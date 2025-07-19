import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useData } from "../../context/data-context-utils";
import type { IEnseigne } from "../../types";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import AdminGenericTable from "./AdminGenericTable";

const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  family_id: z.string().uuid("Veuillez sélectionner une famille."),
  domain: z.string().optional().or(z.literal("")),
});

type EnseigneFormValues = z.infer<typeof formSchema>;

const AdminEnseignes: React.FC = () => {
  const data = useData();
  const [enseignes, setEnseignes] = useState<IEnseigne[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEnseigne, setEditingEnseigne] = useState<IEnseigne | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchedLogoUrl, setFetchedLogoUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<EnseigneFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      family_id: "",
      domain: "",
    },
  });

  const { supabase, familles } = data || {};

  const fetchEnseignes = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("enseignes")
      .select("*, familles(name, color)");
    if (error) {
      toast.error("Erreur lors du chargement des enseignes.");
      console.error(error);
    } else {
      setEnseignes(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchEnseignes();
  }, [fetchEnseignes]);

  const filteredEnseignes = useMemo(() => {
    if (!searchTerm) {
      return enseignes;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return enseignes.filter(
      (enseigne) =>
        enseigne.name.toLowerCase().includes(lowercasedFilter) ||
        enseigne.familles.name.toLowerCase().includes(lowercasedFilter)
    );
  }, [enseignes, searchTerm]);

  if (!data || !supabase) {
    return null; // Ou un indicateur de chargement/erreur
  }

  const fetchLogo = async (domain: string) => {
    try {
      const { data: fetchedData, error } = await supabase.functions.invoke<{
        logoUrl?: string;
      }>("fetch-organization-logo", { body: { domain } });

      if (error || !fetchedData?.logoUrl) {
        setFetchedLogoUrl(null);
        toast[error ? "error" : "info"](
          error
            ? "Impossible de récupérer le logo pour ce domaine."
            : "Aucun logo trouvé pour ce domaine."
        );
        return;
      }

      setFetchedLogoUrl(fetchedData.logoUrl);
    } catch (err) {
      console.error("Unexpected error fetching logo:", err);
      setFetchedLogoUrl(null);
      toast.error(
        "Une erreur inattendue est survenue lors de la récupération du logo."
      );
    }
  };

  const handleAddEditEnseigne = async (values: EnseigneFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        family_id: values.family_id,
        external_logo_url: fetchedLogoUrl || null, // Utiliser fetchedLogoUrl ici
        icon_path: null, // Supprimé du formulaire, donc toujours null
        domain: values.domain || null,
      };

      if (editingEnseigne) {
        const { error } = await supabase
          .from("enseignes")
          .update(payload)
          .eq("id", editingEnseigne.id);
        if (error) {
          toast.error("Erreur lors de la mise à jour de l'enseigne.");
        } else {
          toast.success("Enseigne mise à jour avec succès !");
          fetchEnseignes();
          setIsDialogOpen(false);
        }
      } else {
        const { error } = await supabase.from("enseignes").insert([payload]);
        if (error) {
          toast.error("Erreur lors de l'ajout de l'enseigne.");
        } else {
          toast.success("Enseigne ajoutée avec succès !");
          fetchEnseignes();
          setIsDialogOpen(false);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEnseigne = async (id: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("enseignes").delete().eq("id", id);
      if (error) {
        toast.error("Erreur lors de la suppression de l'enseigne.");
      } else {
        toast.success("Enseigne supprimée avec succès !");
        fetchEnseignes();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDialog = (enseigne?: IEnseigne) => {
    setEditingEnseigne(enseigne || null);
    form.reset(
      enseigne
        ? {
            name: enseigne.name,
            family_id: enseigne.family_id,
            domain: enseigne.domain ?? "",
          }
        : { name: "", family_id: "", domain: "" }
    );
    setFetchedLogoUrl(enseigne?.external_logo_url || null);
    setIsDialogOpen(true);
  };

  const columns = [
    {
      key: "name",
      header: "Nom",
      sortable: true,
      render: (enseigne: IEnseigne) => enseigne.name,
    },
    {
      key: "family",
      header: "Famille",
      sortable: true,
      render: (enseigne: IEnseigne) => (
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded-full border"
            style={{ backgroundColor: enseigne.familles.color }}
          ></div>
          <span>{enseigne.familles.name}</span>
        </div>
      ),
    },
    {
      key: "logo",
      header: "Logo/Icône",
      render: (enseigne: IEnseigne) =>
        enseigne.external_logo_url ? (
          <img
            src={enseigne.external_logo_url}
            alt={enseigne.name}
            className="h-8 w-8 object-contain"
          />
        ) : enseigne.icon_path ? (
          <img
            src={enseigne.icon_path}
            alt={enseigne.name}
            className="h-8 w-8 object-contain"
          />
        ) : (
          <span className="text-muted-foreground">Aucun</span>
        ),
    },
  ];

  return (
    <>
      <AdminGenericTable
        data={filteredEnseignes}
        columns={columns}
        title="Enseignes"
        searchPlaceholder="Rechercher une enseigne par nom ou famille..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        emptyMessage="Aucune enseigne trouvée."
        loadingMessage="Chargement des enseignes..."
        onAdd={() => openDialog()}
        onEdit={openDialog}
        onDelete={handleDeleteEnseigne}
        isSubmitting={isSubmitting}
        loading={loading}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingEnseigne ? "Modifier l'enseigne" : "Ajouter une enseigne"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAddEditEnseigne)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<EnseigneFormValues, "name">;
                }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="family_id"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<EnseigneFormValues, "family_id">;
                }) => (
                  <FormItem>
                    <FormLabel>Famille</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une famille" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(familles || []).map((famille) => (
                          <SelectItem key={famille.id} value={famille.id}>
                            {famille.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="domain"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<EnseigneFormValues, "domain">;
                }) => (
                  <FormItem>
                    <FormLabel>Domaine de l'organisme (optionnel)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="exemple.com"
                        value={field.value ?? ""}
                        onBlur={async (e) => {
                          field.onBlur();
                          if (e.target.value) await fetchLogo(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {fetchedLogoUrl && (
                <div className="flex justify-center items-center mt-4">
                  <img
                    src={fetchedLogoUrl}
                    alt="Logo de l'organisme"
                    className="max-h-24 max-w-full object-contain"
                  />
                </div>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingEnseigne ? "Modifier" : "Ajouter"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminEnseignes;
