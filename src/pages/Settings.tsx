import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { mockCompany } from "@/lib/mock-data";
import { Building2, Users, CreditCard, Bell } from "lucide-react";

export default function Settings() {
  const daysLeft = mockCompany.trial_ends_at 
    ? Math.ceil((new Date(mockCompany.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inställningar</h1>
          <p className="text-muted-foreground">
            Hantera ditt konto och företagsinformation
          </p>
        </div>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Företagsinformation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Företagsnamn</Label>
              <Input id="company-name" defaultValue={mockCompany.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-number">Organisationsnummer</Label>
              <Input id="org-number" defaultValue={mockCompany.org_number || ""} placeholder="556XXX-XXXX" />
            </div>
            <Button>Spara ändringar</Button>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Prenumeration</CardTitle>
              </div>
              <Badge variant="secondary">
                Trial · {daysLeft} dagar kvar
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Spendo Pro</span>
                <span className="font-bold">{mockCompany.base_price_per_month} kr/mån</span>
              </div>
              <p className="text-sm text-muted-foreground">
                + {mockCompany.extra_user_price} kr per extra användare
              </p>
            </div>
            <Button>Uppgradera till betald plan</Button>
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Team</CardTitle>
            </div>
            <CardDescription>
              Bjud in fler användare till ditt företag
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Du (Owner)</p>
                <p className="text-sm text-muted-foreground">demo@spendo.se</p>
              </div>
              <Badge>Owner</Badge>
            </div>
            <div className="flex gap-2">
              <Input placeholder="E-postadress" className="flex-1" />
              <Button variant="outline">Bjud in</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Extra användare kostar {mockCompany.extra_user_price} kr/månad
            </p>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Notifikationer</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Månadsrapport</p>
                  <p className="text-sm text-muted-foreground">
                    Få rapporten skickad till din e-post
                  </p>
                </div>
                <Button variant="outline" size="sm">Aktivera</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Synkningsfel</p>
                  <p className="text-sm text-muted-foreground">
                    Notifiera vid problem med Kleer-integrationen
                  </p>
                </div>
                <Button variant="outline" size="sm">Aktivera</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
