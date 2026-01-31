import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, RefreshCw, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface KleerIntegrationProps {
  companyId: string | null;
  integration: {
    id: string;
    status: string;
    last_synced_at: string | null;
  } | null;
  onRefresh: () => void;
}

export function KleerIntegration({ companyId, integration, onRefresh }: KleerIntegrationProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
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

  const actionButton = status === "inactive" ? (
    companyId ? (
      <ConnectKleerDialog companyId={companyId} onSuccess={onRefresh} />
    ) : (
      <Button disabled size="sm">Anslut</Button>
    )
  ) : (
    <div className="flex gap-2">
      <Button onClick={handleSync} size="sm" className="gap-1.5">
        <RefreshCw className="h-3.5 w-3.5" />
        Synka
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
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
  );

  const featuresList = [
    "Leverantörsfakturor",
    "Utlägg och kvitton",
    "Leverantörsnamn",
    "Belopp och moms",
  ];

  return (
    <IntegrationCard
      name="Kleer"
      description="Tidigare PE Accounting"
      icon={<span className="font-bold text-lg">K</span>}
      status={status}
      lastSynced={integration?.last_synced_at}
      action={actionButton}
    >
      <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
            {isDetailsOpen ? "Dölj detaljer" : "Visa detaljer"}
            {isDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          {status === "inactive" && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">Så fungerar det:</p>
              <p className="text-muted-foreground">
                1. Kontakta Kleer för API-nyckel → 2. Anslut här → 3. Data synkas automatiskt
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-2">Vad som hämtas:</p>
            <div className="flex flex-wrap gap-2">
              {featuresList.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <Button variant="link" size="sm" className="p-0 h-auto text-xs" asChild>
            <a href="https://api-doc.kleer.se/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              API-dokumentation
            </a>
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </IntegrationCard>
  );
}
