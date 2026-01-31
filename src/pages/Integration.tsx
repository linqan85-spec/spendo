import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Loader2 } from "lucide-react";
import { KleerIntegration } from "@/components/integrations/KleerIntegration";
import { useKleerIntegration } from "@/hooks/useIntegrations";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Integration() {
  const { user } = useAuth();
  
  // Get user's company ID
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { integration: kleerIntegration, isLoading, refetch } = useKleerIntegration();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const companyId = profile?.company_id;

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
        <div className="grid gap-6">
          {companyId ? (
            <KleerIntegration
              companyId={companyId}
              integration={kleerIntegration}
              onRefresh={refetch}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>Du måste vara kopplad till ett företag för att hantera integrationer.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Data Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Synkstatus</CardTitle>
          </CardHeader>
          <CardContent>
            {kleerIntegration?.status === "active" ? (
              <div className="space-y-4">
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
                  <span className="text-xs text-primary font-medium">Aktiv</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>Ingen integration konfigurerad</p>
                <p className="text-sm">Anslut Kleer ovan för att börja synka data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Future Integrations Placeholder */}
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-2">Fler integrationer kommer snart</p>
          <p className="text-sm text-muted-foreground">
            Fortnox, Visma, Björn Lundén och fler...
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
