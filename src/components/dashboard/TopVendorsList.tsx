import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Vendor } from "@/types/spendo";
import { Building2, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TopVendorsListProps {
  vendors: Array<{ vendor: Vendor; total: number }>;
  title?: string;
  showSaasIndicator?: boolean;
}

export function TopVendorsList({
  vendors,
  title,
  showSaasIndicator = true,
}: TopVendorsListProps) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("dashboard.top_vendors.title");

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const maxTotal = Math.max(...vendors.map((v) => v.total));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{resolvedTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {vendors.length > 0 ? (
          <div className="space-y-4">
            {vendors.map((item, index) => (
              <div key={item.vendor.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-medium">{item.vendor.name}</span>
                    {showSaasIndicator && item.vendor.is_saas && (
                      <Layers className="h-3 w-3 text-primary" />
                    )}
                  </div>
                  <span className="text-sm font-semibold">
                    {formatValue(item.total)}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(item.total / maxTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t("dashboard.top_vendors.empty")}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
