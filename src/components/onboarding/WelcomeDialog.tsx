import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  Layers,
  Receipt,
  FileText,
  Plug,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEMO_DATA = {
  totalSpend: 156420,
  saasSpend: 26140,
  expenseSpend: 42850,
  invoiceSpend: 87430,
  saasServices: ["Slack", "GitHub", "Figma", "Notion", "AWS"],
};

export function WelcomeDialog({ open, onOpenChange }: WelcomeDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleGetStarted = () => {
    localStorage.setItem("spendo-welcome-seen", "true");
    onOpenChange(false);
    navigate("/integration");
  };

  const handleSkip = () => {
    localStorage.setItem("spendo-welcome-seen", "true");
    onOpenChange(false);
  };

  if (step === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl">
              {t("welcome.step1.title")}
            </DialogTitle>
            <DialogDescription className="text-base">
              {t("welcome.step1.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {t("welcome.step1.preview")}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {t("welcome.step1.kpi.total")}
                  </span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(DEMO_DATA.totalSpend)}</p>
              </Card>
              <Card className="p-3 bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {t("welcome.step1.kpi.saas")}
                  </span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(DEMO_DATA.saasSpend)}</p>
              </Card>
              <Card className="p-3 bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Receipt className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {t("welcome.step1.kpi.expenses")}
                  </span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(DEMO_DATA.expenseSpend)}</p>
              </Card>
              <Card className="p-3 bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {t("welcome.step1.kpi.invoices")}
                  </span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(DEMO_DATA.invoiceSpend)}</p>
              </Card>
            </div>

            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-2">
                {t("welcome.step1.saas_label")}
              </p>
              <div className="flex flex-wrap gap-2">
                {DEMO_DATA.saasServices.map((service) => (
                  <span key={service} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {service}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-3">
            <Button variant="ghost" onClick={handleSkip}>
              {t("welcome.step1.skip")}
            </Button>
            <Button onClick={() => setStep(1)} className="gap-2">
              {t("welcome.step1.next")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Plug className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl">{t("welcome.step2.title")}</DialogTitle>
          <DialogDescription className="text-base">
            {t("welcome.step2.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                <span className="text-sm font-bold">1</span>
              </div>
              <div>
                <p className="font-medium">{t("welcome.step2.steps.connect.title")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("welcome.step2.steps.connect.description")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                <span className="text-sm font-bold">2</span>
              </div>
              <div>
                <p className="font-medium">{t("welcome.step2.steps.sync.title")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("welcome.step2.steps.sync.description")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                <span className="text-sm font-bold">3</span>
              </div>
              <div>
                <p className="font-medium">{t("welcome.step2.steps.insights.title")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("welcome.step2.steps.insights.description")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-3">
          <Button variant="ghost" onClick={handleSkip}>
            {t("welcome.step2.explore")}
          </Button>
          <Button onClick={handleGetStarted} className="gap-2">
            <Plug className="h-4 w-4" />
            {t("welcome.step2.connect")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useWelcomeDialog() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("spendo-welcome-seen");
    if (!hasSeen) {
      const timer = setTimeout(() => setShowWelcome(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  return {
    showWelcome,
    setShowWelcome,
  };
}
