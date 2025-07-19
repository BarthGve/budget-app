import { zodResolver } from "@hookform/resolvers/zod";
import { SupabaseClient } from "@supabase/supabase-js";
import { PiggyBank } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { Income, Profile, User } from "../../types/index";
import { Card, CardContent, CardTitle } from "../ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Slider } from "../ui/slider";

interface SavingsGoalCardProps {
  user: User | null;
  profile: Profile | null;
  incomes: Income[];
  supabase: SupabaseClient; // Supabase client instance
  setProfile: (profile: Profile) => void;
}

const savingsSchema = z.object({
  percentage: z.array(z.number().min(0).max(100)),
});

export function SavingsGoalCard({
  user,
  profile,
  incomes,
  supabase,
  setProfile,
}: SavingsGoalCardProps) {
  const form = useForm<z.infer<typeof savingsSchema>>({
    resolver: zodResolver(savingsSchema),
    defaultValues: {
      percentage: [10], // Assure que percentage est toujours un tableau
    },
  });

  const savingsPercentage = form.watch("percentage");

  const currentSavingsPercentageValue = useMemo(() => {
    return savingsPercentage[0];
  }, [savingsPercentage]);

  const totalMonthlyIncome = useMemo(() => {
    return (
      incomes
        .filter((i) => i.frequency === "Mensuel")
        .reduce((sum, i) => sum + i.amount, 0) ?? 0
    );
  }, [incomes]);

  const calculatedSavingsAmount = useMemo(() => {
    return (totalMonthlyIncome * currentSavingsPercentageValue) / 100;
  }, [totalMonthlyIncome, currentSavingsPercentageValue]);

  const handleSaveSavingsGoal = useCallback(async () => {
    if (!user) {
      toast.error("Utilisateur non connecté ou Supabase non initialisé.");
      return;
    }
    const { error } = await supabase.functions.invoke("sync-savings-goal", {
      body: {
        user_id: user.id,
        new_percentage: currentSavingsPercentageValue,
      },
    });

    if (error) {
      toast.error(`Erreur lors de la sauvegarde: ${error.message}`);
    } else {
      toast.success("Objectif d'épargne sauvegardé avec succès !");
      if (profile) {
        setProfile({
          ...profile,
          savings_goal_percentage: currentSavingsPercentageValue,
        });
      }
    }
  }, [user, currentSavingsPercentageValue, profile, setProfile, supabase]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (
        user &&
        profile &&
        currentSavingsPercentageValue !==
          (profile.savings_goal_percentage ?? 10)
      ) {
        handleSaveSavingsGoal();
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [
    currentSavingsPercentageValue,
    profile?.savings_goal_percentage,
    handleSaveSavingsGoal,
    user,
    profile,
  ]);

  useEffect(() => {
    if (profile) {
      form.reset({
        percentage: [profile.savings_goal_percentage ?? 10],
      });
    }
  }, [profile, form]);

  return (
    <Card className="w-full mb-8">
      <CardContent className="px-3 py-2 flex items-center justify-between gap-4">
        {/* Title */}
        <CardTitle className="flex items-center gap-2 flex-shrink-0">
          <PiggyBank className="h-4 w-4" />
          Objectif d'Épargne
        </CardTitle>

        {/* Slider */}
        <div className="flex-grow max-w-xs">
          <Form {...form}>
            <form className="w-full">
              <FormField
                control={form.control}
                name="percentage"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    z.infer<typeof savingsSchema>,
                    "percentage"
                  >;
                }) => (
                  <FormItem className="mb-0">
                    <FormLabel className="sr-only">
                      Pourcentage d'épargne
                    </FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={field.value || [10]}
                        onValueChange={field.onChange}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* Percentage and Calculated Amount */}
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-semibold leading-none">
            {savingsPercentage[0]} %
          </p>
          <p className="text-[10px] text-muted-foreground leading-none">
            (
            {calculatedSavingsAmount.toLocaleString("fr-FR", {
              style: "currency",
              currency: "EUR",
            })}
            )
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
