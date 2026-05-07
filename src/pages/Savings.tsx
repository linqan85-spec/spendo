import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Copy, Users, Sparkles, ArrowRight, Loader2, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useAllSavings } from "@/hooks/useAllSavings";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { PaywallOverlay } from "@/components/PaywallOverlay";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Savings() {
  const { vendorDuplicates, personDuplicates, totalMonthlySavings, isLoading } = useAllSavings();
  const { hasAccess, isLoading: lg, startCheckout } = useSubscriptionGate();

  if (isLoading || lg) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!hasAccess) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Besparingar</h1>
            <p className="text-muted-foreground">Spendos förslag på var ni kan spara pengar.</p>
          </div>
          <PaywallOverlay onUpgrade={startCheckout} />
        </div>
      </AppLayout>
    );
  }

  const noFindings = vendorDuplicates.length === 0 && personDuplicates.length === 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Besparingar</h1>
          <p className="text-muted-foreground">
            Spendo letar automatiskt efter dubbletter, shadow-SaaS och möjliga
            licenskonsolideringar.
          </p>
        </div>

        {/* Hero summary */}
        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Möjlig besparing per månad</p>
                <p className="text-3xl font-bold">{formatCurrency(totalMonthlySavings)}</p>
                <p className="text-xs text-muted-foreground">
                  ≈ {formatCurrency(totalMonthlySavings * 12)} per år
                </p>
              </div>
            </div>
            <div className="flex gap-2 text-right">
              <Badge variant="outline" className="text-sm">
                {vendorDuplicates.length} dubblett-leverantörer
              </Badge>
              <Badge variant="outline" className="text-sm">
                {personDuplicates.length} delade SaaS
              </Badge>
            </div>
          </CardContent>
        </Card>

        {noFindings && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Inga besparingar hittade just nu</AlertTitle>
            <AlertDescription>
              Snyggt jobbat! Spendo skannar automatiskt nya utgifter och flaggar här när vi
              hittar något.
            </AlertDescription>
          </Alert>
        )}

        {/* Vendor name duplicates */}
        {vendorDuplicates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="h-5 w-5 text-destructive" />
                Liknande leverantörer ({vendorDuplicates.length})
              </CardTitle>
              <CardDescription>
                Samma tjänst registrerad under flera namn. Konsolidera till en prenumeration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {vendorDuplicates.map((d, i) => (
                <div
                  key={i}
                  className="rounded-lg border bg-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold">{d.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {d.vendors.map((v) => v.name).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Möjlig besparing/månad</p>
                    <p className="font-bold text-lg text-primary">
                      {formatCurrency(d.potentialSavings)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Per-person SaaS duplicates (shadow-SaaS) */}
        {personDuplicates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-destructive" />
                Delade licenser — möjlig team-uppgradering ({personDuplicates.length})
              </CardTitle>
              <CardDescription>
                Flera personer betalar för samma SaaS separat. En team-licens är ofta
                billigare.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {personDuplicates.map((d) => (
                <div
                  key={d.vendor_id}
                  className="rounded-lg border bg-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold">{d.vendor_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {d.members.map((m) => m.member?.name || "Okänd").join(", ")} betalar
                      varsin licens
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Möjlig besparing/månad</p>
                    <p className="font-bold text-lg text-primary">
                      {formatCurrency(d.potentialSavings)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button asChild variant="outline">
            <Link to="/people" className="gap-2">
              Hantera personer & kort <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
