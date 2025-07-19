import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Loader2, Euro, Share2 } from "lucide-react";

import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";

import type { Income } from "../../types/index";
import { incomeSchema } from "./incomeSchema";

interface IncomeFormProps {
  form: UseFormReturn<z.infer<typeof incomeSchema>>;
  onSubmit: (values: z.infer<typeof incomeSchema>) => void;
  contributorOptions: {
    value: string;
    label: string;
    avatar_url?: string | null;
  }[];
  editingIncome: Income | null;
  canShare: boolean;
}

export function IncomeForm({
  form,
  onSubmit,
  contributorOptions,
  editingIncome,
  canShare,
}: IncomeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingIncome) {
      form.reset(editingIncome);
    }
  }, [editingIncome, form]);

  const handleSubmit = async (values: z.infer<typeof incomeSchema>) => {
    setIsSubmitting(true);
    await onSubmit(values);
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card className="border-purple-100 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Euro className="w-4 h-4 text-green-600" />
              </div>
              Détails du Revenu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="source_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Source du revenu
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Salaire, Vente..."
                        className="py-3 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Montant
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="2500"
                          className="pl-4 py-3 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                          {...field}
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                          €
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contributor_user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Contributeur
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="py-3 border-gray-200 focus:border-purple-300">
                          <SelectValue placeholder="Sélectionnez un contributeur" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contributorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6 flex-shrink-0">
                                <AvatarImage
                                  src={
                                    option.avatar_url ||
                                    "https://github.com/shadcn.png"
                                  }
                                />
                                <AvatarFallback>
                                  {option.label.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{option.label}</span>
                            </div>
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
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Fréquence
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="py-3 border-gray-200 focus:border-purple-300">
                          <SelectValue placeholder="Sélectionnez une fréquence" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Mensuel">🗓️ Mensuel</SelectItem>
                        <SelectItem value="Ponctuel">🎯 Ponctuel</SelectItem>
                        <SelectItem value="Annuel">📆 Annuel</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {canShare && (
              <FormField
                control={form.control}
                name="is_shared"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Share2 className="h-3 w-3 text-purple-600" />
                        </div>
                        Partager ce revenu
                      </FormLabel>
                      <p className="text-sm text-muted-foreground pl-8">
                        Rendre ce revenu visible par vos collaborateurs.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editingIncome ? "Mettre à jour le revenu" : "Ajouter le revenu"}
        </Button>
      </form>
    </Form>
  );
}
