import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, RefreshCw, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
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
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

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
  const { t } = useTranslation();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const status: IntegrationStatus = (integration?.status as IntegrationStatus) || "inactive";

  // Handle OAuth callback results from URL params
  useEffect(() => {
    const fortnoxSuccess = searchParams.get("fortnox_success");
    const fortnoxError = searchParams.get("fortnox_error");

    if (fortnoxSuccess) {
      toast.success(t("integrations.fortnox.connect.toast_success"));
      searchParams.delete("fortnox_success");
      setSearchParams(searchParams, { replace: true });
      onRefresh();
    } else if (fortnoxError) {
      toast.error(t("integrations.fortnox.toast.oauth_failed", { error: fortnoxError }));
      searchParams.delete("fortnox_error");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, onRefresh, t]);

  const handleDisconnect = async () => {
    if (!integration) return;

    try {
      const { error } = await supabase
        .from("integrations")
        .update({ status: "inactive", access_token: null, refresh_token: null })
        .eq("id", integration.id);

      if (error) throw error;

      toast.success(t("integrations.fortnox.toast.disconnected"));
      onRefresh();
    } catch (err) {
      console.error("Error disconnecting:", err);
      toast.error(t("integrations.fortnox.toast.disconnect_failed"));
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    toast.info(t("integrations.sync.starting"));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Du måste vara inloggad för att synka.");
        return;
      }

      const res = await supabase.functions.invoke("fortnox-sync", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.error) {
        throw new Error(res.error.message || "Sync failed");
      }

      const result = res.data;
      toast.success(
        t("integrations.sync.completed", {
          invoices: result.invoices_fetched,
          vendors: result.vendors_created,
          created: result.expenses_created,
          updated: result.expenses_updated,
        })
      );
      onRefresh();
    } catch (err: any) {
      console.error("Fortnox sync error:", err);
      toast.error(t("integrations.sync.failed", { error: err.message }));
    } finally {
      setIsSyncing(false);
    }
  };

  const actionButton = status === "inactive" ? (
    companyId ? (
      <div className="flex gap-2">
        <ConnectFortnoxDialog companyId={companyId} onSuccess={onRefresh} />
        <FortnoxDemoDialog companyId={companyId} onSuccess={onRefresh} />
      </div>
    ) : (
      <Button disabled size="sm">{t("common.connect")}</Button>
    )
  ) : (
    <div className="flex gap-2">
      <Button onClick={handleSync} size="sm" className="gap-1.5" disabled={isSyncing}>
        {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        {isSyncing ? t("integrations.sync.syncing") : t("integrations.sync.button")}
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("integrations.fortnox.disconnect.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("integrations.fortnox.disconnect.description")}</AlertDialogDescription>
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
    t("integrations.fortnox.features.vendor_invoices"),
    t("integrations.fortnox.features.customer_invoices"),
    t("integrations.fortnox.features.vouchers"),
    t("integrations.fortnox.features.accounting"),
  ];

  return (
    <IntegrationCard
      name="Fortnox"
      description={t("integrations.fortnox.description")}
      icon={<img src={fortnoxLogo} alt={t("integrations.fortnox.name")} className="h-6 w-6 object-contain" />}
      status={status}
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
              <p className="text-muted-foreground">{t("integrations.fortnox.how_to")}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-2">{t("integrations.fortnox.data_title")}</p>
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
              {t("integrations.fortnox.docs")}
            </a>
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </IntegrationCard>
  );
}
