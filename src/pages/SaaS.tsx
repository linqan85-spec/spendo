import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockVendors, mockExpenses } from "@/lib/mock-data";
import { useMemo } from "react";
import { Layers, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function SaaS() {
  const saasData = useMemo(() => {
    const saasVendors = mockVendors.filter(v => v.is_saas);
    
    return saasVendors.map(vendor => {
      const vendorExpenses = mockExpenses.filter(e => e.vendor_id === vendor.id);
      const total = vendorExpenses.reduce((sum, e) => sum + e.amount, 0);
      const months = new Set(vendorExpenses.map(e => e.transaction_date.substring(0, 7))).size;
      const monthlyAvg = months > 0 ? total / months : 0;
      
      return {
        vendor,
        total,
        monthlyAvg,
        transactions: vendorExpenses.length,
      };
    }).sort((a, b) => b.total - a.total);
  }, []);

  const totalSaasSpend = saasData.reduce((sum, item) => sum + item.total, 0);
  const monthlyTotal = saasData.reduce((sum, item) => sum + item.monthlyAvg, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SaaS-tjänster</h1>
          <p className="text-muted-foreground">
            Översikt över alla era SaaS-prenumerationer
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Antal SaaS-tjänster
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{saasData.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Månadskostnad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total spend (6 mån)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSaasSpend)}</div>
            </CardContent>
          </Card>
        </div>

        {/* SaaS List */}
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
                        {item.transactions} transaktioner
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatCurrency(item.monthlyAvg)}</p>
                    <p className="text-sm text-muted-foreground">/månad</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {saasData.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Inga SaaS-tjänster identifierade</h3>
              <p className="text-sm text-muted-foreground">
                Anslut Kleer för att börja identifiera era SaaS-kostnader
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
