import { useMemo } from "react";
import type { Vendor, Expense } from "@/types/spendo";

export interface DuplicateGroup {
  /** Canonical name for this group */
  name: string;
  /** All vendors that match */
  vendors: Vendor[];
  /** Total monthly spend across duplicates */
  totalMonthlySpend: number;
  /** Potential savings if consolidated to one subscription */
  potentialSavings: number;
}

/**
 * Normalize a vendor name for comparison:
 * - lowercase
 * - strip common suffixes (AB, Inc, LLC, Ltd, GmbH, etc.)
 * - strip special characters
 * - collapse whitespace
 */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(ab|inc|llc|ltd|gmbh|oy|as|aps|se|com|io)\b/gi, "")
    .replace(/[^a-z0-9åäö]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

function areSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  // One contains the other
  if (a.includes(b) || b.includes(a)) return true;
  // Levenshtein for short names
  const maxLen = Math.max(a.length, b.length);
  if (maxLen <= 3) return a === b;
  const dist = levenshtein(a, b);
  return dist / maxLen < 0.3; // 30% threshold
}

export function useDuplicateDetector(
  vendors: Vendor[],
  expenses: Expense[]
): DuplicateGroup[] {
  return useMemo(() => {
    const saasVendors = vendors.filter((v) => v.is_saas);
    if (saasVendors.length < 2) return [];

    // Calculate monthly spend per vendor
    const vendorSpend = new Map<string, number>();
    const monthsSet = new Set<string>();
    expenses.forEach((e) => {
      if (e.vendor_id) {
        vendorSpend.set(e.vendor_id, (vendorSpend.get(e.vendor_id) || 0) + Number(e.amount));
        monthsSet.add(e.transaction_date.substring(0, 7));
      }
    });
    const numMonths = Math.max(1, monthsSet.size);

    // Group similar vendors
    const processed = new Set<string>();
    const groups: DuplicateGroup[] = [];

    for (let i = 0; i < saasVendors.length; i++) {
      if (processed.has(saasVendors[i].id)) continue;
      const normA = normalize(saasVendors[i].name);
      const group: Vendor[] = [saasVendors[i]];

      for (let j = i + 1; j < saasVendors.length; j++) {
        if (processed.has(saasVendors[j].id)) continue;
        const normB = normalize(saasVendors[j].name);
        if (areSimilar(normA, normB)) {
          group.push(saasVendors[j]);
          processed.add(saasVendors[j].id);
        }
      }

      if (group.length > 1) {
        processed.add(saasVendors[i].id);
        const spends = group.map((v) => (vendorSpend.get(v.id) || 0) / numMonths);
        const totalMonthlySpend = spends.reduce((a, b) => a + b, 0);
        const maxSingle = Math.max(...spends);
        const potentialSavings = totalMonthlySpend - maxSingle;

        groups.push({
          name: saasVendors[i].name,
          vendors: group,
          totalMonthlySpend,
          potentialSavings,
        });
      }
    }

    return groups.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }, [vendors, expenses]);
}
