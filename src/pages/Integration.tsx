import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Loader2, Clock } from "lucide-react";
import { KleerIntegration } from "@/components/integrations/KleerIntegration";
import { useKleerIntegration } from "@/hooks/useIntegrations";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

function ComingSoonCard({ name, description }: { name: string; description: string }) {
  return (
    <Card className="opacity-60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
              <span className="font-bold text-lg text-muted-foreground">{name[0]}</span>
            </div>
            <div>
              <CardTitle className="text-muted-foreground">{name}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Kommer snart
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Integration med {name} kommer inom kort.
        </p>
      </CardContent>
    </Card>
  );
}
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

        {/* Integrations Grid - Scalable for future integrations */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <KleerIntegration
            companyId={companyId}
            integration={kleerIntegration}
            onRefresh={refetch}
          />

          {/* Future integrations - coming soon cards */}
          <ComingSoonCard name="Fortnox" description="Bokföring & fakturering" />
          <ComingSoonCard name="Visma" description="Ekonomisystem" />
        </div>

        {/* Sync Status - only show if there's an active integration */}
        {kleerIntegration?.status === "active" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Synkstatus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center">
                    <span className="font-bold text-sm">K</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Kleer</p>
                    <p className="text-xs text-muted-foreground">
                      {kleerIntegration.last_synced_at
                        ? `Senast synkad: ${new Date(kleerIntegration.last_synced_at).toLocaleString("sv-SE")}`
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
