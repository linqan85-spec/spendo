import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface SubscriptionGate {
  /** True if user has access (active subscription OR within trial period) */
  hasAccess: boolean;
  /** True while loading subscription/trial status */
  isLoading: boolean;
  /** True if user is currently in trial */
  isTrialing: boolean;
  /** Days remaining in trial (0 if expired or not trialing) */
  trialDaysLeft: number;
  /** True if user has a paid Stripe subscription */
  isSubscribed: boolean;
  /** Start checkout flow */
  startCheckout: () => Promise<void>;
}

export function useSubscriptionGate(): SubscriptionGate {
  const { companyId, isSuperAdmin } = useAuth();
  const { subscribed, isLoading: isSubLoading, startCheckout } = useSubscription();

  const { data: company, isLoading: isCompanyLoading } = useQuery({
    queryKey: ["company-subscription", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from("companies")
        .select("subscription_status, trial_ends_at")
        .eq("id", companyId)
        .single();
      return data;
    },
    enabled: !!companyId,
  });

  const isLoading = isSubLoading || isCompanyLoading;

  const now = new Date();
  const trialEndsAt = company?.trial_ends_at ? new Date(company.trial_ends_at) : null;
  const isTrialing = company?.subscription_status === "trialing" && !!trialEndsAt && trialEndsAt > now;
  const trialDaysLeft = isTrialing && trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Superadmins always have access
  const hasAccess = isSuperAdmin || subscribed || isTrialing;

  return {
    hasAccess,
    isLoading,
    isTrialing,
    trialDaysLeft,
    isSubscribed: subscribed,
    startCheckout,
  };
}
