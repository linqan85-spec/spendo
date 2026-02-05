import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IntegrationPricing {
  id: string;
  name: string;
  price: number;
  included_in_base: boolean;
}

export interface PricingSettings {
  base_price: number;
  extra_user_price: number;
  trial_days: number;
  currency: string;
  features: string[];
  integrations: IntegrationPricing[];
}

export interface SiteSettings {
  pricing: PricingSettings;
}

const DEFAULT_PRICING: PricingSettings = {
  base_price: 499,
  extra_user_price: 99,
  trial_days: 14,
  currency: "kr",
  features: [
    "Obegränsat antal transaktioner",
    "Automatisk kategorisering",
    "SaaS-identifiering",
    "Schemalagda rapporter (max 1/vecka)",
    "PDF & CSV-export",
    "1 användare inkluderad",
  ],
  integrations: [
    { id: "kleer", name: "Kleer", price: 0, included_in_base: true },
    { id: "fortnox", name: "Fortnox", price: 99, included_in_base: false },
    { id: "visma", name: "Visma", price: 149, included_in_base: false },
    { id: "bjorn-lunden", name: "Björn Lundén", price: 149, included_in_base: false },
  ],
};

export function usePricingSettings() {
  return useQuery({
    queryKey: ["site-settings", "pricing"],
    queryFn: async (): Promise<PricingSettings> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "pricing")
        .maybeSingle();

      if (error) {
        console.error("Error fetching pricing settings:", error);
        return DEFAULT_PRICING;
      }

      if (!data || !data.value) {
        return DEFAULT_PRICING;
      }

      // Safe type assertion through unknown
      const value = data.value as unknown as PricingSettings;
      return value;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdatePricingSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pricing: PricingSettings) => {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "pricing")
        .maybeSingle();

      // Convert to JSON-compatible format
      const jsonValue = JSON.parse(JSON.stringify(pricing));

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value: jsonValue })
          .eq("key", "pricing");

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert([{ key: "pricing", value: jsonValue }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings", "pricing"] });
    },
  });
}
