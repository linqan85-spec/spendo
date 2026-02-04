import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTranslation } from "react-i18next";
import { CategorySummary, CATEGORY_LABEL_KEYS, CATEGORY_COLORS } from "@/types/spendo";

interface CategoryChartProps {
  data: CategorySummary[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const { t } = useTranslation();
  const chartData = data.map((item) => ({
    name: t(CATEGORY_LABEL_KEYS[item.category]),
    value: Math.round(item.total_amount),
    category: item.category,
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${((value / total) * 100).toFixed(0)}%`;
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          {t("dashboard.category_chart.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.category}
                    fill={CATEGORY_COLORS[entry.category]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [formatValue(value), t("dashboard.category_chart.amount")]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-sm text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            {t("dashboard.category_chart.empty")}
          </div>
        )}

        {chartData.length > 0 && (
          <div className="mt-4 space-y-2">
            {chartData
              .sort((a, b) => b.value - a.value)
              .slice(0, 4)
              .map((item) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatValue(item.value)}</span>
                    <span className="text-muted-foreground">{formatPercent(item.value)}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
