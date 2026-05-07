import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface SavingsBannerProps {
  totalMonthlySavings: number;
  totalAlerts: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);
}

export function SavingsBanner({ totalMonthlySavings, totalAlerts }: SavingsBannerProps) {
  if (totalAlerts === 0) return null;

  return (
    <Card className="bg-primary/5 border-primary/30">
      <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <TrendingDown className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">Möjlig besparing per månad</p>
              <Badge variant="outline">{totalAlerts} förslag</Badge>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalMonthlySavings)}</p>
            <p className="text-xs text-muted-foreground">
              ≈ {formatCurrency(totalMonthlySavings * 12)} per år
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/savings" className="gap-2">
            Se besparingar <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
