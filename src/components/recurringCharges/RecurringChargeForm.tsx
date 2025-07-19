import { zodResolver } from "@hookform/resolvers/zod";
import { SupabaseClient } from "@supabase/supabase-js";
import { Check, ChevronsUpDown, Euro, Clock, Share2, Building, User, FileText, Info } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useData } from "../../context/data-context-utils";
import { cn } from "../../lib/utils";
import type { Beneficiary, ChargeCategory } from "../../types/index";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { MultiStepForm } from "../ui/MultiStepForm";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";

interface IEnseigne {
  id: string;
  name: string;
  family_id: string;
  external_logo_url?: string | null;
  icon_path?: string | null;
  familles: { name: string; color: string };
}

const formSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est requis")
    .max(100, "Le titre est trop long"),
  external_logo_url: z.string().url().nullable().optional(),
  icon_path: z.string().nullable().optional(),
  amount: z.coerce
    .number()
    .min(0.01, "Le montant doit être supérieur à 0")
    .max(1000000, "Le montant est trop élevé"),
  frequency: z.enum(["monthly", "quarterly", "annually"], {
    message: "Veuillez sélectionner une fréquence",
  }),
  category: z.string().min(1, "La catégorie est requise"),
  description: z.string().nullable().optional(),
  beneficiary_id: z.string().uuid().nullable().optional(),
  enseigne_id: z.string().uuid().nullable().optional(),
  is_shared: z.boolean(),
});

type RecurringChargeFormValues = z.infer<typeof formSchema>;

interface RecurringChargeFormProps {
  onSubmit: (data: RecurringChargeFormValues) => void;
  initialData?: Partial<RecurringChargeFormValues>;
  hasActiveCollaborations: boolean;
}

const steps = [
  "Identification",
  "Conditions",
  "Détails",
];

const validationSteps: (keyof RecurringChargeFormValues)[][] = [
  ["title"],
  ["amount", "frequency"],
  ["description", "beneficiary_id", "is_shared"],
];

