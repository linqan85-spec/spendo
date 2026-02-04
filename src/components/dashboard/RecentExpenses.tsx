import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Expense, CATEGORY_LABEL_KEYS } from "@/types/spendo";
import { Receipt, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RecentExpensesProps {
  expenses: Expense[];
}

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  const { t } = useTranslation();

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("sv-SE", {
      day: "numeric",
      month: "short",
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          {t("dashboard.recent_expenses.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {expenses.length > 0 ? (
          <div className="space-y-3">
            {expenses.slice(0, 8).map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                    {expense.type === "expense" ? (
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {expense.vendor?.name || expense.description || t("common.unknown")}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(expense.transaction_date)}
                      </span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {t(CATEGORY_LABEL_KEYS[expense.category])}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatValue(expense.amount)}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {expense.type === "expense"
                      ? t("dashboard.recent_expenses.type.expense")
                      : t("dashboard.recent_expenses.type.invoice")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t("dashboard.recent_expenses.empty")}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
