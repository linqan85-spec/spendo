import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExpenses, useAddExpense, useManualExpenseCount } from "@/hooks/useExpensesData";
import { CATEGORY_LABELS, ExpenseCategory } from "@/types/spendo";
import { useState, useMemo } from "react";
import { Search, Receipt, FileText, Loader2, Plug, ArrowRight } from "lucide-react";
import { AddExpenseDialog } from "@/components/expenses/AddExpenseDialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Expenses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: expenses = [], isLoading } = useExpenses();
  const { data: manualExpenseCount = 0 } = useManualExpenseCount();
  const addExpense = useAddExpense();

  // Filter expenses
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
      transaction_date: data.transaction_date.toISOString().split('T')[0],
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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Utgifter</h1>
            <p className="text-muted-foreground">
              Alla leverantörsfakturor och utlägg
            </p>
          </div>
          <AddExpenseDialog
            onAdd={handleAddExpense}
            manualExpenseCount={manualExpenseCount}
            maxManualExpenses={20}
            isTrialing={false}
          />
        </div>

        {/* Empty state */}
        {expenses.length === 0 ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Receipt className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Inga utgifter ännu
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Anslut ditt bokföringssystem för att automatiskt importera utgifter,
                eller lägg till dem manuellt.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link to="/integration" className="gap-2">
                    <Plug className="h-4 w-4" />
                    Anslut integration
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
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök leverantör eller beskrivning..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla kategorier</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla typer</SelectItem>
                  <SelectItem value="expense">Utlägg</SelectItem>
                  <SelectItem value="invoice">Faktura</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expenses Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  {filteredExpenses.length} utgifter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Leverantör</TableHead>
                      <TableHead>Beskrivning</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead className="text-right">Belopp</TableHead>
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
                            {expense.vendor?.name || "Okänd"}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {expense.description || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {CATEGORY_LABELS[expense.category]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              expense.type === "expense" ? "secondary" : "default"
                            }
                          >
                            {expense.type === "expense" ? "Utlägg" : "Faktura"}
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
