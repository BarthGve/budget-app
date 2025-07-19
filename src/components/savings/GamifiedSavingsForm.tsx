import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Building,
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Clock,
  Euro,
  PiggyBank,
  Share2,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useData } from "../../context/data-context-utils";
import { cn } from "../../lib/utils";
import type { SavingsContribution } from "../../types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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
import { TooltipProvider } from "../ui/tooltip";
import { savingsContributionSchema } from "./savingsSchema";

type SavingsContributionFormValues = z.infer<typeof savingsContributionSchema>;

import { SupabaseClient } from "@supabase/supabase-js"; // Ajout de l'import

interface GamifiedSavingsFormProps {
  form: UseFormReturn<SavingsContributionFormValues>;
  onSubmit: (values: SavingsContributionFormValues) => void;
  contributorOptions: {
    value: string;
    label: string;
    avatar_url?: string | null;
  }[];
  editingContribution: SavingsContribution | null;
  canShare: boolean;
  supabase: SupabaseClient; // Ajouté
}

const steps = ["Identification", "Conditions", "Partage"];

const validationSteps: (keyof SavingsContributionFormValues)[][] = [
  ["account_type_id", "enseigne_id"],
  ["amount", "frequency", "start_date"],
  ["beneficiary_id", "is_shared"],
];

export function GamifiedSavingsForm({
  form,
  onSubmit,
  contributorOptions,
  editingContribution,
  canShare,
}: GamifiedSavingsFormProps) {
  const data = useData();
  const { accountTypes, enseignes } = data ?? {
    accountTypes: [],
    enseignes: [],
  };
  const [openAccountType, setOpenAccountType] = useState(false);
  const [openEnseigne, setOpenEnseigne] = useState(false);
  const [query, setQuery] = useState("");

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
    if (editingContribution) {
      form.reset({
        ...editingContribution,
        account_type_id: editingContribution.account_type_id || undefined,
        enseigne_id: editingContribution.enseigne_id || undefined,
        start_date: new Date(editingContribution.start_date),
        beneficiary_id: editingContribution.beneficiary_id || undefined,
        is_shared: editingContribution.is_shared || false,
      });
    } else {
      form.reset({
        account_type_id: undefined,
        enseigne_id: undefined,
        amount: 0,
        frequency: "Mensuel",
        start_date: new Date(),
        beneficiary_id: undefined,
        is_shared: false,
      });
    }
  }, [editingContribution, form]);

  return (
    <TooltipProvider>
      <MultiStepForm
        form={form}
        onSubmit={onSubmit}
        steps={steps}
        validationSteps={validationSteps}
        submitButtonText={editingContribution ? "Mettre à jour" : "Enregistrer"}
        dialogTexts={{
          title: "Êtes-vous sûr ?",
          description: `Cette action ne peut pas être annulée. Voulez-vous vraiment ${
            editingContribution ? "mettre à jour" : "enregistrer"
          } ce versement ?`,
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
                      <PiggyBank className="w-4 h-4 text-purple-600" />
                    </div>
                    Identification du compte
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="account_type_id"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <PiggyBank className="w-4 h-4 text-purple-600" />
                            Type de compte d'épargne
                          </FormLabel>
                          <Popover
                            open={openAccountType}
                            onOpenChange={setOpenAccountType}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={openAccountType}
                                  className={cn(
                                    "w-full justify-between py-3 border-gray-200 hover:border-purple-300",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value
                                    ? accountTypes.find(
                                        (type) => type.id === field.value
                                      )?.name
                                    : "Type de compte"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                              <Command>
                                <CommandInput placeholder="Rechercher un type..." />
                                <CommandEmpty>Aucun type trouvé.</CommandEmpty>
                                <CommandList>
                                  <CommandGroup>
                                    {accountTypes.map((type) => (
                                      <CommandItem
                                        value={type.name}
                                        key={type.id}
                                        onSelect={() => {
                                          form.setValue(
                                            "account_type_id",
                                            type.id
                                          );
                                          setOpenAccountType(false);
                                        }}
                                        className="hover:bg-purple-50"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            type.id === field.value
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {type.name}
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
                      name="enseigne_id"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Building className="w-4 h-4 text-green-600" />
                            Établissement financier
                          </FormLabel>
                          <Popover
                            open={openEnseigne}
                            onOpenChange={setOpenEnseigne}
                          >
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
                                      {allEnseignes.find(
                                        (e) => e.id === field.value
                                      )?.icon_path ||
                                      allEnseignes.find(
                                        (e) => e.id === field.value
                                      )?.external_logo_url ? (
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
                                        allEnseignes.find(
                                          (e) => e.id === field.value
                                        )?.name
                                      }
                                    </div>
                                  ) : (
                                    "Établissement"
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
                                          form.setValue(
                                            "enseigne_id",
                                            enseigne.id
                                          );
                                          setQuery(enseigne.name);
                                          setOpenEnseigne(false);
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Euro className="w-4 h-4 text-green-600" />
                            Montant
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="200"
                                className="pl-4 py-3 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                                {...field}
                                value={field.value ?? 0}
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
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
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            Fréquence
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="py-3 border-gray-200 hover:border-purple-300">
                                <SelectValue placeholder="Fréquence" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Ponctuel">Ponctuel</SelectItem>
                              <SelectItem value="Mensuel">Mensuel</SelectItem>
                              <SelectItem value="Trimestriel">
                                Trimestriel
                              </SelectItem>
                              <SelectItem value="Annuel">Annuel</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-blue-600" />
                            Date de début
                          </FormLabel>
                          <Popover>
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
                                    <span>Date de début</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                locale={fr}
                                captionLayout="dropdown"
                                fromYear={new Date().getFullYear() - 10}
                                toYear={new Date().getFullYear() + 10}
                              />
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

            {currentStep === 3 && (
              <Card className="border-purple-100 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Share2 className="w-4 h-4 text-orange-600" />
                    </div>
                    Options de partage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger className="py-3 border-gray-200 hover:border-purple-300">
                              <SelectValue placeholder="Bénéficiaire" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contributorOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage
                                      src={option.avatar_url || undefined}
                                    />
                                    <AvatarFallback>
                                      {option.label.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                              Partager ce versement
                            </FormLabel>
                            <p className="text-sm text-muted-foreground pl-8">
                              Rendre ce versement visible par vos collaborateurs
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
            )}
          </>
        )}
      </MultiStepForm>
    </TooltipProvider>
  );
}
