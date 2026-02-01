import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, RefreshCw, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { IntegrationCard, IntegrationStatus } from "./IntegrationCard";
import { ConnectFortnoxDialog } from "./ConnectFortnoxDialog";
import { FortnoxDemoDialog } from "./FortnoxDemoDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import fortnoxLogo from "@/assets/integrations/fortnox-logo.ico";
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

interface FortnoxIntegrationProps {
  companyId: string | null;
  integration: {
    id: string;
    status: string;
    last_synced_at: string | null;
    access_token?: string | null;
  } | null;
  onRefresh: () => void;
}

export function FortnoxIntegration({ companyId, integration, onRefresh }: FortnoxIntegrationProps) {
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

      toast.success("Fortnox har kopplats bort");
      onRefresh();
    } catch (err) {
      console.error("Error disconnecting:", err);
      toast.error("Kunde inte koppla bort Fortnox");
    }
  };

  const handleSync = async () => {
    toast.info("Synkronisering startar...");
    // TODO: Implement actual sync via edge function
    toast.success("Synkronisering slutförd (demo)");
  };

  const isDemo = integration?.access_token === "demo_mode";

  const actionButton = status === "inactive" ? (
    companyId ? (
      <div className="flex gap-2">
        <ConnectFortnoxDialog companyId={companyId} onSuccess={onRefresh} />
        <FortnoxDemoDialog companyId={companyId} onSuccess={onRefresh} />
      </div>
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
            <AlertDialogTitle>Koppla bort Fortnox?</AlertDialogTitle>
            <AlertDialogDescription>
              Din befintliga data kommer finnas kvar, men ingen ny data kommer synkas 
              från Fortnox förrän du ansluter igen.
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
    "Kundfakturor",
    "Verifikationer",
    "Bokföring",
  ];

  return (
    <IntegrationCard
      name="Fortnox"
      description="Bokföring & fakturering"
      icon={<img src={fortnoxLogo} alt="Fortnox" className="h-6 w-6 object-contain" />}
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
                1. Skapa app på Developer Portal → 2. Anslut här → 3. Data synkas automatiskt
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
            <a href="https://api.fortnox.se/apidocs" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              API-dokumentation
            </a>
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </IntegrationCard>
  );
}
