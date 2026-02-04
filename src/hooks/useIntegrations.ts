import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Type for the public view (without sensitive token fields)
export interface IntegrationPublic {
  id: string;
  company_id: string;
  provider: string;
  status: "active" | "inactive" | "error";
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

// Type for the full integration (with tokens - only for owners/admins)
export interface IntegrationFull extends IntegrationPublic {
  access_token: string | null;
  refresh_token: string | null;
}

/**
 * Hook to fetch integrations using the public view (no token exposure).
 * This is safe for all company users to call.
 */
export function useIntegrations() {
  const { user, isLoading: isAuthLoading, companyId } = useAuth();

  const query = useQuery({
    queryKey: ["integrations-public", user?.id, companyId],
    queryFn: async (): Promise<IntegrationPublic[]> => {
      if (!user || !companyId) return [];

      // Use the public view that doesn't expose tokens
      const { data, error } = await supabase
        .from("integrations_public")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as IntegrationPublic[];
    },
    enabled: !!user && !isAuthLoading && !!companyId,
  });

  return {
    ...query,
    isLoading: isAuthLoading || query.isLoading,
  };
}

/**
 * Hook for owners/admins to fetch full integration data including tokens.
 * Only owners and admins can access this data due to RLS.
 */
export function useIntegrationsFull() {
  const { user, isLoading: isAuthLoading, userRole } = useAuth();
  const isOwnerOrAdmin = userRole === "owner" || userRole === "admin";

  const query = useQuery({
    queryKey: ["integrations-full", user?.id],
    queryFn: async (): Promise<IntegrationFull[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as IntegrationFull[];
    },
    enabled: !!user && !isAuthLoading && isOwnerOrAdmin,
  });

  return {
    ...query,
    isLoading: isAuthLoading || query.isLoading,
  };
}

export function useKleerIntegration() {
  const { data: integrations, isLoading, refetch } = useIntegrations();

  const kleerIntegration = integrations?.find((i) => i.provider === "kleer") || null;

  return {
    integration: kleerIntegration,
    isLoading,
    refetch,
  };
}

export function useFortnoxIntegration() {
  const { data: integrations, isLoading, refetch } = useIntegrations();

  const fortnoxIntegration = integrations?.find((i) => i.provider === "fortnox") || null;

  return {
    integration: fortnoxIntegration,
    isLoading,
    refetch,
  };
}

// Full data hooks for owners/admins who need to manage tokens
export function useKleerIntegrationFull() {
  const { data: integrations, isLoading, refetch } = useIntegrationsFull();

  const kleerIntegration = integrations?.find((i) => i.provider === "kleer") || null;

  return {
    integration: kleerIntegration,
    isLoading,
    refetch,
  };
}

export function useFortnoxIntegrationFull() {
  const { data: integrations, isLoading, refetch } = useIntegrationsFull();

  const fortnoxIntegration = integrations?.find((i) => i.provider === "fortnox") || null;

  return {
    integration: fortnoxIntegration,
    isLoading,
    refetch,
  };
}
