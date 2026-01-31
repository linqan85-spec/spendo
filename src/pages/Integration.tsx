import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Loader2 } from "lucide-react";
import { KleerIntegration } from "@/components/integrations/KleerIntegration";
import { ComingSoonIntegrationCard } from "@/components/integrations/IntegrationCard";
import { useKleerIntegration } from "@/hooks/useIntegrations";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

export default function Integration() {
  const { companyId, isLoading: isAuthLoading } = useAuth();
  const { integration: kleerIntegration, isLoading: isIntegrationLoading, refetch } = useKleerIntegration();

  const isLoading = isAuthLoading || isIntegrationLoading;

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
            onRefresh={refetch}
          />
          <ComingSoonIntegrationCard name="Fortnox" description="Bokföring & fakturering" />
          <ComingSoonIntegrationCard name="Visma" description="Ekonomisystem" />
        </div>

        {/* Sync Status - only show if there's an active integration */}
        {kleerIntegration?.status === "active" && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center">
                    <span className="font-bold text-sm">K</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Kleer synkstatus</p>
                    <p className="text-xs text-muted-foreground">
                      {kleerIntegration.last_synced_at
                        ? `Senast: ${new Date(kleerIntegration.last_synced_at).toLocaleString("sv-SE")}`
                        : "Ingen synk genomförd ännu"}
                    </p>
                  </div>
                </div>
                <Badge variant="default" className="gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Aktiv
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
