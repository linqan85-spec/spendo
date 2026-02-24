import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useVendors, useExpenses } from "@/hooks/useExpensesData";
import { useMemo } from "react";
import { Layers, Loader2, Plug, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PaywallOverlay } from "@/components/PaywallOverlay";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";

export default function SaaS() {
  const { t } = useTranslation();
  const { data: vendors = [], isLoading: isLoadingVendors } = useVendors();
  const { data: expenses = [], isLoading: isLoadingExpenses } = useExpenses();
  const { hasAccess, isLoading: isGateLoading, startCheckout } = useSubscriptionGate();

  const isLoading = isLoadingVendors || isLoadingExpenses || isGateLoading;

  const saasData = useMemo(() => {
    const saasVendors = vendors.filter((v) => v.is_saas);

    return saasVendors
      .map((vendor) => {
        const vendorExpenses = expenses.filter((e) => e.vendor_id === vendor.id);
        const total = vendorExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const months = new Set(vendorExpenses.map((e) => e.transaction_date.substring(0, 7))).size;
        const monthlyAvg = months > 0 ? total / months : 0;

        return {
          vendor,
          total,
          monthlyAvg,
          transactions: vendorExpenses.length,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [vendors, expenses]);

  const totalSaasSpend = saasData.reduce((sum, item) => sum + item.total, 0);
  const monthlyTotal = saasData.reduce((sum, item) => sum + item.monthlyAvg, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
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
            <h1 className="text-2xl font-bold tracking-tight">{t("saas.title")}</h1>
            <p className="text-muted-foreground">{t("saas.subtitle")}</p>
          </div>
          <PaywallOverlay onUpgrade={startCheckout} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("saas.title")}</h1>
          <p className="text-muted-foreground">{t("saas.subtitle")}</p>
        </div>

        {saasData.length === 0 ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Layers className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {t("saas.empty.title")}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {t("saas.empty.description")}
              </p>
              <Button asChild>
                <Link to="/integration" className="gap-2">
                  <Plug className="h-4 w-4" />
                  {t("saas.empty.connect")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("saas.summary.count")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{saasData.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("saas.summary.monthly_cost")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("saas.summary.total_spend")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalSaasSpend)}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4">
              {saasData.map((item) => (
                <Card key={item.vendor.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Layers className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{item.vendor.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {t("saas.transactions", { count: item.transactions })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{formatCurrency(item.monthlyAvg)}</p>
                        <p className="text-sm text-muted-foreground">{t("saas.per_month")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
