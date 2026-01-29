import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockExpenses, mockVendors, mockCompany } from "@/lib/mock-data";
import { CATEGORY_LABELS, ExpenseCategory, Expense } from "@/types/spendo";
import { useState, useMemo } from "react";
import { Search, Receipt, FileText, Upload } from "lucide-react";
import { AddExpenseDialog } from "@/components/expenses/AddExpenseDialog";
import { useToast } from "@/hooks/use-toast";

export default function Expenses() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [localExpenses, setLocalExpenses] = useState<Expense[]>(mockExpenses);

  // Count manual expenses for trial limit
  const manualExpenseCount = useMemo(() => {
    return localExpenses.filter(e => e.source === 'manual').length;
  }, [localExpenses]);

  const filteredExpenses = useMemo(() => {
    return localExpenses.filter((expense) => {
      const matchesSearch = 
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
      const matchesType = typeFilter === "all" || expense.type === typeFilter;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [localExpenses, searchTerm, categoryFilter, typeFilter]);

  const handleAddExpense = (data: {
    vendor_name: string;
    amount: number;
    transaction_date: Date;
    category: ExpenseCategory;
    type: 'expense' | 'invoice';
    description?: string;
  }) => {
    // Find or create vendor
    let vendor = mockVendors.find(v => 
      v.name.toLowerCase() === data.vendor_name.toLowerCase()
    );
    
    if (!vendor) {
      vendor = {
        id: `v-manual-${Date.now()}`,
        company_id: 'company-1',
        name: data.vendor_name,
        normalized_name: data.vendor_name.toLowerCase().replace(/\s+/g, '_'),
        is_saas: data.category === 'saas',
        default_category: data.category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockVendors.push(vendor);
    }

    const newExpense: Expense = {
      id: `exp-manual-${Date.now()}`,
      company_id: 'company-1',
      vendor_id: vendor.id,
      external_id: null,
      type: data.type,
      amount: data.amount,
      vat_amount: 0,
      currency: 'SEK',
      transaction_date: data.transaction_date.toISOString().split('T')[0],
      description: data.description || null,
      category: data.category,
      subcategory: null,
      is_recurring: false,
      source: 'manual',
      is_trial_sample: mockCompany.subscription_status === 'trialing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      vendor,
    };

    setLocalExpenses(prev => [newExpense, ...prev]);
    
    toast({
      title: "Utgift tillagd",
      description: `${data.vendor_name} - ${formatCurrency(data.amount)}`,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateStr));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with Add button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kostnader</h1>
            <p className="text-muted-foreground">
              Alla utlägg och leverantörsfakturor
            </p>
          </div>
          <AddExpenseDialog 
            onAdd={handleAddExpense}
            manualExpenseCount={manualExpenseCount}
            maxManualExpenses={mockCompany.max_manual_expenses}
            isTrialing={mockCompany.subscription_status === 'trialing'}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
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
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
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
              {filteredExpenses.length} kostnader
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
                  <TableHead>Källa</TableHead>
                  <TableHead className="text-right">Belopp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.slice(0, 50).map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(expense.transaction_date)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {expense.vendor?.name || "—"}
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
                      <div className="flex items-center gap-1.5">
                        {expense.type === 'expense' ? (
                          <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="text-sm">
                          {expense.type === 'expense' ? 'Utlägg' : 'Faktura'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {expense.source === 'manual' ? (
                        <Badge variant="secondary" className="text-xs">
                          <Upload className="h-3 w-3 mr-1" />
                          Manuell
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Kleer
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredExpenses.length > 50 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Visar 50 av {filteredExpenses.length} kostnader
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
