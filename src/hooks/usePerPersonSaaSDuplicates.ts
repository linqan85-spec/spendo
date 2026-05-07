import { useMemo } from "react";
import type { Expense, TeamMember } from "@/types/spendo";

export interface PerPersonSaaSDuplicate {
  vendor_id: string;
  vendor_name: string;
  members: Array<{ member: TeamMember | null; monthlySpend: number; expenseCount: number }>;
  totalMonthlySpend: number;
  potentialSavings: number; // assume team-license costs the most expensive single seat * 1.2
  reason: string;
}

/**
 * Find SaaS vendors where multiple different people are paying.
 * That's a likely sign of "shadow SaaS" — same tool, separate seats,
 * could be consolidated into a team license.
 */
export function usePerPersonSaaSDuplicates(
  expenses: Expense[],
  members: TeamMember[],
  /** Includes confidence-based guesses too (key = expense id, value = member id) */
  guessAssignments?: Map<string, string>
): PerPersonSaaSDuplicate[] {
  return useMemo(() => {
    const memberById = new Map(members.map((m) => [m.id, m]));

    // Group SaaS expenses by vendor
    const byVendor = new Map<
      string,
      {
        vendor_name: string;
        // memberId (or "unknown:<idx>") -> { sum, count }
        perMember: Map<string, { sum: number; count: number; member: TeamMember | null }>;
        months: Set<string>;
      }
    >();

    for (const exp of expenses) {
      if (!exp.vendor || !exp.vendor.is_saas || !exp.vendor_id) continue;

      const memberId =
        exp.assigned_member_id ||
        guessAssignments?.get(exp.id) ||
        null;
      if (!memberId) continue; // need a person to flag duplicate-by-person

      const entry =
        byVendor.get(exp.vendor_id) ?? {
          vendor_name: exp.vendor.name,
          perMember: new Map(),
          months: new Set<string>(),
        };

      const cur = entry.perMember.get(memberId) ?? {
        sum: 0,
        count: 0,
        member: memberById.get(memberId) ?? null,
      };
      cur.sum += Number(exp.amount);
      cur.count += 1;
      entry.perMember.set(memberId, cur);
      entry.months.add(exp.transaction_date.substring(0, 7));
      byVendor.set(exp.vendor_id, entry);
    }

    const results: PerPersonSaaSDuplicate[] = [];

    for (const [vendor_id, entry] of byVendor.entries()) {
      if (entry.perMember.size < 2) continue; // need 2+ different people
      const numMonths = Math.max(1, entry.months.size);

      const members = Array.from(entry.perMember.values()).map((v) => ({
        member: v.member,
        monthlySpend: v.sum / numMonths,
        expenseCount: v.count,
      }));

      const totalMonthlySpend = members.reduce((a, b) => a + b.monthlySpend, 0);
      const maxSingle = Math.max(...members.map((m) => m.monthlySpend));
      // Assume a team license = most expensive seat * 1.2 (rough heuristic)
      const teamLicenseEst = maxSingle * 1.2;
      const potentialSavings = Math.max(0, totalMonthlySpend - teamLicenseEst);

      results.push({
        vendor_id,
        vendor_name: entry.vendor_name,
        members,
        totalMonthlySpend,
        potentialSavings,
        reason: `${members.length} personer betalar för ${entry.vendor_name} separat`,
      });
    }

    return results.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }, [expenses, members, guessAssignments]);
}
