import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";

export default function Integration() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integration</h1>
          <p className="text-muted-foreground">
            Anslut Kleer för att börja hämta data
          </p>
        </div>

        {/* Kleer Integration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
                  <span className="font-bold text-lg">K</span>
                </div>
                <div>
                  <CardTitle>Kleer</CardTitle>
                  <CardDescription>
                    Tidigare PE Accounting
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Ej ansluten
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Så fungerar det</h4>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">1.</span>
                  Kontakta er konsult på Kleer för att få en API-nyckel
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">2.</span>
                  Ange API-nyckeln nedan för att koppla ert konto
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">3.</span>
                  Spendo börjar automatiskt hämta leverantörsfakturor och utlägg
                </li>
              </ol>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Vad vi hämtar från Kleer:</p>
                <ul className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    "Leverantörsfakturor",
                    "Utlägg och kvitton",
                    "Leverantörsnamn",
                    "Belopp och moms",
                    "Transaktionsdatum",
                    "Beskrivningar",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="gap-2">
                  Anslut Kleer
                </Button>
                <Button variant="outline" className="gap-2" asChild>
                  <a href="https://api-doc.kleer.se/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    API-dokumentation
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Synkstatus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>Ingen integration konfigurerad</p>
              <p className="text-sm">Anslut Kleer ovan för att börja synka data</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
