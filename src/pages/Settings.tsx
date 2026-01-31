import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Users, CreditCard, Bell, Loader2, ExternalLink, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Company } from "@/types/spendo";

export default function Settings() {
  const { companyId, user } = useAuth();
  const { subscribed, subscriptionEnd, isLoading: subLoading, startCheckout, openCustomerPortal, checkSubscription } = useSubscription();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  // Check for checkout success/cancel in URL
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    if (checkoutStatus === 'success') {
      toast({
        title: "Betalning lyckades!",
        description: "Din prenumeration är nu aktiv. Välkommen till Spendo Pro!",
      });
      // Refresh subscription status
      checkSubscription();
    } else if (checkoutStatus === 'canceled') {
      toast({
        title: "Betalning avbruten",
        description: "Du avbröt betalningen. Du kan försöka igen när som helst.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast, checkSubscription]);

  // Fetch company data
  useEffect(() => {
    async function fetchCompany() {
      if (!companyId) {
        setIsLoadingCompany(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (error) throw error;
        setCompany(data as Company);
      } catch (error) {
        console.error('Error fetching company:', error);
      } finally {
        setIsLoadingCompany(false);
      }
    }

    fetchCompany();
  }, [companyId]);

  const handleUpgrade = async () => {
    setIsCheckoutLoading(true);
    try {
      await startCheckout();
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Fel",
        description: "Kunde inte starta betalningen. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsPortalLoading(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error('Portal error:', error);
      toast({
        title: "Fel",
        description: "Kunde inte öppna kundportalen. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsPortalLoading(false);
    }
  };

  // Calculate days left in trial
  const daysLeft = company?.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(company.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const getSubscriptionBadge = () => {
    if (subLoading) return <Badge variant="outline"><Loader2 className="h-3 w-3 animate-spin" /></Badge>;
    
    if (subscribed) {
      return <Badge className="bg-green-500 hover:bg-green-600">Aktiv</Badge>;
    }
    
    if (company?.subscription_status === 'trialing') {
      return <Badge variant="secondary">Trial · {daysLeft} dagar kvar</Badge>;
    }
    
    return <Badge variant="destructive">Ingen aktiv plan</Badge>;
  };

  if (isLoadingCompany) {
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
              <Input id="company-name" defaultValue={company?.name || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-number">Organisationsnummer</Label>
              <Input id="org-number" defaultValue={company?.org_number || ""} placeholder="556XXX-XXXX" />
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
              {getSubscriptionBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscribed ? (
              <>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="font-medium text-primary">Spendo Pro</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Din prenumeration förnyas {subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString('sv-SE') : 'automatiskt'}
                  </p>
                </div>
                <Button variant="outline" onClick={handleManageBilling} disabled={isPortalLoading}>
                  {isPortalLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Hantera betalning
                </Button>
              </>
            ) : (
              <>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Spendo Pro</span>
                    <span className="font-bold">{company?.base_price_per_month || 499} kr/mån</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    + {company?.extra_user_price || 99} kr per extra användare
                  </p>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Obegränsade integrationer</li>
                  <li>✓ Automatisk kategorisering</li>
                  <li>✓ Månadsrapporter</li>
                  <li>✓ Prioriterad support</li>
                </ul>
                <Button onClick={handleUpgrade} disabled={isCheckoutLoading} className="w-full">
                  {isCheckoutLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Uppgradera till Spendo Pro
                </Button>
              </>
            )}
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
                <p className="text-sm text-muted-foreground">{user?.email || "demo@spendo.se"}</p>
              </div>
              <Badge>Owner</Badge>
            </div>
            <div className="flex gap-2">
              <Input placeholder="E-postadress" className="flex-1" />
              <Button variant="outline">Bjud in</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Extra användare kostar {company?.extra_user_price || 99} kr/månad
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
