import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useIntegrations() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const query = useQuery({
    queryKey: ["integrations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && !isAuthLoading,
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
