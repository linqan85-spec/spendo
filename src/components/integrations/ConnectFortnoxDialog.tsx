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

interface ConnectFortnoxDialogProps {
  companyId: string;
  onSuccess: () => void;
}

export function ConnectFortnoxDialog({ companyId, onSuccess }: ConnectFortnoxDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  const handleConnect = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setError("Fyll i både Client ID och Client Secret");
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
        .eq("provider", "fortnox")
        .single();

      if (existing) {
        // Update existing integration
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
        // Create new integration
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

      toast.success("Fortnox har anslutits!");
      setOpen(false);
      setClientId("");
      setClientSecret("");
      onSuccess();
    } catch (err) {
      console.error("Error connecting Fortnox:", err);
      setError("Kunde inte ansluta Fortnox. Kontrollera dina uppgifter och försök igen.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">Anslut Fortnox</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anslut Fortnox</DialogTitle>
          <DialogDescription>
            Ange dina Fortnox API-uppgifter för att börja synka data automatiskt.
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
            <Label htmlFor="fortnox-client-id">Client ID</Label>
            <Input
              id="fortnox-client-id"
              placeholder="Din Fortnox Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Hittas i Fortnox Developer Portal under din app
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fortnox-client-secret">Client Secret</Label>
            <Input
              id="fortnox-client-secret"
              type="password"
              placeholder="Din Fortnox Client Secret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Skapas tillsammans med din app i Developer Portal
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium mb-1">Så får du API-åtkomst:</p>
            <ol className="text-muted-foreground space-y-1 text-xs list-decimal list-inside">
              <li>Registrera dig på Fortnox Developer Portal</li>
              <li>Skapa en ny app för att få Client ID & Secret</li>
              <li>Aktivera de scope du behöver (fakturor, bokföring, etc.)</li>
            </ol>
            <a
              href="https://www.fortnox.se/developer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 mt-2"
            >
              <ExternalLink className="h-3 w-3" />
              Fortnox Developer Portal
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
