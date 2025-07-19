import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

// Initialisation de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface RecurringCharge {
  id: string;
  amount: number;
  description: string;
  category: string;
  frequency: string;
  start_date: string;
  end_date?: string;
}

// Query function to fetch recurring charges
const fetchRecurringCharges = async (): Promise<RecurringCharge[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated.");
  }
  const { data, error } = await supabase
    .from("recurring_charges")
    .select(
      "id, amount, description, category, frequency, start_date, end_date"
    )
    .eq("user_id", user.id);
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

// Helper function to calculate monthly and yearly totals from recurring charges
const calculateTotals = (charges: RecurringCharge[]) => {
  let monthlyTotal = 0;
  let yearlyTotal = 0;
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  charges.forEach((charge) => {
    const startDate = new Date(charge.start_date);
    const endDate = charge.end_date ? new Date(charge.end_date) : null;

    // Check if the charge is active in the current year
    const isChargeActiveThisYear =
      startDate.getFullYear() <= currentYear &&
      (!endDate || endDate.getFullYear() >= currentYear);

    if (isChargeActiveThisYear) {
      // Calculate for yearly total
      switch (charge.frequency) {
        case "monthly":
          yearlyTotal += charge.amount * 12;
          break;
        case "quarterly":
          yearlyTotal += charge.amount * 4;
          break;
        case "annually":
          yearlyTotal += charge.amount;
          break;
        default:
          break;
      }
    }

    // Calculate for monthly total (only if active in current month)
    const isChargeActiveThisMonth =
      (startDate.getFullYear() < currentYear ||
        (startDate.getFullYear() === currentYear &&
          startDate.getMonth() <= currentMonth)) &&
      (!endDate ||
        endDate.getFullYear() > currentYear ||
        (endDate.getFullYear() === currentYear &&
          endDate.getMonth() >= currentMonth));

    if (isChargeActiveThisMonth) {
      let startMonth;
      switch (charge.frequency) {
        case "monthly":
          monthlyTotal += charge.amount;
          break;
        case "quarterly":
          startMonth = startDate.getMonth();
          if (currentMonth % 3 === startMonth % 3) {
            monthlyTotal += charge.amount; // Add full amount if it's a payment month
          }
          break;
        case "annually":
          if (currentMonth === startDate.getMonth()) {
            monthlyTotal += charge.amount; // Add full amount if it's a payment month
          }
          break;
        default:
          break;
      }
    }
  });
  return { monthlyTotal, yearlyTotal };
};

export const useRecurringCharges = () => {
  const queryClient = useQueryClient();

  const {
    data: recurringCharges,
    isLoading,
    isError,
    error,
  } = useQuery<RecurringCharge[], Error>({
    queryKey: ["recurringCharges"],
    queryFn: fetchRecurringCharges,
    staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  const { monthlyTotal, yearlyTotal } = calculateTotals(recurringCharges || []);

  return {
    recurringCharges: recurringCharges || [],
    monthlyTotal,
    yearlyTotal,
    isLoading,
    isError,
    error,
    invalidateCharges: () =>
      queryClient.invalidateQueries({ queryKey: ["recurringCharges"] }),
  };
};
