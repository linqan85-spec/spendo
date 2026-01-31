import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { IntegrationCard, IntegrationStatus } from "./IntegrationCard";
import { ConnectKleerDialog } from "./ConnectKleerDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface KleerIntegrationProps {
  companyId: string;
  integration: {
    id: string;
    status: string;
    last_synced_at: string | null;
  } | null;
  onRefresh: () => void;
}

export function KleerIntegration({ companyId, integration, onRefresh }: KleerIntegrationProps) {
  const status: IntegrationStatus = integration?.status as IntegrationStatus || "inactive";

  const handleDisconnect = async () => {
    if (!integration) return;

    try {
      const { error } = await supabase
        .from("integrations")
        .update({ status: "inactive", access_token: null, refresh_token: null })
        .eq("id", integration.id);

      if (error) throw error;

      toast.success("Kleer har kopplats bort");
      onRefresh();
    } catch (err) {
      console.error("Error disconnecting:", err);
      toast.error("Kunde inte koppla bort Kleer");
    }
  };

  const handleSync = async () => {
    toast.info("Synkronisering startar...");
    // TODO: Implement actual sync via edge function
    toast.success("Synkronisering slutförd (demo)");
  };

  return (
    <IntegrationCard
      name="Kleer"
      description="Tidigare PE Accounting"
      icon={<span className="font-bold text-lg">K</span>}
      status={status}
      lastSynced={integration?.last_synced_at}
    >
      <div className="space-y-6">
        {status === "inactive" ? (
          <>
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Så fungerar det</h4>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">1.</span>
                  Kontakta er konsult på Kleer för att få en API-nyckel
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">2.</span>
                  Ange bolagsid och API-nyckel nedan för att koppla ert konto
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">3.</span>
                  Spendo börjar automatiskt hämta leverantörsfakturor och utlägg
                </li>
              </ol>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Vad vi hämtar från Kleer:</p>
              <ul className="grid grid-cols-2 gap-2 text-sm">
                {[
                  "Leverantörsfakturor",
                  "Utlägg och kvitton",
                  "Leverantörsnamn",
                  "Belopp och moms",
                  "Transaktionsdatum",
                  "Beskrivningar",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <ConnectKleerDialog companyId={companyId} onSuccess={onRefresh} />
              <Button variant="outline" className="gap-2" asChild>
                <a href="https://api-doc.kleer.se/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  API-dokumentation
                </a>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Kleer är ansluten</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Data synkas automatiskt varje dag. Du kan också starta en manuell synkronisering.
              </p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Vad som synkas:</p>
              <ul className="grid grid-cols-2 gap-2 text-sm">
                {[
                  "Leverantörsfakturor",
                  "Utlägg och kvitton",
                  "Leverantörsnamn",
                  "Belopp och moms",
                  "Transaktionsdatum",
                  "Beskrivningar",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleSync} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Synka nu
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Koppla bort
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Koppla bort Kleer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Din befintliga data kommer finnas kvar, men ingen ny data kommer synkas 
                      från Kleer förrän du ansluter igen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDisconnect}>
                      Koppla bort
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </div>
    </IntegrationCard>
  );
}
