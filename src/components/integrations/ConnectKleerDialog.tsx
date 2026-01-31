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

interface ConnectKleerDialogProps {
  companyId: string;
  onSuccess: () => void;
}

export function ConnectKleerDialog({ companyId, onSuccess }: ConnectKleerDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [kleerCompanyId, setKleerCompanyId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const handleConnect = async () => {
    if (!kleerCompanyId.trim() || !accessToken.trim()) {
      setError("Fyll i både bolagsid och access token");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if integration already exists
      const { data: existing } = await supabase
        .from("integrations")
        .select("id")
        .eq("company_id", companyId)
        .eq("provider", "kleer")
        .single();

      if (existing) {
        // Update existing integration
        const { error: updateError } = await supabase
          .from("integrations")
          .update({
            access_token: accessToken.trim(),
            refresh_token: kleerCompanyId.trim(), // Store Kleer company ID in refresh_token field
            status: "active",
            last_synced_at: null,
          })
          .eq("id", existing.id);

        if (updateError) throw updateError;
      } else {
        // Create new integration
        const { error: insertError } = await supabase
          .from("integrations")
          .insert({
            company_id: companyId,
            provider: "kleer",
            access_token: accessToken.trim(),
            refresh_token: kleerCompanyId.trim(), // Store Kleer company ID in refresh_token field
            status: "active",
          });

        if (insertError) throw insertError;
      }

      toast.success("Kleer har anslutits!");
      setOpen(false);
      setKleerCompanyId("");
      setAccessToken("");
      onSuccess();
    } catch (err) {
      console.error("Error connecting Kleer:", err);
      setError("Kunde inte ansluta Kleer. Kontrollera dina uppgifter och försök igen.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">Anslut Kleer</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anslut Kleer</DialogTitle>
          <DialogDescription>
            Ange dina Kleer API-uppgifter för att börja synka data automatiskt.
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
            <Label htmlFor="kleer-company-id">Kleer Bolagsid</Label>
            <Input
              id="kleer-company-id"
              placeholder="t.ex. 12345"
              value={kleerCompanyId}
              onChange={(e) => setKleerCompanyId(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Hittas i Kleer under Inställningar → Bolagsinformation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access-token">Access Token</Label>
            <Input
              id="access-token"
              type="password"
              placeholder="Din API-nyckel från Kleer"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Be din Kleer-konsult om en API-nyckel
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium mb-1">Behöver du hjälp?</p>
            <a
              href="https://api-doc.kleer.se/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Kleer API-dokumentation
            </a>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Avbryt
          </Button>
          <Button onClick={handleConnect} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Anslut
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
