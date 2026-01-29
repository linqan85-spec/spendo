import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { mockVendors, mockExpenses } from "@/lib/mock-data";
import { CATEGORY_LABELS } from "@/types/spendo";
import { useState, useMemo } from "react";
import { Search, Building2, Layers } from "lucide-react";

export default function Vendors() {
  const [searchTerm, setSearchTerm] = useState("");

  const vendorData = useMemo(() => {
    return mockVendors.map(vendor => {
      const vendorExpenses = mockExpenses.filter(e => e.vendor_id === vendor.id);
      const total = vendorExpenses.reduce((sum, e) => sum + e.amount, 0);
      const transactions = vendorExpenses.length;
      
      return {
        vendor,
        total,
        transactions,
      };
    }).sort((a, b) => b.total - a.total);
  }, []);

  const filteredVendors = useMemo(() => {
    return vendorData.filter((item) => 
      item.vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vendorData, searchTerm]);

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
          <h1 className="text-2xl font-bold tracking-tight">Leverantörer</h1>
          <p className="text-muted-foreground">
            Alla leverantörer och deras totala kostnader
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök leverantör..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Vendors Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {filteredVendors.length} leverantörer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leverantör</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead className="text-center">Transaktioner</TableHead>
                  <TableHead className="text-right">Totalt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((item) => (
                  <TableRow key={item.vendor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                          {item.vendor.is_saas ? (
                            <Layers className="h-4 w-4 text-primary" />
                          ) : (
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-medium">{item.vendor.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.vendor.default_category ? (
                        <Badge variant="outline">
                          {CATEGORY_LABELS[item.vendor.default_category]}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.vendor.is_saas ? (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                          SaaS
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Engång</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.transactions}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
