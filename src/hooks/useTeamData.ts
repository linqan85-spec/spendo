import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { TeamMember, PaymentCard } from "@/types/spendo";
import { toast } from "sonner";

export function useTeamMembers() {
  const { companyId, isLoading: isAuthLoading } = useAuth();
  return useQuery({
    queryKey: ["team-members", companyId],
    queryFn: async (): Promise<TeamMember[]> => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("company_id", companyId)
        .order("name");
      if (error) throw error;
      return (data || []) as TeamMember[];
    },
    enabled: !isAuthLoading && !!companyId,
  });
}

export function usePaymentCards() {
  const { companyId, isLoading: isAuthLoading } = useAuth();
  return useQuery({
    queryKey: ["payment-cards", companyId],
    queryFn: async (): Promise<PaymentCard[]> => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("payment_cards")
        .select("*, member:team_members(*)")
        .eq("company_id", companyId)
        .order("label");
      if (error) throw error;
      return (data || []) as PaymentCard[];
    },
    enabled: !isAuthLoading && !!companyId,
  });
}

export function useAddTeamMember() {
  const { companyId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; email?: string }) => {
      if (!companyId) throw new Error("No company");
      const { error } = await supabase.from("team_members").insert({
        company_id: companyId,
        name: input.name,
        email: input.email || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Person tillagd");
    },
    onError: (e) => toast.error(`Kunde inte lägga till: ${(e as Error).message}`),
  });
}

export function useDeleteTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      qc.invalidateQueries({ queryKey: ["payment-cards"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Person borttagen");
    },
  });
}

export function useUpsertPaymentCard() {
  const { companyId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      member_id: string;
      label: string;
      last4?: string;
      match_keywords: string[];
    }) => {
      if (!companyId) throw new Error("No company");
      if (input.id) {
        const { error } = await supabase
          .from("payment_cards")
          .update({
            member_id: input.member_id,
            label: input.label,
            last4: input.last4 || null,
            match_keywords: input.match_keywords,
          })
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payment_cards").insert({
          company_id: companyId,
          member_id: input.member_id,
          label: input.label,
          last4: input.last4 || null,
          match_keywords: input.match_keywords,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-cards"] });
      toast.success("Kort sparat");
    },
    onError: (e) => toast.error(`Kunde inte spara: ${(e as Error).message}`),
  });
}

export function useDeletePaymentCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-cards"] });
      toast.success("Kort borttaget");
    },
  });
}

export function useAssignExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      expense_id: string;
      member_id: string | null;
    }) => {
      const { error } = await supabase
        .from("expenses")
        .update({
          assigned_member_id: input.member_id,
          assignment_source: input.member_id ? "manual" : "unassigned",
          assignment_confidence: input.member_id ? 100 : 0,
        })
        .eq("id", input.expense_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (e) => toast.error(`Kunde inte tilldela: ${(e as Error).message}`),
  });
}
