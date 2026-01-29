import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { TopVendorsList } from "@/components/dashboard/TopVendorsList";
import { SaaSList } from "@/components/dashboard/SaaSList";
import { RecentExpenses } from "@/components/dashboard/RecentExpenses";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { getMockDashboardData, getAvailableMonths } from "@/lib/mock-data";
import { Receipt, FileText, Layers, TrendingUp } from "lucide-react";

const Index = () => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const availableMonths = useMemo(() => getAvailableMonths(), []);
  
  const dashboardData = useMemo(
    () => getMockDashboardData(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateChange = (current: number, previous: number | null) => {
    if (previous === null || previous === 0) return undefined;
    return ((current - previous) / previous) * 100;
  };

  const { currentMonth, previousMonth, categoryBreakdown, topVendors, topSaas, recentExpenses } = dashboardData;

  const totalChange = calculateChange(
    currentMonth.total_spend,
    previousMonth?.total_spend ?? null
  );
  const saasChange = calculateChange(
    currentMonth.saas_spend,
    previousMonth?.saas_spend ?? null
  );
  const expenseChange = calculateChange(
    currentMonth.expense_spend,
    previousMonth?.expense_spend ?? null
  );
  const invoiceChange = calculateChange(
    currentMonth.invoice_spend,
    previousMonth?.invoice_spend ?? null
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Översikt över dina kostnader och utgifter
            </p>
          </div>
          <MonthSelector
            months={availableMonths}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onSelect={(year, month) => {
              setSelectedYear(year);
              setSelectedMonth(month);
            }}
          />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total spend"
            value={formatCurrency(currentMonth.total_spend)}
            change={totalChange}
            changeLabel="vs förra månaden"
            icon={TrendingUp}
          />
          <KPICard
            title="SaaS-kostnader"
            value={formatCurrency(currentMonth.saas_spend)}
            change={saasChange}
            changeLabel="vs förra månaden"
            icon={Layers}
          />
          <KPICard
            title="Utlägg"
            value={formatCurrency(currentMonth.expense_spend)}
            change={expenseChange}
            changeLabel="vs förra månaden"
            icon={Receipt}
          />
          <KPICard
            title="Fakturor"
            value={formatCurrency(currentMonth.invoice_spend)}
            change={invoiceChange}
            changeLabel="vs förra månaden"
            icon={FileText}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryChart data={categoryBreakdown} />
          <TopVendorsList vendors={topVendors} />
        </div>

        {/* SaaS and Recent Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SaaSList items={topSaas} />
          <RecentExpenses expenses={recentExpenses} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
