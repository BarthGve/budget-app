import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../lib/supabaseClient";

import { toast } from "sonner";
import type {
  AccountType,
  Beneficiary,
  ChargeCategory,
  Collaboration,
  Credit,
  EnrichedUser,
  Group,
  IFamille,
  Income,
  Profile,
  RecurringCharge,
  SavingsContribution,
  SignupData,
  User,
  IEnseigne,
} from "../types/index";

import { DataContext, calculateCreditDetails } from "./data-context-utils";

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null); // New state for profile
  const [credits, setCredits] = useState<Credit[]>([]);
  const [allUsers, setAllUsers] = useState<EnrichedUser[]>([]);
  const [totalUserCount, setTotalUserCount] = useState<number | null>(null);
  const [recentSignups, setRecentSignups] = useState<SignupData[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [familles, setFamilles] = useState<IFamille[]>([]);
  const [enseignes, setEnseignes] = useState<IEnseigne[]>([]);

  const addCredit = useCallback((credit: Credit) => {
    setCredits((prev) => [...prev, credit]);
  }, []);

  const updateCredit = useCallback((updatedCredit: Credit) => {
    setCredits((prev) =>
      prev.map((credit) =>
        credit.id === updatedCredit.id ? updatedCredit : credit
      )
    );
  }, []);

  const deleteCredit = useCallback((creditId: string) => {
    setCredits((prev) => prev.filter((credit) => credit.id !== creditId));
  }, []);

  const addIncome = useCallback((income: Income) => {
    setIncomes((prev) => [...prev, income]);
  }, []);

  const updateIncome = useCallback((updatedIncome: Income) => {
    setIncomes((prev) =>
      prev.map((income) =>
        income.id === updatedIncome.id ? updatedIncome : income
      )
    );
  }, []);

  const deleteIncome = useCallback((incomeId: string) => {
    setIncomes((prev) => prev.filter((income) => income.id !== incomeId));
  }, []);

  const addAccountType = useCallback((accountType: AccountType) => {
    setAccountTypes((prev) => [...prev, accountType]);
  }, []);

  const updateAccountType = useCallback((updatedAccountType: AccountType) => {
    setAccountTypes((prev) =>
      prev.map((accountType) =>
        accountType.id === updatedAccountType.id
          ? updatedAccountType
          : accountType
      )
    );
  }, []);

  const deleteAccountType = useCallback((accountTypeId: string) => {
    setAccountTypes((prev) =>
      prev.filter((accountType) => accountType.id !== accountTypeId)
    );
  }, []);

  const addChargeCategory = useCallback((category: ChargeCategory) => {
    setChargeCategories((prev) => [...prev, category]);
  }, []);

  const updateChargeCategory = useCallback(
    (updatedCategory: ChargeCategory) => {
      setChargeCategories((prev) =>
        prev.map((category) =>
          category.id === updatedCategory.id ? updatedCategory : category
        )
      );
    },
    []
  );

  const deleteChargeCategory = useCallback((categoryId: string) => {
    setChargeCategories((prev) =>
      prev.filter((category) => category.id !== categoryId)
    );
  }, []);

  const addFamille = useCallback((famille: IFamille) => {
    setFamilles((prev) => [...prev, famille]);
  }, []);

  const updateFamille = useCallback((updatedFamille: IFamille) => {
    setFamilles((prev) =>
      prev.map((famille) =>
        famille.id === updatedFamille.id ? updatedFamille : famille
      )
    );
  }, []);

  const deleteFamille = useCallback((familleId: string) => {
    setFamilles((prev) => prev.filter((famille) => famille.id !== familleId));
  }, []);

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [recurringCharges, setRecurringCharges] = useState<RecurringCharge[]>(
    []
  );

  const addRecurringCharge = useCallback((charge: RecurringCharge) => {
    setRecurringCharges((prev) => [...prev, charge]);
  }, []);

  const updateRecurringCharge = useCallback(
    (updatedCharge: RecurringCharge) => {
      setRecurringCharges((prev) =>
        prev.map((charge) =>
          charge.id === updatedCharge.id ? updatedCharge : charge
        )
      );
    },
    []
  );

  const deleteRecurringCharge = useCallback((chargeId: string) => {
    setRecurringCharges((prev) =>
      prev.filter((charge) => charge.id !== chargeId)
    );
  }, []);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [savingsContributions, setSavingsContributions] = useState<
    SavingsContribution[]
  >([]);
  const [chargeCategories, setChargeCategories] = useState<ChargeCategory[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(false);

  const fetchAllData = useCallback(async (userId: string) => {
    console.log("fetchAllData called");
    setLoading(true);
    try {
      // Step 1: Fetch collaborations first to get collaborator IDs
      const { data: collaborationsData, error: collaborationsError } =
        await supabase
          .from("collaborations")
          .select(
            "*, inviter:inviter_id(id, email, first_name, last_name, avatar_url), invitee:invitee_id(id, email, first_name, last_name, avatar_url)"
          )
          .or(`inviter_id.eq.${userId},invitee_id.eq.${userId}`);

      if (collaborationsError) {
        toast.error(collaborationsError.message);
        setLoading(false);
        return;
      }

      const allCollaborations = collaborationsData || [];
      setCollaborations(allCollaborations);

      const activeCollaborations = allCollaborations.filter(
        (c) => c.status === "accepted"
      );

      const collaboratorIds = activeCollaborations.map((c) =>
        c.inviter.id === userId ? c.invitee.id : c.inviter.id
      );
      console.log("Collaborator IDs:", collaboratorIds);

      // Step 2: Fetch all other data using the collaboratorIds
      // Fetch profile first to determine admin status
      const profileRes = await supabase
        .from("profiles")
        .select("*, savings_goal_percentage, is_admin")
        .eq("id", userId)
        .order("updated_at", { ascending: false })
        .single();

      if (profileRes.error) {
        toast.error(
          `Erreur lors du chargement du profil: ${profileRes.error.message}`
        );
        setProfile(null);
        setLoading(false); // Ensure loading is set to false even if profile fetch fails
        return;
      } else if (profileRes.data) {
        setProfile(profileRes.data as Profile);
      }

      const isCurrentUserAdmin = profileRes.data?.is_admin;

      // Prepare promises for all data fetches
      const promises = [
        supabase
          .from("credits")
          .select(
            "*, profiles(first_name, last_name, email, avatar_url), enseignes(*, familles(*))"
          )
          .order("created_at", { ascending: false }),
        // Dynamically build the incomes query
        (() => {
          let query = supabase
            .from("incomes")
            .select("*, profiles(first_name, last_name, email, avatar_url)")
            .order("created_at", { ascending: false });
          if (collaboratorIds.length > 0) {
            const collaboratorConditions = collaboratorIds
              .map((id) => `and(user_id.eq.${id},is_shared.eq.true)`)
              .join(",");
            query = query.or(`user_id.eq.${userId},${collaboratorConditions}`);
          } else {
            query = query.eq("user_id", userId);
          }
          return query;
        })(),
        // Dynamically build the recurring_charges query
        (() => {
          let query = supabase
            .from("recurring_charges")
            .select("*, profiles(first_name, last_name, email, avatar_url)")
            .order("created_at", { ascending: false });
          if (collaboratorIds.length > 0) {
            const collaboratorConditions = collaboratorIds
              .map((id) => `and(user_id.eq.${id},is_shared.eq.true)`)
              .join(",");
            query = query.or(`user_id.eq.${userId},${collaboratorConditions}`);
          } else {
            query = query.eq("user_id", userId);
          }
          return query;
        })(),
        (() => {
          let query = supabase.from("beneficiaries").select("*");
          if (collaboratorIds.length > 0) {
            query = query.in("user_id", [userId, ...collaboratorIds]);
          } else {
            query = query.eq("user_id", userId);
          }
          return query;
        })(),
        supabase.from("charge_categories").select("*"),
        supabase
          .from("groups")
          .select("*, group_beneficiaries(beneficiary_id)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        // Dynamically build the savings_contributions query
        (() => {
          let query = supabase
            .from("savings_contributions")
            .select(
              "*, creator_profile:user_id(first_name, last_name, avatar_url), account_types(*)"
            )
            .order("created_at", { ascending: false });
          if (collaboratorIds.length > 0) {
            const collaboratorConditions = collaboratorIds
              .map((id) => `and(user_id.eq.${id},is_shared.eq.true)`)
              .join(",");
            query = query.or(`user_id.eq.${userId},${collaboratorConditions}`);
          } else {
            query = query.eq("user_id", userId);
          }
          return query;
        })(),
        supabase.from("account_types").select("*"),
        supabase.from("familles").select("*"),
        supabase.from("enseignes").select("*, familles(*)"),
      ];

      const results = await Promise.all(promises);

      // Assign the database query results
      const [
        creditsRes,
        incomesRes,
        recurringChargesRes,
        beneficiariesRes,
        chargeCategoriesRes,
        groupsRes,
        savingsContributionsRes,
        accountTypesRes,
        famillesRes,
        enseignesRes,
      ] = results;

      // Handle admin-specific function calls separately
      let usersRes: {
        data?: { users: EnrichedUser[] } | null;
        error?: Error | null;
      } | null = null;
      let userCountRes: {
        data?: { count: number } | null;
        error?: Error | null;
      } | null = null;
      let signupsRes: {
        data?: SignupData[] | null;
        error?: Error | null;
      } | null = null;

      if (isCurrentUserAdmin) {
        try {
          const [usersResponse, userCountResponse, signupsResponse] =
            await Promise.all([
              supabase.functions.invoke("manage-users", {
                method: "POST",
                body: { action: "GET_ALL" },
              }),
              supabase.functions.invoke("manage-users", {
                method: "POST",
                body: { action: "GET_COUNT" },
              }),
              supabase.functions.invoke("manage-users", {
                method: "POST",
                body: { action: "GET_SIGNUPS_PER_DAY" },
              }),
            ]);

          usersRes = usersResponse;
          userCountRes = userCountResponse;
          signupsRes = signupsResponse;
        } catch (adminError) {
          console.error("Error fetching admin data:", adminError);
          toast.error("Erreur lors du chargement des données administrateur");
        }
      }

      if (creditsRes.error) toast.error(creditsRes.error.message);
      else {
        const processedCredits = creditsRes.data.map((credit: Credit) => {
          const parsedCredit = {
            ...credit,
            total_amount: credit.total_amount,
            total_installments: credit.total_installments,
            monthly_payment: credit.monthly_payment,
            interest_rate: credit.interest_rate,
          } as Credit;
          const { current_amount_due, remaining_installments } =
            calculateCreditDetails(parsedCredit);
          return {
            ...parsedCredit,
            current_amount_due,
            remaining_installments,
          };
        });
        setCredits(processedCredits);
      }

      if (incomesRes.error) toast.error(incomesRes.error.message);
      else setIncomes(incomesRes.data as Income[]);

      if (recurringChargesRes.error)
        toast.error(recurringChargesRes.error.message);
      else {
        setRecurringCharges(recurringChargesRes.data || []);
        console.log("Fetched Recurring Charges:", recurringChargesRes.data);
      }

      if (beneficiariesRes.error) toast.error(beneficiariesRes.error.message);
      else {
        const fetchedBeneficiaries = beneficiariesRes.data as Beneficiary[];
        let combinedBeneficiaries = fetchedBeneficiaries;

        if (userId && profileRes.data) {
          const currentUserProfile = profileRes.data as Profile;
          const userAsBeneficiary: Beneficiary = {
            id: userId,
            created_at:
              currentUserProfile?.created_at || new Date().toISOString(),
            user_id: userId,
            first_name: currentUserProfile?.first_name || "Moi",
            last_name: currentUserProfile?.last_name || "",
            avatar_url: currentUserProfile?.avatar_url || null,
          };

          const isUserAlreadyBeneficiary = fetchedBeneficiaries.some(
            (b) => b.id === userId
          );

          if (!isUserAlreadyBeneficiary) {
            combinedBeneficiaries = [
              userAsBeneficiary,
              ...fetchedBeneficiaries,
            ];
          }
        }
        setBeneficiaries(combinedBeneficiaries);
        console.log("Fetched Beneficiaries:", combinedBeneficiaries);
      }

      if (chargeCategoriesRes.error)
        toast.error(chargeCategoriesRes.error.message);
      else setChargeCategories(chargeCategoriesRes.data as ChargeCategory[]);

      if (groupsRes.error) toast.error(groupsRes.error.message);
      else setGroups(groupsRes.data as Group[]);

      if (savingsContributionsRes.error)
        toast.error(savingsContributionsRes.error.message);
      else {
        setSavingsContributions(savingsContributionsRes.data || []);
      }

      if (accountTypesRes.error) toast.error(accountTypesRes.error.message);
      else setAccountTypes(accountTypesRes.data as AccountType[]);

      if (famillesRes.error) toast.error(famillesRes.error.message);
      else setFamilles(famillesRes.data || []);

      if (enseignesRes.error) toast.error(enseignesRes.error.message);
      else setEnseignes(enseignesRes.data || []);

      // Handle admin-specific data only if fetched
      if (isCurrentUserAdmin && usersRes && userCountRes && signupsRes) {
        if (usersRes.error) {
          toast.error(
            "Erreur lors de la récupération des utilisateurs: " +
              (usersRes.error as Error).message
          );
        } else if (usersRes.data) {
          setAllUsers(usersRes.data.users || []);
        }

        if (userCountRes.error) {
          toast.error(
            "Erreur lors de la récupération du nombre d'utilisateurs: " +
              (userCountRes.error as Error).message
          );
        } else if (userCountRes.data) {
          setTotalUserCount(userCountRes.data.count);
        }

        if (signupsRes.error) {
          toast.error(
            "Erreur lors de la récupération des inscriptions: " +
              (signupsRes.error as Error).message
          );
        } else if (signupsRes.data) {
          const formattedData = signupsRes.data.map((d: SignupData) => ({
            ...d,
            signup_date: new Date(d.signup_date).toLocaleDateString("fr-FR", {
              weekday: "short",
              day: "numeric",
            }),
          }));
          setRecentSignups(formattedData);
        }
      } else {
        // Reset admin-specific states for non-admin users
        setAllUsers([]);
        setTotalUserCount(null);
        setRecentSignups([]);
      }
    } catch (error: unknown) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const collaboratorProfiles = useMemo(() => {
    if (!user || !collaborations) return [];
    const profiles = collaborations
      .map((c: Collaboration) => {
        if (c.inviter?.id === user.id) return c.inviter;
        if (c.invitee?.id === user.id) return c.invitee;
        return null;
      })
      .filter((p) => p != null) as Profile[];
    const uniqueProfiles = Array.from(
      new Map(profiles.filter(Boolean).map((p: Profile) => [p.id, p])).values()
    );
    return uniqueProfiles;
  }, [collaborations, user]);

  useEffect(() => {
    const getInitialUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user as User);
        fetchAllData(user.id);
      } else {
        setLoading(false);
      }
    };

    getInitialUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_, session) => {
        const newUser = session?.user ?? null;
        setUser(newUser as User | null);
        if (newUser) {
          fetchAllData(newUser.id);
        }
      }
    );

    return () => {
      isMounted.current = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchAllData]);

  // Update last_seen_at for the current user periodically
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (user) {
      const updateLastSeen = async () => {
        const { error } = await supabase
          .from("profiles")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", user.id);
        if (error) {
          console.error("Error updating last_seen_at:", error);
        } else {
          console.log("last_seen_at updated for user:", user.id);
        }
      };

      // Update immediately on mount
      updateLastSeen();

      // Update every minute
      interval = setInterval(updateLastSeen, 60 * 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user]);

  const value = {
    user,
    profile, // Expose profile
    credits,
    incomes,
    collaborations,
    collaboratorProfiles,
    recurringCharges,
    beneficiaries,
    groups,
    savingsContributions,
    chargeCategories, // <-- Expose charge categories
    accountTypes, // <-- Expose account types
    familles, // <-- Expose familles
    enseignes, // <-- Expose enseignes
    loading,
    fetchAllData,
    addRecurringCharge,
    updateRecurringCharge,
    deleteRecurringCharge,
    supabase,
    allUsers,
    totalUserCount,
    recentSignups,
    setProfile, // Expose setProfile
    setBeneficiaries, // Expose setBeneficiaries
    setGroups, // Expose setGroups
    setSavingsContributions, // Expose setSavingsContributions
    addCredit,
    updateCredit,
    deleteCredit,
    addIncome,
    updateIncome,
    deleteIncome,
    addAccountType,
    updateAccountType,
    deleteAccountType,
    addChargeCategory,
    updateChargeCategory,
    deleteChargeCategory,
    addFamille,
    updateFamille,
    deleteFamille,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
