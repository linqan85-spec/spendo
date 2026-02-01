import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Plug, 
  ArrowRight,
  Layers,
  Receipt,
  FileText
} from "lucide-react";
import { Link } from "react-router-dom";

export function EmptyDashboard() {
  return (
    <div className="space-y-6">
      {/* Empty KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total spend</span>
            </div>
            <p className="text-2xl font-bold text-muted-foreground/50">0 kr</p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">SaaS-kostnader</span>
            </div>
            <p className="text-2xl font-bold text-muted-foreground/50">0 kr</p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Utlägg</span>
            </div>
            <p className="text-2xl font-bold text-muted-foreground/50">0 kr</p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Fakturor</span>
            </div>
            <p className="text-2xl font-bold text-muted-foreground/50">0 kr</p>
          </CardContent>
        </Card>
      </div>

      {/* CTA Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Plug className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Anslut ditt bokföringssystem
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Koppla ihop Spendo med Kleer eller Fortnox för att automatiskt hämta 
            dina leverantörsfakturor och utlägg.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link to="/integration">
              <Plug className="h-4 w-4" />
              Gå till Integrationer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <Layers className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-medium mb-1">SaaS-översikt</h3>
            <p className="text-sm text-muted-foreground">
              Se alla era prenumerationer och månadskostnader på ett ställe
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <BarChart3 className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-medium mb-1">Kategorianalys</h3>
            <p className="text-sm text-muted-foreground">
              Förstå var pengarna går med automatisk kategorisering
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Receipt className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-medium mb-1">Leverantörsinsikter</h3>
            <p className="text-sm text-muted-foreground">
              Identifiera era största leverantörer och optimera kostnader
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
