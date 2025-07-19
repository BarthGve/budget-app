import type { SupabaseClient } from "@supabase/supabase-js";
import { createContext, useContext } from "react";
import type {
  AccountType,
  Beneficiary,
  ChargeCategory,
  Collaboration,
  Credit,
  EnrichedUser,
  Group,
  IEnseigne,
  Income,
  Profile,
  RecurringCharge,
  SavingsContribution,
  User,
} from "../types/index";

export const DataContext = createContext<{
  user: User | null;
  profile: Profile | null;
  credits: Credit[];
  incomes: Income[];
  collaborations: Collaboration[];
  collaboratorProfiles: Profile[];
  recurringCharges: RecurringCharge[];
  beneficiaries: Beneficiary[];
  groups: Group[];
  savingsContributions: SavingsContribution[];
  chargeCategories: ChargeCategory[];
  accountTypes: AccountType[];
  familles: IFamille[];
  enseignes: IEnseigne[];
  loading: boolean;
  fetchAllData: (userId: string) => Promise<void>;
  addRecurringCharge: (charge: RecurringCharge) => void;
  updateRecurringCharge: (charge: RecurringCharge) => void;
  deleteRecurringCharge: (chargeId: string) => void;
  supabase: SupabaseClient;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  setBeneficiaries: React.Dispatch<React.SetStateAction<Beneficiary[]>>;
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  setSavingsContributions: React.Dispatch<
    React.SetStateAction<SavingsContribution[]>
  >;
  addCredit: (credit: Credit) => void;
  updateCredit: (credit: Credit) => void;
  deleteCredit: (creditId: string) => void;
  addIncome: (income: Income) => void;
  updateIncome: (income: Income) => void;
  deleteIncome: (incomeId: string) => void;
  addChargeCategory: (category: ChargeCategory) => void;
  updateChargeCategory: (category: ChargeCategory) => void;
  deleteChargeCategory: (categoryId: string) => void;
  addAccountType: (accountType: AccountType) => void;
  updateAccountType: (accountType: AccountType) => void;
  deleteAccountType: (accountTypeId: string) => void;
  addFamille: (famille: IFamille) => void;
  updateFamille: (famille: IFamille) => void;
  deleteFamille: (familleId: string) => void;
  allUsers: EnrichedUser[];
  totalUserCount: number | null; // Ajout du nombre total d'utilisateurs
  recentSignups: SignupData[]; // Ajout des données d'inscription récentes
} | null>(null);

export const useData = () => useContext(DataContext);

export interface SignupData {
  signup_date: string;
  signup_count: number;
}

export interface IFamille {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export const calculateCreditDetails = (credit: Credit) => {
  const startDate = new Date(credit.start_date);
  if (isNaN(startDate.getTime())) {
    return { current_amount_due: 0, remaining_installments: 0 };
  }

  const today = new Date();
  const monthsPassed =
    (today.getFullYear() - startDate.getFullYear()) * 12 +
    (today.getMonth() - startDate.getMonth()) +
    1;

  const remaining_installments = Math.max(
    0,
    (credit.total_installments || 0) - monthsPassed
  );
  const current_amount_due =
    remaining_installments * (credit.monthly_payment || 0);

  return {
    remaining_installments,
    current_amount_due,
  };
};

export const calculateTotalSavedAmount = (
  savingsContributions: SavingsContribution[]
): number => {
  let totalSaved = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today's date to start of day

  if (Array.isArray(savingsContributions)) {
    savingsContributions.forEach((contribution) => {
      const startDate = new Date(contribution.start_date);
      startDate.setHours(0, 0, 0, 0); // Normalize start date to start of day

      if (isNaN(startDate.getTime()) || startDate > today) {
        return; // Skip invalid dates or future contributions
      }

      let currentContributionAmount = 0;
      const tempDate = new Date(startDate);

      while (tempDate <= today) {
        currentContributionAmount += contribution.amount;

        if (contribution.frequency === "Mensuel") {
          tempDate.setMonth(tempDate.getMonth() + 1);
        } else if (contribution.frequency === "Trimestriel") {
          tempDate.setMonth(tempDate.getMonth() + 3);
        } else if (contribution.frequency === "Annuel") {
          tempDate.setFullYear(tempDate.getFullYear() + 1);
        } else {
          // Unknown frequency, break
          break;
        }
      }
      totalSaved += currentContributionAmount;
    });
  }

  return totalSaved;
};
