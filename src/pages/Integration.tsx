import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Loader2 } from "lucide-react";
import { KleerIntegration } from "@/components/integrations/KleerIntegration";
import { FortnoxIntegration } from "@/components/integrations/FortnoxIntegration";
import { ComingSoonIntegrationCard } from "@/components/integrations/IntegrationCard";
import { useKleerIntegration, useFortnoxIntegration } from "@/hooks/useIntegrations";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

export default function Integration() {
  const { companyId, isLoading: isAuthLoading } = useAuth();
  const { integration: kleerIntegration, isLoading: isKleerLoading, refetch: refetchKleer } = useKleerIntegration();
  const { integration: fortnoxIntegration, isLoading: isFortnoxLoading, refetch: refetchFortnox } = useFortnoxIntegration();

  const isLoading = isAuthLoading || isKleerLoading || isFortnoxLoading;

  // Count active integrations
  const activeIntegrations = [
    kleerIntegration?.status === "active" ? kleerIntegration : null,
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrationer</h1>
          <p className="text-muted-foreground">
            Anslut externa system för att automatiskt hämta data
          </p>
        </div>

        {/* Integrations Grid */}
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
          <ComingSoonIntegrationCard name="Visma" description="Ekonomisystem" />
        </div>

        {/* Sync Status - only show if there are active integrations */}
        {activeIntegrations.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-sm mb-3">Synkstatus</h3>
              <div className="space-y-2">
                {kleerIntegration?.status === "active" && (
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded bg-secondary flex items-center justify-center">
                        <span className="font-bold text-xs">K</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Kleer</p>
                        <p className="text-xs text-muted-foreground">
                          {kleerIntegration.last_synced_at
                            ? `Senast: ${new Date(kleerIntegration.last_synced_at).toLocaleString("sv-SE")}`
                            : "Ingen synk ännu"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" className="gap-1 text-xs">
                      <RefreshCw className="h-3 w-3" />
                      Aktiv
                    </Badge>
                  </div>
                )}
                {fortnoxIntegration?.status === "active" && (
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded bg-secondary flex items-center justify-center">
                        <span className="font-bold text-xs">F</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Fortnox</p>
                        <p className="text-xs text-muted-foreground">
                          {fortnoxIntegration.last_synced_at
                            ? `Senast: ${new Date(fortnoxIntegration.last_synced_at).toLocaleString("sv-SE")}`
                            : "Ingen synk ännu"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" className="gap-1 text-xs">
                      <RefreshCw className="h-3 w-3" />
                      Aktiv
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
