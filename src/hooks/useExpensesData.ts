import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Expense, Vendor } from "@/types/spendo";
import { toast } from "sonner";

export function useExpenses() {
  const { companyId, isLoading: isAuthLoading } = useAuth();

  return useQuery({
    queryKey: ["expenses", companyId],
    queryFn: async (): Promise<Expense[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("expenses")
        .select(`
          *,
          vendor:vendors(*)
        `)
        .eq("company_id", companyId)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !isAuthLoading && !!companyId,
  });
}

export function useVendors() {
  const { companyId, isLoading: isAuthLoading } = useAuth();

  return useQuery({
    queryKey: ["vendors", companyId],
    queryFn: async (): Promise<Vendor[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("company_id", companyId)
        .order("name");

      if (error) throw error;
      return data || [];
    },
    enabled: !isAuthLoading && !!companyId,
  });
}

interface AddExpenseData {
  vendor_name: string;
  amount: number;
  transaction_date: string;
  description: string;
  category: string;
  type: "expense" | "invoice";
}

export function useAddExpense() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddExpenseData) => {
      if (!companyId) throw new Error("No company ID");

      // Find or create vendor
      let { data: existingVendor } = await supabase
        .from("vendors")
        .select("id")
        .eq("company_id", companyId)
        .ilike("name", data.vendor_name)
        .maybeSingle();

      let vendorId: string;

      if (existingVendor) {
        vendorId = existingVendor.id;
      } else {
        const { data: newVendor, error: vendorError } = await supabase
          .from("vendors")
          .insert({
            company_id: companyId,
            name: data.vendor_name,
            normalized_name: data.vendor_name.toLowerCase().replace(/\s+/g, "_"),
            is_saas: false,
            default_category: data.category as any,
          })
          .select("id")
          .single();

        if (vendorError) throw vendorError;
        vendorId = newVendor.id;
      }

      // Create expense
      const { error: expenseError } = await supabase
        .from("expenses")
        .insert({
          company_id: companyId,
          vendor_id: vendorId,
          amount: data.amount,
          transaction_date: data.transaction_date,
          description: data.description,
          category: data.category as any,
          type: data.type,
          currency: "SEK",
        });

      if (expenseError) throw expenseError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast.success("Utgift tillagd!");
    },
    onError: (error) => {
      console.error("Error adding expense:", error);
      toast.error("Kunde inte lägga till utgift");
    },
  });
}

export function useManualExpenseCount() {
  const { companyId, isLoading: isAuthLoading } = useAuth();

  return useQuery({
    queryKey: ["manual-expense-count", companyId],
    queryFn: async (): Promise<number> => {
      if (!companyId) return 0;

      const { count, error } = await supabase
        .from("expenses")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .is("external_id", null);

      if (error) throw error;
      return count || 0;
    },
    enabled: !isAuthLoading && !!companyId,
  });
}
