import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, CreditCard, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";

interface PaywallOverlayProps {
  onUpgrade: () => Promise<void>;
}

export function PaywallOverlay({ onUpgrade }: PaywallOverlayProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      await onUpgrade();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Blurred placeholder content */}
      <div className="blur-sm opacity-40 pointer-events-none select-none" aria-hidden="true">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 w-24 bg-muted rounded mb-2" />
                <div className="h-8 w-32 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="h-48 bg-muted rounded" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-6 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 border-primary/30 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t("paywall.title")}</h2>
            <p className="text-muted-foreground mb-6">{t("paywall.description")}</p>
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={handleUpgrade}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {t("paywall.upgrade_button")}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">{t("paywall.data_safe")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
