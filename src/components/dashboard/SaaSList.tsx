import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Vendor } from "@/types/spendo";
import { Layers } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SaaSListProps {
  items: Array<{ vendor: Vendor; total: number; monthlyAvg: number }>;
}

export function SaaSList({ items }: SaaSListProps) {
  const { t } = useTranslation();

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalSaas = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          {t("dashboard.saas_list.title")}
        </CardTitle>
        <Badge variant="secondary" className="font-mono">
          {formatValue(totalSaas)} {t("dashboard.saas_list.per_month_short")}
        </Badge>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.vendor.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.vendor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("dashboard.saas_list.recurring")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatValue(item.total)}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("dashboard.saas_list.per_month")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t("dashboard.saas_list.empty")}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
