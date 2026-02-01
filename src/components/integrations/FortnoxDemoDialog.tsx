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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Play, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FortnoxDemoDialogProps {
  companyId: string;
  onSuccess: () => void;
}

const DEMO_VENDORS = [
  { name: "Microsoft 365", is_saas: true, default_category: "saas" as const },
  { name: "Slack", is_saas: true, default_category: "saas" as const },
  { name: "Adobe Creative Cloud", is_saas: true, default_category: "saas" as const },
  { name: "Kontorsmaterial AB", is_saas: false, default_category: "kontor" as const },
  { name: "SJ", is_saas: false, default_category: "resor" as const },
  { name: "Google Ads", is_saas: false, default_category: "marknadsforing" as const },
  { name: "AWS", is_saas: true, default_category: "it_verktyg" as const },
  { name: "Figma", is_saas: true, default_category: "saas" as const },
];

function generateDemoExpenses(vendorIds: Record<string, string>, companyId: string) {
  const expenses: Array<{
    company_id: string;
    vendor_id: string;
    amount: number;
    category: "saas" | "resor" | "kontor" | "marknadsforing" | "it_verktyg" | "ovrigt";
    description: string;
    transaction_date: string;
    type: "expense" | "invoice";
    is_recurring: boolean;
    currency: string;
  }> = [];

  const now = new Date();

  // Generate 3 months of data
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const month = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    
    // Microsoft 365 - monthly subscription
    expenses.push({
      company_id: companyId,
      vendor_id: vendorIds["Microsoft 365"],
      amount: 1299,
      category: "saas",
      description: "Microsoft 365 Business Premium",
      transaction_date: new Date(month.getFullYear(), month.getMonth(), 5).toISOString().split("T")[0],
      type: "invoice",
      is_recurring: true,
      currency: "SEK",
    });

    // Slack
    expenses.push({
      company_id: companyId,
      vendor_id: vendorIds["Slack"],
      amount: 890,
      category: "saas",
      description: "Slack Pro - 5 användare",
      transaction_date: new Date(month.getFullYear(), month.getMonth(), 1).toISOString().split("T")[0],
      type: "invoice",
      is_recurring: true,
      currency: "SEK",
    });

    // Adobe
    expenses.push({
      company_id: companyId,
      vendor_id: vendorIds["Adobe Creative Cloud"],
      amount: 4599,
      category: "saas",
      description: "Adobe Creative Cloud All Apps",
      transaction_date: new Date(month.getFullYear(), month.getMonth(), 15).toISOString().split("T")[0],
      type: "invoice",
      is_recurring: true,
      currency: "SEK",
    });

    // Figma
    expenses.push({
      company_id: companyId,
      vendor_id: vendorIds["Figma"],
      amount: 1500,
      category: "saas",
      description: "Figma Professional",
      transaction_date: new Date(month.getFullYear(), month.getMonth(), 10).toISOString().split("T")[0],
      type: "invoice",
      is_recurring: true,
      currency: "SEK",
    });

    // AWS - varying amounts
    expenses.push({
      company_id: companyId,
      vendor_id: vendorIds["AWS"],
      amount: 2500 + Math.floor(Math.random() * 1000),
      category: "it_verktyg",
      description: "AWS molntjänster",
      transaction_date: new Date(month.getFullYear(), month.getMonth(), 28).toISOString().split("T")[0],
      type: "invoice",
      is_recurring: true,
      currency: "SEK",
    });

    // Kontorsmaterial
    if (monthOffset === 0 || monthOffset === 2) {
      expenses.push({
        company_id: companyId,
        vendor_id: vendorIds["Kontorsmaterial AB"],
        amount: 1850 + Math.floor(Math.random() * 500),
        category: "kontor",
        description: "Kontorsmaterial och förbrukning",
        transaction_date: new Date(month.getFullYear(), month.getMonth(), 12).toISOString().split("T")[0],
        type: "invoice",
        is_recurring: false,
        currency: "SEK",
      });
    }

    // SJ resor
    expenses.push({
      company_id: companyId,
      vendor_id: vendorIds["SJ"],
      amount: 450 + Math.floor(Math.random() * 300),
      category: "resor",
      description: "Tjänsteresor Stockholm-Göteborg",
      transaction_date: new Date(month.getFullYear(), month.getMonth(), 8).toISOString().split("T")[0],
      type: "expense",
      is_recurring: false,
      currency: "SEK",
    });

    // Google Ads
    expenses.push({
      company_id: companyId,
      vendor_id: vendorIds["Google Ads"],
      amount: 5000 + Math.floor(Math.random() * 2000),
      category: "marknadsforing",
      description: "Google Ads-kampanjer",
      transaction_date: new Date(month.getFullYear(), month.getMonth(), 25).toISOString().split("T")[0],
      type: "invoice",
      is_recurring: true,
      currency: "SEK",
    });
  }

  return expenses;
}

