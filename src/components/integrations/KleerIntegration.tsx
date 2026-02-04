import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, RefreshCw, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { IntegrationCard, IntegrationStatus } from "./IntegrationCard";
import { ConnectKleerDialog } from "./ConnectKleerDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import kleerLogo from "@/assets/integrations/kleer-logo.png";
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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const status: IntegrationStatus = (integration?.status as IntegrationStatus) || "inactive";
  const displayStatus: IntegrationStatus =
    status === "active" && !integration?.last_synced_at ? "connecting" : status;

  const handleDisconnect = async () => {
    if (!integration) return;

    try {
      const { error } = await supabase
        .from("integrations")
        .update({ status: "inactive", access_token: null, refresh_token: null })
        .eq("id", integration.id);

      if (error) throw error;

      toast.success(t("integrations.kleer.toast.disconnected"));
      onRefresh();
    } catch (err) {
      console.error("Error disconnecting:", err);
      toast.error(t("integrations.kleer.toast.disconnect_failed"));
    }
  };

  const handleSync = async () => {
    toast.error(t("integrations.sync.unavailable"));
  };

  const actionButton = status === "inactive" ? (
    companyId ? (
      <ConnectKleerDialog companyId={companyId} onSuccess={onRefresh} />
    ) : (
      <Button disabled size="sm">{t("common.connect")}</Button>
    )
  ) : (
    <div className="flex gap-2">
      <Button onClick={handleSync} size="sm" className="gap-1.5">
        <RefreshCw className="h-3.5 w-3.5" />
        {t("integrations.sync.button")}
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("integrations.kleer.disconnect.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("integrations.kleer.disconnect.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect}>
              {t("common.disconnect")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  const featuresList = [
    t("integrations.kleer.features.invoices"),
    t("integrations.kleer.features.expenses"),
    t("integrations.kleer.features.vendor_names"),
    t("integrations.kleer.features.amounts"),
  ];

  return (
    <IntegrationCard
      name="Kleer"
      description={t("integrations.kleer.description")}
      icon={<img src={kleerLogo} alt={t("integrations.kleer.name")} className="h-6 w-6 object-contain" />}
      status={displayStatus}
      lastSynced={integration?.last_synced_at}
      action={actionButton}
    >
      <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
            {isDetailsOpen ? t("integrations.details.hide") : t("integrations.details.show")}
            {isDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          {status === "inactive" && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">{t("integrations.how_it_works")}</p>
              <p className="text-muted-foreground">{t("integrations.kleer.how_to")}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-2">{t("integrations.kleer.data_title")}</p>
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
              {t("integrations.kleer.docs")}
            </a>
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </IntegrationCard>
  );
}
