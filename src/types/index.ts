export interface Credit {
  id: string;
  created_at: string;
  user_id: string;
  total_amount: number;
  interest_rate: number;
  total_installments: number;
  monthly_payment: number;
  start_date: string;
  end_date: string;
  is_shared: boolean;
  is_settled_early: boolean;
  current_amount_due: number;
  remaining_installments: number;
  loan_name: string;
  enseigne_id?: string | null; // Nouvelle colonne
  enseignes?: IEnseigne; // Relation jointe
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string;
  };
}

export interface RecurringCharge {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  domain?: string | null;
  external_logo_url?: string | null; // Remplacé logo_url
  icon_path?: string | null; // Ajouté icon_path
  amount: number;
  frequency: "monthly" | "quarterly" | "annually";
  category: string;
  description?: string | null;
  beneficiary_id?: string | null;
  enseigne_id?: string | null; // Référence vers la table enseignes
  is_shared?: boolean;
  enseignes?: IEnseigne; // Relation jointe
}

export interface User {
  id: string;
  email?: string;
  user_metadata?: { [key: string]: unknown };
  app_metadata?: { [key: string]: unknown };
}

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  avatar_url: string;
  savings_goal_percentage?: number | null;
  income_share_percentage?: number | null; // New field for income share
  is_admin?: boolean; // New field for admin status
  last_seen_at?: string; // New field for last seen timestamp
  dashboard_preferences?: {
    showIncomeSummary?: boolean;
    showCreditSummary?: boolean;
    showRecurringChargesSummary?: boolean;
    showSavingsSummary?: boolean;
    showBeneficiaryCharges?: boolean;
    showGroupCharges?: boolean;
    showCategoryChargesDonut?: boolean;
    showCreditCategoriesDonut?: boolean;
  };
}

export interface Income {
  id: string;
  created_at: string;
  user_id: string;
  source_name: string;
  amount: number;
  contributor_user_id: string;
  frequency: string;
  description?: string | null;
  is_shared?: boolean;
  profiles: Profile;
}

export interface Collaboration {
  id: string;
  inviter_id: string;
  invitee_id: string;
  status: string;
  inviter: Profile;
  invitee: Profile;
}

export interface ChargeCategory {
  id: string;
  name: string;
  color: string;
}

export interface ChartData {
  category: string;
  totalAmount: number;
  color: string;
}

export interface Beneficiary {
  id: string;
  created_at: string;
  user_id: string;
  first_name: string;
  last_name?: string | null;
  avatar_url?: string | null;
}

export interface GroupBeneficiary {
  beneficiary_id: string;
}

export interface Notification {
  id: string;
  created_at: string;
  message: string;
  is_read: boolean;
  recipient_id: string;
  type: string; // e.g., "collaboration_invite", "credit_update"
}

export interface Group {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  group_beneficiaries: GroupBeneficiary[];
}

export interface SavingsContribution {
  id: string;
  created_at: string;
  user_id: string;
  type: string;
  amount: number;
  frequency: string;
  start_date: Date; // Modifié de string à Date
  domain?: string | null;
  logo_url?: string | null;
  beneficiary_id?: string | null;
  account_type_id?: string | null; // Ajout du champ account_type_id
  enseigne_id?: string | null; // Ajout du champ enseigne_id
  is_shared?: boolean; // Derived property
  user_amount?: number; // Derived property
  creator_profile: Profile;
  account_types?: AccountType; // Ajout de la relation account_types
}

export interface EnrichedUser {
  id: string;
  email: string;
  created_at: string;
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    is_admin: boolean;
    last_seen_at: string;
  } | null;
}

export interface SignupData {
  signup_date: string;
  signup_count: number;
}

export interface AccountType {
  id: string;
  name: string;
  created_at: string;
  user_id: string | null;
}

export interface IFamille {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface IEnseigne {
  id: string;
  name: string;
  family_id: string;
  external_logo_url?: string | null;
  icon_path?: string | null;
  domain?: string | null;
  familles: { name: string; color: string };
}