export function FortnoxDemoDialog({ companyId, onSuccess }: FortnoxDemoDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");

  const handleStartDemo = async () => {
    setIsLoading(true);
    setError(null);
    setProgress("Skapar leverantörer...");

    try {
      // Step 1: Create vendors
      const vendorInserts = DEMO_VENDORS.map((v) => ({
        company_id: companyId,
        name: v.name,
        normalized_name: v.name.toLowerCase().replace(/\s+/g, "_"),
        is_saas: v.is_saas,
        default_category: v.default_category,
      }));

      const { data: createdVendors, error: vendorError } = await supabase
        .from("vendors")
        .upsert(vendorInserts, { onConflict: "company_id,normalized_name", ignoreDuplicates: true })
        .select();

      if (vendorError) throw vendorError;

      // Fetch all vendors for this company to get IDs
      const { data: allVendors, error: fetchError } = await supabase
        .from("vendors")
        .select("id, name")
        .eq("company_id", companyId);

      if (fetchError) throw fetchError;

      const vendorIds: Record<string, string> = {};
      allVendors?.forEach((v) => {
        vendorIds[v.name] = v.id;
      });

      setProgress("Skapar kostnader och fakturor...");

      // Step 2: Create expenses
      const demoExpenses = generateDemoExpenses(vendorIds, companyId);
      
      const { error: expenseError } = await supabase
        .from("expenses")
        .insert(demoExpenses);

      if (expenseError) throw expenseError;

      setProgress("Aktiverar Fortnox-integration...");

      // Step 3: Create/update Fortnox integration as active
      const { data: existing } = await supabase
        .from("integrations")
        .select("id")
        .eq("company_id", companyId)
        .eq("provider", "fortnox")
        .single();

      if (existing) {
        await supabase
          .from("integrations")
          .update({
            status: "active",
            access_token: "demo_mode",
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("integrations")
          .insert({
            company_id: companyId,
            provider: "fortnox",
            status: "active",
            access_token: "demo_mode",
            last_synced_at: new Date().toISOString(),
          });
      }

      toast.success("Demo-data har skapats! Fortnox är nu ansluten i demo-läge.");
      setOpen(false);
      onSuccess();
    } catch (err) {
      console.error("Error creating demo data:", err);
      setError("Kunde inte skapa demo-data. Försök igen.");
    } finally {
      setIsLoading(false);
      setProgress("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Play className="h-4 w-4" />
          Testa demo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Testa Fortnox-integration med demodata</DialogTitle>
          <DialogDescription>
            Skapa exempeldata för att se hur integrationen fungerar utan att ansluta ett riktigt Fortnox-konto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="font-medium text-sm">Följande demodata skapas:</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                8 leverantörer (SaaS och vanliga)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                ~25 kostnader och fakturor
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                3 månaders historik
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Kategorier: SaaS, IT, Kontor, Resor, Marknadsföring
              </li>
            </ul>
          </div>

          {progress && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {progress}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Avbryt
          </Button>
          <Button onClick={handleStartDemo} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Skapa demodata
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
