// Enums matching database
export type AppRole = 'owner' | 'admin' | 'member' | 'superadmin';
export type ExpenseType = 'expense' | 'invoice';
export type ExpenseCategory = 'saas' | 'resor' | 'kontor' | 'marknadsforing' | 'it_verktyg' | 'ovrigt';
export type IntegrationStatus = 'active' | 'inactive' | 'error';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
export type ExpenseSource = 'manual' | 'kleer';

// Category display names in Swedish
export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  saas: 'SaaS',
  resor: 'Resor',
  kontor: 'Kontor',
  marknadsforing: 'Marknadsföring',
  it_verktyg: 'IT/Verktyg',
  ovrigt: 'Övrigt',
};

// Category colors for charts
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  saas: 'hsl(220, 90%, 56%)',
  resor: 'hsl(160, 60%, 45%)',
  kontor: 'hsl(45, 90%, 55%)',
  marknadsforing: 'hsl(280, 60%, 55%)',
  it_verktyg: 'hsl(200, 70%, 50%)',
  ovrigt: 'hsl(0, 0%, 60%)',
};

export interface Company {
  id: string;
  name: string;
  org_number: string | null;
  currency: string;
  subscription_status: SubscriptionStatus;
  base_price_per_month: number;
  extra_user_price: number;
  max_users_included: number;
  max_manual_expenses: number;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  company_id: string;
  role: AppRole;
  created_at: string;
}

export interface Vendor {
  id: string;
  company_id: string;
  name: string;
  normalized_name: string | null;
  is_saas: boolean;
  default_category: ExpenseCategory | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  company_id: string;
  vendor_id: string | null;
  external_id: string | null;
  type: ExpenseType;
  amount: number;
  vat_amount: number | null;
  currency: string;
  transaction_date: string;
  description: string | null;
  category: ExpenseCategory;
  subcategory: string | null;
  is_recurring: boolean;
  source?: ExpenseSource; // Optional - derived from external_id presence
  is_trial_sample?: boolean; // Optional - not in DB schema
  created_at: string;
  updated_at: string;
  // Joined data
  vendor?: Vendor;
}

export interface MonthlySummary {
  id: string;
  company_id: string;
  year: number;
  month: number;
  total_spend: number;
  saas_spend: number;
  expense_spend: number;
  invoice_spend: number;
  created_at: string;
  updated_at: string;
}

export interface CategorySummary {
  id: string;
  company_id: string;
  year: number;
  month: number;
  category: ExpenseCategory;
  total_amount: number;
  created_at: string;
}

export interface SaaSSummary {
  id: string;
  company_id: string;
  vendor_id: string;
  year: number;
  month: number;
  total_amount: number;
  created_at: string;
  vendor?: Vendor;
}

export interface Integration {
  id: string;
  company_id: string;
  provider: string;
  status: IntegrationStatus;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

// Dashboard aggregated types
export interface DashboardData {
  currentMonth: MonthlySummary;
  previousMonth: MonthlySummary | null;
  categoryBreakdown: CategorySummary[];
  topVendors: Array<{ vendor: Vendor; total: number }>;
  topSaas: Array<{ vendor: Vendor; total: number; monthlyAvg: number }>;
  recentExpenses: Expense[];
}

// Filter state
export interface DashboardFilters {
  year: number;
  month: number;
  category?: ExpenseCategory;
  type?: ExpenseType;
}
