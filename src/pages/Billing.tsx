import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, CheckCircle, Receipt, Users, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { usePricingSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { Company } from "@/types/spendo";

interface TeamCount {
  company_id: string;
}

export default function Billing() {
  const { t } = useTranslation();
  const { companyId } = useAuth();
  const { subscribed, subscriptionEnd, isLoading: subLoading, startCheckout, openCustomerPortal } = useSubscription();
  const { data: pricing, isLoading: pricingLoading } = usePricingSettings();

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (error) throw error;
      return data as Company;
    },
    enabled: !!companyId,
  });

  const { data: teamCount = 0, isLoading: teamLoading } = useQuery({
    queryKey: ["team-count", companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const { data, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("company_id", companyId);

      if (error) throw error;
      return (data as TeamCount[]).length;
    },
    enabled: !!companyId,
  });

  const isLoading = subLoading || pricingLoading || companyLoading || teamLoading;

  const invoiceEstimate = useMemo(() => {
    if (!pricing || !company) return null;

    const basePrice = company.base_price_per_month || pricing.base_price;
    const extraUserPrice = company.extra_user_price || pricing.extra_user_price;
    const maxUsersIncluded = company.max_users_included || 1;

    const extraUsers = Math.max(0, teamCount - maxUsersIncluded);
    const extraUsersCost = extraUsers * extraUserPrice;
    const total = basePrice + extraUsersCost;

    return {
      basePrice,
      extraUserPrice,
      maxUsersIncluded,
      teamCount,
      extraUsers,
      extraUsersCost,
      total,
      currency: pricing.currency || "kr",
    };
  }, [pricing, company, teamCount]);

  const daysLeft = company?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(company.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

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
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("billing.title")}</h1>
          <p className="text-muted-foreground">{t("billing.subtitle")}</p>
        </div>

        {/* Current Plan Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">{t("billing.current_plan")}</CardTitle>
              </div>
              {subscribed ? (
                <Badge className="bg-green-500 hover:bg-green-600">{t("subscription.active")}</Badge>
              ) : company?.subscription_status === "trialing" ? (
                <Badge variant="secondary">{t("settings.subscription_trial", { days: daysLeft })}</Badge>
              ) : (
                <Badge variant="destructive">{t("subscription.canceled")}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscribed ? (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-medium text-primary">{t("settings.pro_title")}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("settings.pro_renew", {
                    date: subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString("sv-SE") : t("common.automatic"),
                  })}
                </p>
              </div>
            ) : (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="font-medium text-destructive">
                    {company?.subscription_status === "trialing"
                      ? t("billing.trial_active", { days: daysLeft })
                      : t("billing.no_subscription")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{t("billing.upgrade_prompt")}</p>
              </div>
            )}

            <div className="flex gap-2">
              {subscribed ? (
                <Button variant="outline" onClick={openCustomerPortal}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t("settings.pro_manage")}
                </Button>
              ) : (
                <Button onClick={startCheckout}>{t("settings.pro_upgrade")}</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Next Invoice Estimate */}
        {invoiceEstimate && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">{t("billing.next_invoice")}</CardTitle>
              </div>
              <CardDescription>{t("billing.next_invoice_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("billing.item")}</TableHead>
                    <TableHead className="text-right">{t("billing.quantity")}</TableHead>
                    <TableHead className="text-right">{t("billing.unit_price")}</TableHead>
                    <TableHead className="text-right">{t("billing.amount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">{t("billing.base_subscription")}</TableCell>
                    <TableCell className="text-right">1</TableCell>
                    <TableCell className="text-right">
                      {invoiceEstimate.basePrice} {invoiceEstimate.currency}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoiceEstimate.basePrice} {invoiceEstimate.currency}
                    </TableCell>
                  </TableRow>
                  {invoiceEstimate.extraUsers > 0 && (
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {t("billing.extra_users")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{invoiceEstimate.extraUsers}</TableCell>
                      <TableCell className="text-right">
                        {invoiceEstimate.extraUserPrice} {invoiceEstimate.currency}
                      </TableCell>
                      <TableCell className="text-right">
                        {invoiceEstimate.extraUsersCost} {invoiceEstimate.currency}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("billing.team_summary", {
                      total: invoiceEstimate.teamCount,
                      included: invoiceEstimate.maxUsersIncluded,
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t("billing.estimated_total")}</p>
                  <p className="text-2xl font-bold">
                    {invoiceEstimate.total} {invoiceEstimate.currency}
                    <span className="text-sm font-normal text-muted-foreground">/mån</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Features */}
        {pricing && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("billing.whats_included")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                {pricing.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
