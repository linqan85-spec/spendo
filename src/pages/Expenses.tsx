import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExpenses, useAddExpense, useManualExpenseCount } from "@/hooks/useExpensesData";
import { CATEGORY_LABEL_KEYS, ExpenseCategory } from "@/types/spendo";
import { useState, useMemo } from "react";
import { Search, Receipt, FileText, Loader2, Plug, ArrowRight } from "lucide-react";
import { AddExpenseDialog } from "@/components/expenses/AddExpenseDialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PaywallOverlay } from "@/components/PaywallOverlay";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";

export default function Expenses() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: expenses = [], isLoading } = useExpenses();
  const { data: manualExpenseCount = 0 } = useManualExpenseCount();
  const addExpense = useAddExpense();
  const { hasAccess, isLoading: isGateLoading, startCheckout } = useSubscriptionGate();

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const vendorName = expense.vendor?.name || "";
      const matchesSearch =
        vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || expense.category === categoryFilter;
      const matchesType = typeFilter === "all" || expense.type === typeFilter;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [expenses, searchTerm, categoryFilter, typeFilter]);

  const handleAddExpense = async (data: {
    vendor_name: string;
    amount: number;
    transaction_date: Date;
    category: ExpenseCategory;
    type: "expense" | "invoice";
    description?: string;
  }) => {
    await addExpense.mutateAsync({
      vendor_name: data.vendor_name,
      amount: data.amount,
      transaction_date: data.transaction_date.toISOString().split("T")[0],
      description: data.description || "",
      category: data.category,
      type: data.type,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("sv-SE");
  };

  if (isLoading || isGateLoading) {
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
            <h1 className="text-2xl font-bold tracking-tight">{t("expenses.title")}</h1>
            <p className="text-muted-foreground">{t("expenses.subtitle")}</p>
          </div>
          <PaywallOverlay onUpgrade={startCheckout} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("expenses.title")}</h1>
            <p className="text-muted-foreground">{t("expenses.subtitle")}</p>
          </div>
          <AddExpenseDialog
            onAdd={handleAddExpense}
            manualExpenseCount={manualExpenseCount}
            maxManualExpenses={20}
            isTrialing={false}
          />
        </div>

        {expenses.length === 0 ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Receipt className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {t("expenses.empty.title")}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {t("expenses.empty.description")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link to="/integration" className="gap-2">
                    <Plug className="h-4 w-4" />
                    {t("expenses.empty.connect")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <AddExpenseDialog
                  onAdd={handleAddExpense}
                  manualExpenseCount={manualExpenseCount}
                  maxManualExpenses={20}
                  isTrialing={false}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("expenses.search.placeholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t("expenses.filters.category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("expenses.filters.all_categories")}</SelectItem>
                  {Object.entries(CATEGORY_LABEL_KEYS).map(([value, labelKey]) => (
                    <SelectItem key={value} value={value}>
                      {t(labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder={t("expenses.filters.type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("expenses.filters.all_types")}</SelectItem>
                  <SelectItem value="expense">{t("expenses.type.expense")}</SelectItem>
                  <SelectItem value="invoice">{t("expenses.type.invoice")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  {t("expenses.table.count", { count: filteredExpenses.length })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("expenses.table.date")}</TableHead>
                      <TableHead>{t("expenses.table.vendor")}</TableHead>
                      <TableHead>{t("expenses.table.description")}</TableHead>
                      <TableHead>{t("expenses.table.category")}</TableHead>
                      <TableHead>{t("expenses.table.type")}</TableHead>
                      <TableHead className="text-right">{t("expenses.table.amount")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">
                          {formatDate(expense.transaction_date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {expense.type === "expense" ? (
                              <Receipt className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            )}
                            {expense.vendor?.name || t("common.unknown")}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {expense.description || t("common.none")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {t(CATEGORY_LABEL_KEYS[expense.category])}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={expense.type === "expense" ? "secondary" : "default"}
                          >
                            {expense.type === "expense" ? t("expenses.type.expense") : t("expenses.type.invoice")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
