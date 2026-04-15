import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DuplicateGroup } from "@/hooks/useDuplicateDetector";

interface DuplicateWarningsProps {
  duplicates: DuplicateGroup[];
}

export function DuplicateWarnings({ duplicates }: DuplicateWarningsProps) {
  const { t } = useTranslation();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      maximumFractionDigits: 0,
    }).format(value);

  if (duplicates.length === 0) return null;

  const totalSavings = duplicates.reduce((sum, d) => sum + d.potentialSavings, 0);

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          {t("dashboard.duplicates.title")}
        </CardTitle>
        {totalSavings > 0 && (
          <Badge variant="destructive" className="font-mono">
            {t("dashboard.duplicates.potential_savings", { amount: formatCurrency(totalSavings) })}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {duplicates.map((group, i) => (
            <div
              key={i}
              className="flex items-start justify-between p-3 rounded-lg bg-background border border-destructive/20"
            >
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-md bg-destructive/10 flex items-center justify-center mt-0.5">
                  <Copy className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {t("dashboard.duplicates.warning", {
                      count: group.vendors.length,
                      name: group.name,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {group.vendors.map((v) => v.name).join(", ")}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="font-semibold text-sm text-destructive">
                  {formatCurrency(group.totalMonthlySpend)}
                  <span className="text-xs font-normal text-muted-foreground"> /mån</span>
                </p>
                {group.potentialSavings > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t("dashboard.duplicates.save", { amount: formatCurrency(group.potentialSavings) })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
