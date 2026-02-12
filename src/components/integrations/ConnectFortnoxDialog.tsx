import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface ConnectFortnoxDialogProps {
  companyId: string;
  onSuccess: () => void;
}

export function ConnectFortnoxDialog({ companyId }: ConnectFortnoxDialogProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Du måste vara inloggad.");
        return;
      }

      const res = await supabase.functions.invoke("fortnox-auth-url", {
        body: { company_id: companyId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error || !res.data?.auth_url) {
        throw new Error(res.error?.message || "Could not get auth URL");
      }

      // Open Fortnox OAuth in a new window (iframe CSP blocks it)
      window.open(res.data.auth_url, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      console.error("Error starting Fortnox OAuth:", err);
      toast.error(t("integrations.fortnox.connect.error_failed"));
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleConnect} className="gap-2" disabled={isLoading}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
      {t("integrations.fortnox.connect.button")}
    </Button>
  );
}
