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
import { useTranslation } from "react-i18next";

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

type DemoProgress = "create_vendors" | "create_expenses" | "activate" | "";

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

  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const month = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);

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

    expenses.push({
      company_id: companyId,
      vendor_id: vendorIds["Slack"],
      amount: 890,
      category: "saas",
      description: "Slack Pro - 5 users",
      transaction_date: new Date(month.getFullYear(), month.getMonth(), 1).toISOString().split("T")[0],
      type: "invoice",
      is_recurring: true,
      currency: "SEK",
    });

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

    expenses.push({
      company_id: companyId,
      vendor_id: vendorIds["AWS"],
      amount: 2500 + Math.floor(Math.random() * 1000),
      category: "it_verktyg",
      description: "AWS cloud services",
      transaction_date: new Date(month.getFullYear(), month.getMonth(), 28).toISOString().split("T")[0],
      type: "invoice",
      is_recurring: true,
      currency: "SEK",
    });

    if (monthOffset === 0 || monthOffset === 2) {
      expenses.push({
        company_id: companyId,
        vendor_id: vendorIds["Kontorsmaterial AB"],
        amount: 1850 + Math.floor(Math.random() * 500),
        category: "kontor",
        description: "Office supplies",
        transaction_date: new Date(month.getFullYear(), month.getMonth(), 12).toISOString().split("T")[0],
        type: "invoice",
        is_recurring: false,
        currency: "SEK",
      });
    }

    expenses.push({
      company_id: companyId,
      vendor_id: vendorIds["SJ"],
      amount: 450 + Math.floor(Math.random() * 300),
      category: "resor",
      description: "Business travel Stockholm-Gothenburg",
      transaction_date: new Date(month.getFullYear(), month.getMonth(), 8).toISOString().split("T")[0],
      type: "expense",
      is_recurring: false,
      currency: "SEK",
    });

    expenses.push({
      company_id: companyId,
      vendor_id: vendorIds["Google Ads"],
      amount: 5000 + Math.floor(Math.random() * 2000),
      category: "marknadsforing",
      description: "Google Ads campaigns",
      transaction_date: new Date(month.getFullYear(), month.getMonth(), 25).toISOString().split("T")[0],
      type: "invoice",
      is_recurring: true,
      currency: "SEK",
    });
  }

  return expenses;
}

export function FortnoxDemoDialog({ companyId, onSuccess }: FortnoxDemoDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<DemoProgress>("");

  const handleStartDemo = async () => {
    setIsLoading(true);
    setError(null);
    setProgress("create_vendors");

    try {
      const vendorInserts = DEMO_VENDORS.map((v) => ({
        company_id: companyId,
        name: v.name,
        normalized_name: v.name.toLowerCase().replace(/\s+/g, "_"),
        is_saas: v.is_saas,
        default_category: v.default_category,
      }));

      const { error: vendorError } = await supabase
        .from("vendors")
        .upsert(vendorInserts, { onConflict: "company_id,normalized_name", ignoreDuplicates: true });

      if (vendorError) throw vendorError;

      const { data: allVendors, error: fetchError } = await supabase
        .from("vendors")
        .select("id, name")
        .eq("company_id", companyId);

      if (fetchError) throw fetchError;

      const vendorIds: Record<string, string> = {};
      allVendors?.forEach((v) => {
        vendorIds[v.name] = v.id;
      });

      setProgress("create_expenses");

      const demoExpenses = generateDemoExpenses(vendorIds, companyId);

      const { error: expenseError } = await supabase
        .from("expenses")
        .insert(demoExpenses);

      if (expenseError) throw expenseError;

      setProgress("activate");

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

      toast.success(t("integrations.fortnox_demo.toast.success"));
      setOpen(false);
      onSuccess();
    } catch (err) {
      console.error("Error creating demo data:", err);
      setError(t("integrations.fortnox_demo.toast.error"));
    } finally {
      setIsLoading(false);
      setProgress("");
    }
  };

  const progressLabel =
    progress === "create_vendors"
      ? t("integrations.fortnox_demo.progress.create_vendors")
      : progress === "create_expenses"
        ? t("integrations.fortnox_demo.progress.create_expenses")
        : progress === "activate"
          ? t("integrations.fortnox_demo.progress.activate")
          : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Play className="h-4 w-4" />
          {t("integrations.fortnox_demo.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("integrations.fortnox_demo.title")}</DialogTitle>
          <DialogDescription>{t("integrations.fortnox_demo.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="font-medium text-sm">
              {t("integrations.fortnox_demo.includes_title")}
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {t("integrations.fortnox_demo.includes.vendors")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {t("integrations.fortnox_demo.includes.expenses")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {t("integrations.fortnox_demo.includes.history")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {t("integrations.fortnox_demo.includes.categories")}
              </li>
            </ul>
          </div>

          {progressLabel && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {progressLabel}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleStartDemo} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("integrations.fortnox_demo.create_button")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
