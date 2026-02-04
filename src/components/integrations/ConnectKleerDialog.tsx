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

interface ConnectKleerDialogProps {
  companyId: string;
  onSuccess: () => void;
}

export function ConnectKleerDialog({ companyId, onSuccess }: ConnectKleerDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kleerCompanyId, setKleerCompanyId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const handleConnect = async () => {
    if (!kleerCompanyId.trim() || !accessToken.trim()) {
      setError(t("integrations.kleer.connect.error_missing"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: existing } = await supabase
        .from("integrations")
        .select("id")
        .eq("company_id", companyId)
        .eq("provider", "kleer")
        .single();

      if (existing) {
        const { error: updateError } = await supabase
          .from("integrations")
          .update({
            access_token: accessToken.trim(),
            refresh_token: kleerCompanyId.trim(),
            status: "active" as const,
            last_synced_at: null,
          })
          .eq("id", existing.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("integrations")
          .insert([{
            company_id: companyId,
            provider: "kleer",
            access_token: accessToken.trim(),
            refresh_token: kleerCompanyId.trim(),
            status: "active" as const,
          }]);

        if (insertError) throw insertError;
      }

      toast.info(t("integrations.kleer.connect.toast_pending"));
      setOpen(false);
      setKleerCompanyId("");
      setAccessToken("");
      onSuccess();
    } catch (err) {
      console.error("Error connecting Kleer:", err);
      setError(t("integrations.kleer.connect.error_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">{t("integrations.kleer.connect.button")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("integrations.kleer.connect.title")}</DialogTitle>
          <DialogDescription>{t("integrations.kleer.connect.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="kleer-company-id">{t("integrations.kleer.connect.company_id")}</Label>
            <Input
              id="kleer-company-id"
              placeholder={t("integrations.kleer.connect.company_id_placeholder")}
              value={kleerCompanyId}
              onChange={(e) => setKleerCompanyId(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {t("integrations.kleer.connect.company_id_hint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access-token">{t("integrations.kleer.connect.access_token")}</Label>
            <Input
              id="access-token"
              type="password"
              placeholder={t("integrations.kleer.connect.access_token_placeholder")}
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {t("integrations.kleer.connect.access_token_hint")}
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium mb-1">{t("integrations.kleer.connect.help_title")}</p>
            <a
              href="https://api-doc.kleer.se/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              {t("integrations.kleer.connect.docs_link")}
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
