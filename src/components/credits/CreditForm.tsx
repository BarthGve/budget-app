import { zodResolver } from "@hookform/resolvers/zod";
import { addMonths, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Check, ChevronsUpDown, Share2, Euro, Percent, Info, Clock, FileText, Building } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useData } from "../../context/data-context-utils";
import { cn } from "../../lib/utils";
import type { Credit } from "../../types/index";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
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
import { Switch } from "../ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

// Helper function to calculate loan details
const calculateLoanDetails = (
  totalAmount: number,
  interestRate: number,
  startDate: Date,
  endDate?: Date,
  totalInstallments?: number
): {
  calculatedMonthlyPayment: number;
  calculatedTotalInstallments: number;
  calculatedEndDate: Date | undefined;
} => {
  if (!totalAmount || totalAmount <= 0 || !startDate) {
    return {
      calculatedMonthlyPayment: 0,
      calculatedTotalInstallments: 0,
      calculatedEndDate: undefined,
    };
  }

  const annualInterestRate = interestRate;
  const monthlyInterestRate = annualInterestRate / 12;

  let calculatedTotalInstallments = totalInstallments || 0;
  let calculatedMonthlyPayment = 0;
  let calculatedEndDate = endDate;

  if (endDate && endDate >= startDate) {
    calculatedTotalInstallments =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth()) +
      1;
  } else if (totalInstallments && totalInstallments > 0) {
    calculatedEndDate = addMonths(startDate, totalInstallments - 1);
  }

  if (calculatedTotalInstallments > 0) {
    if (monthlyInterestRate > 0) {
      calculatedMonthlyPayment =
        (totalAmount * monthlyInterestRate) /
        (1 - Math.pow(1 + monthlyInterestRate, -calculatedTotalInstallments));
    } else {
      calculatedMonthlyPayment = totalAmount / calculatedTotalInstallments;
    }
  }

  return {
    calculatedMonthlyPayment: parseFloat(calculatedMonthlyPayment.toFixed(2)),
    calculatedTotalInstallments: Math.round(calculatedTotalInstallments),
    calculatedEndDate,
  };
};

const creditSchema = z
  .object({
    loan_name: z.string().min(1, { message: "Le nom du crédit est requis." }),
    enseigne_id: z
      .string()
      .uuid({ message: "Veuillez sélectionner un établissement." }),
    total_amount: z.coerce
      .number()
      .positive({ message: "Le montant total doit être un nombre positif." }),
    total_installments: z.coerce.number().int().positive().optional(),
    monthly_payment: z.coerce.number().positive().optional(),
    start_date: z.date({
      required_error: "La date de 1ère mensualité est requise.",
    }),
    end_date: z.date().optional(),
    interest_rate: z.coerce
      .number()
      .min(0, { message: "Le taux d'intérêt doit être positif." })
      .max(1, {
        message: "Le taux d'intérêt doit être entre 0 et 1 (ex: 0.05 pour 5%).",
      }),
    is_shared: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const hasEndDate = !!data.end_date;
    const hasInstallments =
      !!data.total_installments && data.total_installments > 0;

    if (!hasEndDate && !hasInstallments) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Veuillez remplir soit la date de fin, soit le nombre d'échéances.",
        path: ["end_date"],
      });
    }
  });

type CreditFormValues = z.infer<typeof creditSchema>;

interface CreditFormProps {
  credit: Credit | null;
  onSuccess: (credit?: Credit) => void;
  currentUserId: string | null;
  canShareCredit: boolean;
}

const steps = [
  "Identification",
  "Conditions",
  "Remboursement",
];

const validationSteps: (keyof CreditFormValues)[][] = [
  ["loan_name", "enseigne_id"],
  ["total_amount", "interest_rate"],
  ["start_date", "total_installments", "monthly_payment", "end_date"],
];

