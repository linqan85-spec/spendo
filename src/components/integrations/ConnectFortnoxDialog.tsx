import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface ConnectFortnoxDialogProps {
  companyId: string;
  onSuccess: () => void;
}

export function ConnectFortnoxDialog({ companyId, onSuccess }: ConnectFortnoxDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  const handleConnect = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setError(t("integrations.fortnox.connect.error_missing"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: existing } = await supabase
        .from("integrations")
        .select("id")
        .eq("company_id", companyId)
        .eq("provider", "fortnox")
        .single();

      if (existing) {
        const { error: updateError } = await supabase
          .from("integrations")
          .update({
            access_token: clientSecret.trim(),
            refresh_token: clientId.trim(),
            status: "active",
            last_synced_at: null,
          })
          .eq("id", existing.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("integrations")
          .insert({
            company_id: companyId,
            provider: "fortnox",
            access_token: clientSecret.trim(),
            refresh_token: clientId.trim(),
            status: "active",
          });

        if (insertError) throw insertError;
      }

      toast.success(t("integrations.fortnox.connect.toast_success"));
      setOpen(false);
      setClientId("");
      setClientSecret("");
      onSuccess();
    } catch (err) {
      console.error("Error connecting Fortnox:", err);
      setError(t("integrations.fortnox.connect.error_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">{t("integrations.fortnox.connect.button")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("integrations.fortnox.connect.title")}</DialogTitle>
          <DialogDescription>
            {t("integrations.fortnox.connect.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="fortnox-client-id">{t("integrations.fortnox.connect.client_id")}</Label>
            <Input
              id="fortnox-client-id"
              placeholder={t("integrations.fortnox.connect.client_id_placeholder")}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {t("integrations.fortnox.connect.client_id_hint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fortnox-client-secret">{t("integrations.fortnox.connect.client_secret")}</Label>
            <Input
              id="fortnox-client-secret"
              type="password"
              placeholder={t("integrations.fortnox.connect.client_secret_placeholder")}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {t("integrations.fortnox.connect.client_secret_hint")}
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium mb-1">
              {t("integrations.fortnox.connect.steps_title")}
            </p>
            <ol className="text-muted-foreground space-y-1 text-xs list-decimal list-inside">
              <li>{t("integrations.fortnox.connect.steps.one")}</li>
              <li>{t("integrations.fortnox.connect.steps.two")}</li>
              <li>{t("integrations.fortnox.connect.steps.three")}</li>
            </ol>
            <a
              href="https://www.fortnox.se/developer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 mt-2"
            >
              <ExternalLink className="h-3 w-3" />
              {t("integrations.fortnox.connect.portal_link")}
            </a>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleConnect} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("common.connect")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
