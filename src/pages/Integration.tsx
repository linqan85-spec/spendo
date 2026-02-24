import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Loader2 } from "lucide-react";
import { KleerIntegration } from "@/components/integrations/KleerIntegration";
import { FortnoxIntegration } from "@/components/integrations/FortnoxIntegration";
import { ComingSoonIntegrationCard } from "@/components/integrations/IntegrationCard";
import { useKleerIntegration, useFortnoxIntegration } from "@/hooks/useIntegrations";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import kleerLogo from "@/assets/integrations/kleer-logo.png";
import fortnoxLogo from "@/assets/integrations/fortnox-logo.ico";
import { useTranslation } from "react-i18next";
import { PaywallOverlay } from "@/components/PaywallOverlay";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";

export default function Integration() {
  const { t } = useTranslation();
  const { companyId, isLoading: isAuthLoading } = useAuth();
  const { integration: kleerIntegration, isLoading: isKleerLoading, refetch: refetchKleer } = useKleerIntegration();
  const { integration: fortnoxIntegration, isLoading: isFortnoxLoading, refetch: refetchFortnox } = useFortnoxIntegration();
  const { hasAccess, isLoading: isGateLoading, startCheckout } = useSubscriptionGate();

  const isLoading = isAuthLoading || isKleerLoading || isFortnoxLoading || isGateLoading;

  const isKleerLive = kleerIntegration?.status === "active" && !!kleerIntegration.last_synced_at;

  const activeIntegrations = [
    isKleerLive ? kleerIntegration : null,
    fortnoxIntegration?.status === "active" ? fortnoxIntegration : null,
  ].filter(Boolean);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!hasAccess) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("integrations.title")}</h1>
            <p className="text-muted-foreground">{t("integrations.subtitle")}</p>
          </div>
          <PaywallOverlay onUpgrade={startCheckout} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("integrations.title")}</h1>
          <p className="text-muted-foreground">{t("integrations.subtitle")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <KleerIntegration
            companyId={companyId}
            integration={kleerIntegration}
            onRefresh={refetchKleer}
          />
          <FortnoxIntegration
            companyId={companyId}
            integration={fortnoxIntegration}
            onRefresh={refetchFortnox}
          />
          <ComingSoonIntegrationCard
            name={t("integrations.coming_soon.visma")}
            description={t("integrations.coming_soon.accounting")}
          />
        </div>

        {activeIntegrations.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-sm mb-3">{t("integrations.sync_status.title")}</h3>
              <div className="space-y-2">
                {isKleerLive && kleerIntegration && (
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded bg-secondary flex items-center justify-center">
                        <img src={kleerLogo} alt={t("integrations.kleer.name")} className="h-4 w-4 object-contain" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{t("integrations.kleer.name")}</p>
                        <p className="text-xs text-muted-foreground">
                          {kleerIntegration.last_synced_at
                            ? t("integrations.sync_status.last_synced", {
                                date: new Date(kleerIntegration.last_synced_at).toLocaleString("sv-SE"),
                              })
                            : t("integrations.sync_status.never")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" className="gap-1 text-xs">
                      <RefreshCw className="h-3 w-3" />
                      {t("integrations.sync_status.active")}
                    </Badge>
                  </div>
                )}
                {fortnoxIntegration?.status === "active" && (
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded bg-secondary flex items-center justify-center">
                        <img src={fortnoxLogo} alt={t("integrations.fortnox.name")} className="h-4 w-4 object-contain" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{t("integrations.fortnox.name")}</p>
                        <p className="text-xs text-muted-foreground">
                          {fortnoxIntegration.last_synced_at
                            ? t("integrations.sync_status.last_synced", {
                                date: new Date(fortnoxIntegration.last_synced_at).toLocaleString("sv-SE"),
                              })
                            : t("integrations.sync_status.never")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" className="gap-1 text-xs">
                      <RefreshCw className="h-3 w-3" />
                      {t("integrations.sync_status.active")}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
