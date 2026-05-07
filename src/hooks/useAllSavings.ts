import { useMemo } from "react";
import { useVendors, useExpenses } from "@/hooks/useExpensesData";
import { useTeamMembers, usePaymentCards } from "@/hooks/useTeamData";
import { useDuplicateDetector } from "@/hooks/useDuplicateDetector";
import { useCardGuesses } from "@/hooks/useCardGuesses";
import { usePerPersonSaaSDuplicates } from "@/hooks/usePerPersonSaaSDuplicates";

/**
 * Aggregates all savings opportunities:
 * - Vendor name duplicates (e.g. "Figma Inc" + "Figma AB")
 * - Per-person SaaS duplicates (e.g. Anna + Erik each pay Figma separately)
 */
export function useAllSavings() {
  const { data: vendors = [], isLoading: lv } = useVendors();
  const { data: expenses = [], isLoading: le } = useExpenses();
  const { data: members = [], isLoading: lm } = useTeamMembers();
  const { data: cards = [], isLoading: lc } = usePaymentCards();

  const vendorDuplicates = useDuplicateDetector(vendors, expenses);
  const guesses = useCardGuesses(expenses, cards, members);

  const guessAssignments = useMemo(() => {
    const m = new Map<string, string>();
    guesses.forEach((g, expId) => m.set(expId, g.member_id));
    return m;
  }, [guesses]);

  const personDuplicates = usePerPersonSaaSDuplicates(expenses, members, guessAssignments);

  const totalMonthlySavings = useMemo(() => {
    const a = vendorDuplicates.reduce((s, d) => s + d.potentialSavings, 0);
    const b = personDuplicates.reduce((s, d) => s + d.potentialSavings, 0);
    return a + b;
  }, [vendorDuplicates, personDuplicates]);

  const totalAlerts = vendorDuplicates.length + personDuplicates.length;

  return {
    vendorDuplicates,
    personDuplicates,
    totalMonthlySavings,
    totalAlerts,
    isLoading: lv || le || lm || lc,
  };
}
