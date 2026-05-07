import { useMemo } from "react";
import type { Expense, PaymentCard, TeamMember } from "@/types/spendo";

export interface CardGuess {
  expense_id: string;
  member_id: string;
  card_id: string;
  confidence: number; // 0–100
  reason: string;
}

function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9åäö ]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Try to guess which member each unassigned expense belongs to,
 * based on payment_cards' match_keywords + last4 against expense description.
 */
export function useCardGuesses(
  expenses: Expense[],
  cards: PaymentCard[],
  members: TeamMember[]
): Map<string, CardGuess> {
  return useMemo(() => {
    const memberById = new Map(members.map((m) => [m.id, m]));
    const guesses = new Map<string, CardGuess>();

    for (const exp of expenses) {
      // Skip if already manually assigned with high confidence
      if (exp.assignment_source === "manual" && exp.assigned_member_id) continue;

      const desc = normalizeText(
        `${exp.description || ""} ${exp.vendor?.name || ""}`
      );
      if (!desc) continue;

      let best: CardGuess | null = null;

      for (const card of cards) {
        if (!memberById.has(card.member_id)) continue;
        let score = 0;
        const reasons: string[] = [];

        // last4 in description = high confidence
        if (card.last4 && desc.includes(card.last4)) {
          score += 70;
          reasons.push(`Kortnr slutar på ${card.last4}`);
        }

        // keyword match
        for (const kw of card.match_keywords) {
          const k = normalizeText(kw);
          if (k && desc.includes(k)) {
            score += 25;
            reasons.push(`Sökord "${kw}"`);
          }
        }

        if (score > 0 && (!best || score > best.confidence)) {
          best = {
            expense_id: exp.id,
            member_id: card.member_id,
            card_id: card.id,
            confidence: Math.min(95, score),
            reason: reasons.join(", "),
          };
        }
      }

      if (best) guesses.set(exp.id, best);
    }

    return guesses;
  }, [expenses, cards, members]);
}