export function CreditForm({
  credit,
  onSuccess,
  currentUserId,
  canShareCredit,
}: CreditFormProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const form = useForm<CreditFormValues>({
    resolver: zodResolver(creditSchema),
    defaultValues: credit
      ? {
          loan_name: credit.loan_name,
          enseigne_id: credit.enseigne_id || "",
          total_amount: credit.total_amount,
          total_installments: credit.total_installments,
          monthly_payment: credit.monthly_payment,
          start_date: credit.start_date
            ? new Date(credit.start_date)
            : new Date(),
          end_date: credit.end_date ? new Date(credit.end_date) : undefined,
          interest_rate: credit.interest_rate,
          is_shared: Boolean(credit.is_shared),
        }
      : {
          loan_name: "",
          enseigne_id: "",
          total_amount: 0,
          total_installments: undefined,
          monthly_payment: undefined,
          start_date: new Date(),
          end_date: undefined,
          interest_rate: 0,
          is_shared: false,
        },
  });

  const { watch } = form;
  const data = useData();
  const { supabase, enseignes } = data!;

  const allEnseignes = useMemo(() => enseignes ?? [], [enseignes]);

  const filteredEnseignes = useMemo(() => {
    if (!allEnseignes) return [];
    const lowerCaseQuery = query.toLowerCase();
    return allEnseignes.filter(
      (enseigne) =>
        enseigne.name.toLowerCase().includes(lowerCaseQuery) ||
        (enseigne.familles &&
          enseigne.familles.name.toLowerCase().includes(lowerCaseQuery))
    );
  }, [allEnseignes, query]);

  useEffect(() => {
    if (credit) {
      form.reset({
        ...credit,
        enseigne_id: credit.enseigne_id || "",
        start_date: credit.start_date
          ? new Date(credit.start_date)
          : new Date(),
        end_date: credit.end_date ? new Date(credit.end_date) : undefined,
        is_shared: Boolean(credit.is_shared),
      });
      if (credit.enseigne_id && allEnseignes.length > 0) {
        const selected = allEnseignes.find((e) => e.id === credit.enseigne_id);
        if (selected) setQuery(selected.name);
      }
    }
  }, [credit, form, allEnseignes]);

  const handleFormSubmit: SubmitHandler<CreditFormValues> = async (values) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      toast.error("Vous devez être connecté pour effectuer cette action.");
      return;
    }

    const selectedEnseigne = allEnseignes.find(
      (e) => e.id === values.enseigne_id
    );

    const {
      calculatedMonthlyPayment,
      calculatedTotalInstallments,
      calculatedEndDate,
    } = calculateLoanDetails(
      values.total_amount,
      values.interest_rate,
      values.start_date,
      values.end_date,
      values.total_installments
    );

    const finalMonthlyPayment =
      values.monthly_payment || calculatedMonthlyPayment;
    const finalTotalInstallments =
      values.total_installments || calculatedTotalInstallments;
    const finalEndDate = values.end_date || calculatedEndDate;

    if (
      finalMonthlyPayment &&
      finalTotalInstallments &&
      finalMonthlyPayment * finalTotalInstallments < values.total_amount - 0.01
    ) {
      toast.error(
        "Le paiement total doit couvrir le montant total du prêt. Ajustez la mensualité ou le nombre d'échéances."
      );
      return;
    }

    const payload = {
      loan_name: values.loan_name,
      enseigne_id: values.enseigne_id,
      organization_name: selectedEnseigne?.name || null,
      logo_url:
        selectedEnseigne?.external_logo_url ||
        selectedEnseigne?.icon_path ||
        undefined,
      total_amount: values.total_amount,
      total_installments: finalTotalInstallments,
      monthly_payment: finalMonthlyPayment,
      start_date: format(values.start_date, "yyyy-MM-dd"),
      end_date: finalEndDate ? format(finalEndDate, "yyyy-MM-dd") : null,
      interest_rate: values.interest_rate,
      is_shared: values.is_shared,
    };

    const res = await (credit
      ? supabase.from("credits").update(payload).eq("id", credit.id).select()
      : supabase
          .from("credits")
          .insert([{ ...payload, user_id: authData.user.id }])
          .select());

    if (res.error) {
      toast.error(res.error.message);
      return;
    }

    const updatedCredit = res.data?.[0];
    if (updatedCredit && values.is_shared && authData.user.id) {
      supabase.functions.invoke("notify-collaborators-on-credit-share", {
        body: {
          creditOwnerId: authData.user.id,
          creditOwnerFirstName:
            authData.user.user_metadata?.firstName || "Un utilisateur",
          creditName: values.loan_name,
          creditId: updatedCredit.id,
        },
      });
    }
    onSuccess(updatedCredit);
    toast.success(
      credit
        ? "Crédit mis à jour avec succès !"
        : "Crédit ajouté avec succès !"
    );
  };

  return (
    <TooltipProvider>
      <MultiStepForm
        form={form}
        onSubmit={handleFormSubmit}
        steps={steps}
        validationSteps={validationSteps}
        submitButtonText={credit ? "Mettre à jour" : "Ajouter"}
        dialogTexts={{
          title: "Êtes-vous sûr ?",
          description: `Cette action ne peut pas être annulée. Voulez-vous vraiment ${
            credit ? " mettre à jour" : " ajouter"
          } ce crédit ?`,
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
                      <Share2 className="w-4 h-4 text-purple-600" />
                    </div>
                    Identification du crédit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="loan_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-600" />
                            Nom du crédit
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="Ex: Prêt immobilier résidence principale"
                                className="pl-4 py-3 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="enseigne_id"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Building className="w-4 h-4 text-purple-600" />
                            Établissement financier
                          </FormLabel>
                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between py-3 border-gray-200 hover:border-purple-300",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    <div className="flex items-center">
                                      {allEnseignes.find((e) => e.id === field.value)
                                        ?.icon_path ||
                                      allEnseignes.find((e) => e.id === field.value)
                                        ?.external_logo_url ? (
                                        <img
                                          src={
                                            allEnseignes.find(
                                              (e) => e.id === field.value
                                            )?.icon_path ||
                                            allEnseignes.find(
                                              (e) => e.id === field.value
                                            )?.external_logo_url ||
                                            undefined
                                          }
                                          alt={
                                            allEnseignes.find(
                                              (e) => e.id === field.value
                                            )?.name || ""
                                          }
                                          className="w-6 h-6 mr-3 rounded-full object-contain"
                                        />
                                      ) : null}
                                      {
                                        allEnseignes.find((e) => e.id === field.value)
                                          ?.name
                                      }
                                    </div>
                                  ) : (
                                    "Sélectionnez votre banque"
                                  )}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                              <Command>
                                <CommandInput
                                  placeholder="Rechercher un établissement..."
                                  value={query}
                                  onValueChange={setQuery}
                                />
                                <CommandEmpty>
                                  Aucun établissement trouvé.
                                </CommandEmpty>
                                <CommandList>
                                  <CommandGroup>
                                    {filteredEnseignes.map((enseigne) => (
                                      <CommandItem
                                        value={enseigne.name}
                                        key={enseigne.id}
                                        onSelect={() => {
                                          form.setValue("enseigne_id", enseigne.id);
                                          setQuery(enseigne.name);
                                          setOpen(false);
                                        }}
                                        className="hover:bg-purple-50"
                                      >
                                        {enseigne.icon_path ||
                                        enseigne.external_logo_url ? (
                                          <img
                                            src={
                                              enseigne.icon_path ||
                                              enseigne.external_logo_url ||
                                              ""
                                            }
                                            alt={enseigne.name}
                                            className="w-6 h-6 mr-3 rounded-full object-contain"
                                          />
                                        ) : null}
                                        {enseigne.name}
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            enseigne.id === field.value
                                              ? "opacity-100"
                                              : "opacity-0"
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
                    name="total_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Euro className="w-4 h-4 text-green-600" />
                          Montant total emprunté
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="150 000"
                              className="pl-4 py-3 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseFloat(e.target.value) : ""
                                )
                              }
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
                    name="interest_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Percent className="w-4 h-4 text-orange-600" />
                          Taux d'intérêt annuel
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Saisir en décimal : 0.035 pour 3.5%</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.001"
                              min="0"
                              max="1"
                              placeholder="0.035"
                              className="pl-4 py-3 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseFloat(e.target.value) : ""
                                )
                              }
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                              {field.value ? `${(field.value * 100).toFixed(2)}%` : '%'}
                            </span>
                          </div>
                        </FormControl>
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
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  Planning de remboursement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-blue-600" />
                          Date de première mensualité
                        </FormLabel>
                        <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-4 text-left font-normal py-3 border-gray-200 hover:border-purple-300",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: fr })
                                ) : (
                                  <span>Sélectionnez une date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date);
                                setStartDateOpen(false);
                              }}
                              locale={fr}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-red-600" />
                          Date de fin (optionnel)
                        </FormLabel>
                        <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-4 text-left font-normal py-3 border-gray-200 hover:border-purple-300",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: fr })
                                ) : (
                                  <span>Calculée automatiquement</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date);
                                setEndDateOpen(false);
                              }}
                              locale={fr}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Montants et échéances */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="total_installments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-purple-600" />
                          Nombre d'échéances
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              min="1"
                              placeholder="240"
                              className="pl-4 py-3 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseInt(e.target.value) : ""
                                )
                              }
                              disabled={!!watch("end_date")}
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">mois</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monthly_payment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Euro className="w-4 h-4 text-green-600" />
                          Mensualité
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="750"
                              className="pl-4 py-3 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseFloat(e.target.value) : ""
                                )
                              }
                              disabled={!!watch("end_date")}
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">€/mois</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Option de partage */}
                {canShareCredit &&
                  (!credit || credit.user_id === currentUserId) && (
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
                                Partager ce crédit
                              </div>
                              <p className="text-sm text-gray-600">
                                Rendre ce crédit visible par vos collaborateurs
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value ?? false}
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
}