const RecurringChargeForm: React.FC<RecurringChargeFormProps> = ({
  onSubmit,
  initialData,
  hasActiveCollaborations,
}) => {
  const dataContext = useData();
  const [query, setQuery] = useState("");
  const [openEnseigne, setOpenEnseigne] = useState(false);
  const [enseignes, setEnseignes] = useState<IEnseigne[]>([]);
  const [, setLoadingEnseignes] = useState(true);

  const form = useForm<RecurringChargeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      frequency: "monthly",
      ...initialData,
      beneficiary_id: initialData?.beneficiary_id || null,
      is_shared: initialData?.is_shared || false,
    },
  });

  if (!dataContext) {
    throw new Error("DataContext is required");
  }

  const { beneficiaries, chargeCategories, supabase } = dataContext as {
    beneficiaries: Beneficiary[];
    chargeCategories: ChargeCategory[];
    supabase: SupabaseClient;
  };

  useEffect(() => {
    if (initialData) {
      form.reset({
        frequency: "monthly",
        ...initialData,
        beneficiary_id: initialData.beneficiary_id || null,
        is_shared: initialData.is_shared || false,
      });
    }
  }, [initialData, form]);

  useEffect(() => {
    const fetchEnseignes = async () => {
      setLoadingEnseignes(true);
      const { data, error } = await supabase
        .from("enseignes")
        .select("*, familles(name, color)");

      if (error) {
        console.error("Error fetching enseignes:", error);
        toast.error("Erreur lors du chargement des enseignes.");
      } else {
        setEnseignes((data as IEnseigne[]) || []);
      }
      setLoadingEnseignes(false);
    };

    fetchEnseignes();
  }, [supabase]);

  const filteredEnseignes = useMemo(() => {
    if (!enseignes) return [];
    const lowerCaseQuery = query.toLowerCase();
    return enseignes.filter(
      (enseigne) =>
        enseigne.name.toLowerCase().includes(lowerCaseQuery) ||
        (enseigne.familles &&
          enseigne.familles.name.toLowerCase().includes(lowerCaseQuery))
    );
  }, [enseignes, query]);

  const onSubmitForm = (values: RecurringChargeFormValues) => {
    const finalValues = { ...values };
    if (finalValues.beneficiary_id === dataContext.user?.id) {
      finalValues.beneficiary_id = null;
    }
    onSubmit(finalValues);
  };

  return (
    <TooltipProvider>
      <MultiStepForm
        form={form}
        onSubmit={onSubmitForm}
        steps={steps}
        validationSteps={validationSteps}
        submitButtonText={
          initialData ? "Mettre à jour la charge" : "Enregistrer la charge"
        }
        dialogTexts={{
          title: "Êtes-vous sûr ?",
          description: `Voulez-vous vraiment ${
            initialData ? "mettre à jour" : "enregistrer"
          } cette charge ?`,
          cancel: "Annuler",
          confirm: "Confirmer",
        }}
      >
        {(currentStep) => (
          <>
            {currentStep === 1 && (
              <Card className="border-purple-100 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Building className="w-4 h-4 text-purple-600" />
                    </div>
                    Identification du service
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Building className="w-4 h-4 text-green-600" />
                            Service
                          </FormLabel>
                          <Popover open={openEnseigne} onOpenChange={setOpenEnseigne}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between py-3 border-gray-200 hover:border-purple-300",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    <div className="flex items-center">
                                      {enseignes.find((e) => e.name === field.value)?.icon_path ||
                                      enseignes.find((e) => e.name === field.value)?.external_logo_url ? (
                                        <img
                                          src={
                                            enseignes.find((e) => e.name === field.value)?.icon_path ||
                                            enseignes.find((e) => e.name === field.value)?.external_logo_url ||
                                            undefined
                                          }
                                          alt={field.value}
                                          className="w-6 h-6 mr-3 rounded-full object-contain"
                                        />
                                      ) : null}
                                      {field.value}
                                    </div>
                                  ) : (
                                    "Sélectionnez votre service"
                                  )}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                              <Command>
                                <CommandInput
                                  placeholder="Rechercher un service..."
                                  value={query}
                                  onValueChange={setQuery}
                                />
                                <CommandEmpty>Aucun service trouvé.</CommandEmpty>
                                <CommandList>
                                  <CommandGroup>
                                    {filteredEnseignes.map((enseigne) => (
                                      <CommandItem
                                        value={enseigne.name}
                                        key={enseigne.id}
                                        onSelect={() => {
                                          form.setValue("title", enseigne.name);
                                          form.setValue("external_logo_url", enseigne.external_logo_url);
                                          form.setValue("icon_path", enseigne.icon_path);
                                          form.setValue("enseigne_id", enseigne.id);
                                          setQuery(enseigne.name);
                                          setOpenEnseigne(false);
                                        }}
                                        className="hover:bg-purple-50"
                                      >
                                        {enseigne.icon_path || enseigne.external_logo_url ? (
                                          <img
                                            src={enseigne.icon_path || enseigne.external_logo_url || ""}
                                            alt={enseigne.name}
                                            className="w-6 h-6 mr-3 rounded-full object-contain"
                                          />
                                        ) : null}
                                        <div className="flex flex-col">
                                          <span>{enseigne.name}</span>
                                          {enseigne.familles?.name && (
                                            <span className="text-xs text-gray-500">{enseigne.familles.name}</span>
                                          )}
                                        </div>
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            enseigne.name === field.value ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Building className="w-4 h-4 text-blue-600" />
                            Catégorie
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between py-3 border-gray-200 hover:border-purple-300"
                                >
                                  {field.value || "Sélectionnez une catégorie"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                              <Command>
                                <CommandInput placeholder="Rechercher une catégorie..." />
                                <CommandEmpty>
                                  Aucune catégorie trouvée.
                                </CommandEmpty>
                                <CommandList>
                                  <CommandGroup>
                                    {chargeCategories.map((category) => (
                                      <CommandItem
                                        value={category.name}
                                        key={category.id}
                                        onSelect={() =>
                                          form.setValue("category", category.name)
                                        }
                                        className="hover:bg-purple-50"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            category.name === field.value
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {category.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

          {currentStep === 2 && (
            <Card className="border-purple-100 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Euro className="w-4 h-4 text-green-600" />
                  </div>
                  Conditions financières
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Euro className="w-4 h-4 text-green-600" />
                          Montant de la charge
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="29.99"
                              className="pl-4 py-3 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                              {...field} 
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">€</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          Fréquence de prélèvement
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>À quelle fréquence cette charge revient-elle ?</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="py-3 border-gray-200 focus:border-purple-300">
                              <SelectValue placeholder="Sélectionnez une fréquence" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">🗓️ Mensuel</SelectItem>
                            <SelectItem value="quarterly">📅 Trimestriel</SelectItem>
                            <SelectItem value="annually">📆 Annuel</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card className="border-purple-100 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  Détails et partage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="beneficiary_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <User className="w-4 h-4 text-orange-600" />
                          Bénéficiaire (optionnel)
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger className="py-3 border-gray-200 focus:border-purple-300">
                              <SelectValue placeholder="Qui bénéficie de cette charge ?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {beneficiaries.map((beneficiary) => (
                              <SelectItem
                                key={beneficiary.id}
                                value={beneficiary.id}
                              >
                                👤 {`${beneficiary.first_name} ${beneficiary.last_name}`}
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-600" />
                          Description (optionnel)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Abonnement famille, compte premium..."
                            className="min-h-[100px] border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Option de partage */}
                {hasActiveCollaborations && (
                  <FormField
                    control={form.control}
                    name="is_shared"
                    render={({ field }) => (
                      <Card className="border-gray-200">
                        <CardContent className="flex flex-row items-start justify-between p-4">
                          <div className="space-y-1 flex-1">
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Share2 className="h-3 w-3 text-purple-600" />
                              </div>
                              Partager cette charge
                            </div>
                            <p className="text-sm text-gray-600">
                              Rendre cette charge visible par vos collaborateurs
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </CardContent>
                      </Card>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </MultiStepForm>
    </TooltipProvider>
  );
};

export default RecurringChargeForm;
