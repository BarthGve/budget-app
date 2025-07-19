import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useData } from "../../context/data-context-utils";
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

type ReferenceFormData = {
  id?: string;
  name: string;
  color?: string;
};

interface AdminReferenceFormProps<T extends ReferenceFormData> {
  isOpen: boolean;
  onClose: () => void;
  editingItem: T | null;
  schema: z.ZodSchema<ReferenceFormData>;
  tableName: string;
  addContextFn: (item: T) => void;
  updateContextFn: (item: T) => void;
  dialogTitle: string;
}

function AdminReferenceForm<T extends ReferenceFormData>({
  isOpen,
  onClose,
  editingItem,
  schema,
  tableName,
  addContextFn,
  updateContextFn,
  dialogTitle,
}: AdminReferenceFormProps<T>) {
  const data = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues: editingItem || { name: "", color: "#CCCCCC" },
  });

  React.useEffect(() => {
    if (editingItem) {
      form.reset(editingItem);
    } else {
      form.reset({ name: "", color: "#CCCCCC" });
    }
  }, [editingItem, form]);

  if (!data) {
    return null; // Ou un indicateur de chargement/erreur
  }

  const { supabase } = data;

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    try {
      const payload = { name: values.name, color: values.color };

      if (editingItem) {
        const { data, error } = await supabase
          .from(tableName)
          .update(payload)
          .eq("id", editingItem.id)
          .select()
          .single();

        if (error) {
          toast.error(`Erreur lors de la mise à jour: ${error.message}`);
        } else {
          toast.success("Élément mis à jour avec succès !");
          updateContextFn(data as T);
          onClose();
        }
      } else {
        const { data, error } = await supabase
          .from(tableName)
          .insert([payload])
          .select()
          .single();

        if (error) {
          toast.error(`Erreur lors de l'ajout: ${error.message}`);
        } else {
          toast.success("Élément ajouté avec succès !");
          addContextFn(data as T);
          onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-3/4">
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
                name="color"
                render={({ field }) => (
                  <FormItem className="w-1/4">
                    <FormLabel>Couleur</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingItem ? "Modifier" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default AdminReferenceForm;
