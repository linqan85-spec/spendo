import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  FileText, 
  Layers, 
  Zap, 
  Shield, 
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Building2,
  CreditCard,
  PieChart
} from "lucide-react";
import spendoLogo from "@/assets/spendo-logo.png";
import spendoLogoFull from "@/assets/spendo-logo-full.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src={spendoLogoFull} alt="Spendo" className="h-8" />
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Logga in</Button>
            </Link>
            <Link to="/register">
              <Button>Kom igång</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/15 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 py-20 lg:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary border-primary/20">
              🇸🇪 Byggt för svenska företag
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Sluta gissa var pengarna tar vägen
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Spendo samlar alla era utlägg, leverantörsfakturor och SaaS-kostnader på ett ställe. 
              Varje månad får ni en tydlig rapport som visar exakt vad företaget spenderar på.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Starta gratis provperiod
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Se demo
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              14 dagars gratis provperiod · Ingen betalning krävs
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Låter det här bekant?
            </h2>
            <p className="text-lg text-muted-foreground">
              De flesta företag har samma problem
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-destructive" />
                  Utspridda fakturor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Leverantörsfakturor ligger i mejlen, utlägg på kvitton i plånboken, 
                  och SaaS-prenumerationer dras automatiskt utan att någon kollar.
                </p>
              </CardContent>
            </Card>
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-destructive" />
                  Osynliga SaaS-kostnader
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  "Slack kostar ju bara 100 spänn..." – Tills ni räknar ihop alla 
                  verktyg och inser att det blir 50 000 kr per månad.
                </p>
              </CardContent>
            </Card>
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-destructive" />
                  Ingen överblick
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Bokföringen visar siffror, men inte insikter. Ni vet att ni spenderar, 
                  men inte på vad eller varför det ökar.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Så fungerar Spendo
            </h2>
            <p className="text-lg text-primary-foreground/80">
              Tre steg till full kontroll över era kostnader
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Koppla Kleer</h3>
              <p className="text-primary-foreground/80">
                Anslut ert Kleer-konto med ett klick. Vi hämtar automatiskt alla 
                leverantörsfakturor och utlägg.
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-6">
                <Layers className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Vi kategoriserar</h3>
              <p className="text-primary-foreground/80">
                Spendo identifierar automatiskt SaaS-tjänster, klassificerar kostnader 
                och lär sig era mönster över tid.
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Månadsrapport</h3>
              <p className="text-primary-foreground/80">
                Varje månad får ni en tydlig rapport med total spend, trender, 
                top-leverantörer och alla SaaS-kostnader.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Kleer Integration Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="outline" className="mb-4">
                  Integration
                </Badge>
                <h2 className="text-3xl font-bold mb-4">
                  Direktkoppling till Kleer
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Kleer (tidigare PE Accounting) har ett öppet API som vi integrerar mot. 
                  Era data hämtas automatiskt och säkert – ni behöver bara godkänna kopplingen.
                </p>
                <ul className="space-y-3">
                  {[
                    "Leverantörsfakturor synkas automatiskt",
                    "Utlägg och transaktioner importeras",
                    "Realtidsuppdatering varje dag",
                    "Ingen manuell export eller import",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-card rounded-2xl border p-8 shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                  <img src={spendoLogo} alt="Spendo" className="h-12 w-12" />
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                    <Building2 className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="font-semibold mb-2">Säker API-koppling</h3>
                <p className="text-sm text-muted-foreground">
                  Vi läser endast data från Kleer – vi skriver aldrig tillbaka 
                  eller ändrar något i er bokföring. Fullständigt säkert.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Allt ni behöver för att förstå era kostnader
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: PieChart,
                title: "Kategorisering",
                description: "Automatisk och manuell kategorisering av alla kostnader",
              },
              {
                icon: Layers,
                title: "SaaS-identifiering",
                description: "Hittar och sammanställer alla era SaaS-prenumerationer",
              },
              {
                icon: TrendingUp,
                title: "Trendanalys",
                description: "Se hur kostnaderna utvecklas månad för månad",
              },
              {
                icon: Building2,
                title: "Top leverantörer",
                description: "Vilka leverantörer kostar mest? Vi visar det tydligt",
              },
              {
                icon: FileText,
                title: "PDF-rapporter",
                description: "Exportera månadsrapporter som PDF för styrelsen",
              },
              {
                icon: Shield,
                title: "Säker data",
                description: "All data krypterad och säkert lagrad i Sverige",
              },
            ].map((feature, i) => (
              <Card key={i}>
                <CardHeader>
                  <feature.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Enkel och transparent prissättning
            </h2>
            <p className="text-lg text-muted-foreground">
              En fast månadskostnad, inga dolda avgifter
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <Card className="border-primary">
              <CardHeader className="text-center pb-2">
                <Badge className="w-fit mx-auto mb-4">Populärast</Badge>
                <CardTitle className="text-2xl">Spendo Pro</CardTitle>
                <CardDescription>Allt ni behöver för att få koll</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-5xl font-bold">499</span>
                  <span className="text-muted-foreground"> kr/månad</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  + 99 kr per extra användare
                </p>
                <ul className="text-left space-y-3 mb-8">
                  {[
                    "Kleer-integration",
                    "Obegränsat antal transaktioner",
                    "Automatisk kategorisering",
                    "SaaS-identifiering",
                    "Månadsrapporter",
                    "PDF & CSV-export",
                    "1 användare inkluderad",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="block">
                  <Button size="lg" className="w-full">
                    Starta 14 dagars gratis provperiod
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Redo att få kontroll över era kostnader?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Starta gratis idag och se direkt var pengarna tar vägen.
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Kom igång nu
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <img src={spendoLogoFull} alt="Spendo" className="h-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Spendo. Byggt i Sverige för svenska företag.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
