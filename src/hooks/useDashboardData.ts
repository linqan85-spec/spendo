import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Expense, Vendor, CategorySummary, MonthlySummary } from "@/types/spendo";

export interface DashboardData {
  currentMonth: MonthlySummary;
  previousMonth: MonthlySummary | null;
  categoryBreakdown: CategorySummary[];
  topVendors: Array<{ vendor: Vendor; total: number }>;
  topSaas: Array<{ vendor: Vendor; total: number; monthlyAvg: number }>;
  recentExpenses: Expense[];
  hasData: boolean;
}

export function useDashboardData(year: number, month: number) {
  const { companyId, isLoading: isAuthLoading } = useAuth();

  return useQuery({
    queryKey: ["dashboard-data", companyId, year, month],
    queryFn: async (): Promise<DashboardData> => {
      if (!companyId) {
        return getEmptyDashboardData(year, month);
      }

      // Fetch monthly summary for current month
      const { data: currentSummary } = await supabase
        .from("monthly_summaries")
        .select("*")
        .eq("company_id", companyId)
        .eq("year", year)
        .eq("month", month)
        .maybeSingle();

      // Fetch previous month summary
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const { data: previousSummary } = await supabase
        .from("monthly_summaries")
        .select("*")
        .eq("company_id", companyId)
        .eq("year", prevYear)
        .eq("month", prevMonth)
        .maybeSingle();

      // Fetch category summaries
      const { data: categorySummaries } = await supabase
        .from("category_summaries")
        .select("*")
        .eq("company_id", companyId)
        .eq("year", year)
        .eq("month", month);

      // Fetch expenses for current month with vendors
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, "0")}-01`;

      const { data: expenses } = await supabase
        .from("expenses")
        .select(`
          *,
          vendor:vendors(*)
        `)
        .eq("company_id", companyId)
        .gte("transaction_date", startDate)
        .lt("transaction_date", endDate)
        .order("transaction_date", { ascending: false });

      // Fetch all vendors
      const { data: vendors } = await supabase
        .from("vendors")
        .select("*")
        .eq("company_id", companyId);

      // Calculate top vendors from expenses
      const vendorTotals = new Map<string, number>();
      (expenses || []).forEach((exp) => {
        if (exp.vendor_id) {
          vendorTotals.set(
            exp.vendor_id,
            (vendorTotals.get(exp.vendor_id) || 0) + Number(exp.amount)
          );
        }
      });

      const topVendors = Array.from(vendorTotals.entries())
        .map(([vendor_id, total]) => ({
          vendor: (vendors || []).find((v) => v.id === vendor_id)!,
          total,
        }))
        .filter((v) => v.vendor)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      // Calculate top SaaS
      const saasVendors = topVendors.filter((v) => v.vendor.is_saas);
      const topSaas = saasVendors.map((v) => ({
        vendor: v.vendor,
        total: v.total,
        monthlyAvg: v.total, // Would need historical data for real avg
      }));

      const currentMonth: MonthlySummary = currentSummary || {
        id: "empty",
        company_id: companyId,
        year,
        month,
        total_spend: 0,
        saas_spend: 0,
        expense_spend: 0,
        invoice_spend: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const hasData = (expenses && expenses.length > 0) || 
                      (categorySummaries && categorySummaries.length > 0) ||
                      (currentSummary !== null);

      return {
        currentMonth,
        previousMonth: previousSummary || null,
        categoryBreakdown: categorySummaries || [],
        topVendors,
        topSaas,
        recentExpenses: (expenses || []).slice(0, 10).map((e) => ({
          ...e,
          vendor: e.vendor || undefined,
        })),
        hasData,
      };
    },
    enabled: !isAuthLoading && !!companyId,
  });
}

function getEmptyDashboardData(year: number, month: number): DashboardData {
  return {
    currentMonth: {
      id: "empty",
      company_id: "",
      year,
      month,
      total_spend: 0,
      saas_spend: 0,
      expense_spend: 0,
      invoice_spend: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    previousMonth: null,
    categoryBreakdown: [],
    topVendors: [],
    topSaas: [],
    recentExpenses: [],
    hasData: false,
  };
}

export function useAvailableMonths() {
  const { companyId, isLoading: isAuthLoading } = useAuth();

  return useQuery({
    queryKey: ["available-months", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data } = await supabase
        .from("monthly_summaries")
        .select("year, month")
        .eq("company_id", companyId)
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (!data || data.length === 0) {
        // Return current month as default
        const now = new Date();
        return [{
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          label: getMonthLabel(now.getFullYear(), now.getMonth() + 1),
        }];
      }

      const months = [
        "Januari", "Februari", "Mars", "April", "Maj", "Juni",
        "Juli", "Augusti", "September", "Oktober", "November", "December",
      ];

      return data.map((s) => ({
        year: s.year,
        month: s.month,
        label: `${months[s.month - 1]} ${s.year}`,
      }));
    },
    enabled: !isAuthLoading,
  });
}

function getMonthLabel(year: number, month: number): string {
  const months = [
    "Januari", "Februari", "Mars", "April", "Maj", "Juni",
    "Juli", "Augusti", "September", "Oktober", "November", "December",
  ];
  return `${months[month - 1]} ${year}`;
}
