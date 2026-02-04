import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EditContractDialog } from "@/components/admin/EditContractDialog";
import { ArrowLeft, Building2, Users, Receipt, CreditCard, Calendar, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CompanyDetail {
  id: string;
  name: string;
  org_number: string | null;
  currency: string;
  subscription_status: string;
  base_price_per_month: number;
  extra_user_price: number;
  max_users_included: number;
  max_manual_expenses: number;
  trial_ends_at: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  role?: string;
}

export default function AdminCompanyDetail() {
  const { t } = useTranslation();
  const { companyId } = useParams<{ companyId: string }>();
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [expenseCount, setExpenseCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (!isSuperAdmin) {
      navigate("/dashboard");
      return;
    }

    if (companyId) {
      fetchCompanyDetails();
    }
  }, [user, isSuperAdmin, authLoading, companyId, navigate]);

  const fetchCompanyDetails = async () => {
    try {
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (companyError) throw companyError;

      const companyWithDefaults = {
        ...companyData,
        max_manual_expenses: (companyData as unknown as { max_manual_expenses?: number }).max_manual_expenses ?? 20,
      };
      setCompany(companyWithDefaults);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("company_id", companyId);

      if (profilesError) throw profilesError;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("company_id", companyId!);

      const roleMap = (roles || []).reduce((acc, r) => {
        acc[r.user_id] = r.role;
        return acc;
      }, {} as Record<string, string>);

      const usersWithRoles = (profiles || []).map((p) => ({
        ...p,
        role: roleMap[p.id],
      }));

      setUsers(usersWithRoles);

      const { count } = await supabase
        .from("expenses")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId!);

      setExpenseCount(count || 0);
    } catch (error) {
      console.error("Error fetching company details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("sv-SE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateStr));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRoleBadge = (role: string | undefined) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-primary/20 text-primary border-primary/30">{t("admin.users.role.owner")}</Badge>;
      case "admin":
        return <Badge className="bg-accent text-accent-foreground">{t("admin.users.role.admin")}</Badge>;
      default:
        return <Badge variant="outline">{t("admin.users.role.member")}</Badge>;
    }
  };

  const subscriptionLabel = (status: string) => {
    switch (status) {
      case "trialing":
        return t("subscription.trialing");
      case "active":
        return t("subscription.active");
      case "past_due":
        return t("subscription.past_due");
      case "canceled":
        return t("subscription.canceled");
      case "unpaid":
        return t("subscription.unpaid");
      default:
        return status;
    }
  };

  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    );
  }

  if (!company) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-xl font-semibold">{t("admin.company_detail.not_found")}</h2>
          <Button className="mt-4" onClick={() => navigate("/admin/companies")}>
            {t("admin.company_detail.back_to_companies")}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <Button variant="ghost" onClick={() => navigate("/admin/companies")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>

        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <p className="text-muted-foreground">
              {company.org_number || t("admin.company_detail.no_org_number")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.company_detail.stats.users")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{expenseCount}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.company_detail.stats.expenses")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(company.base_price_per_month)}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.company_detail.stats.per_month")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {subscriptionLabel(company.subscription_status)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.company_detail.stats.since", { date: formatDate(company.created_at) })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("admin.company_detail.contract.title")}</CardTitle>
            <EditContractDialog
              companyId={company.id}
              initialValues={{
                base_price_per_month: company.base_price_per_month,
                extra_user_price: company.extra_user_price,
                max_users_included: company.max_users_included,
                max_manual_expenses: company.max_manual_expenses,
                subscription_status: company.subscription_status,
                trial_ends_at: company.trial_ends_at,
              }}
              onSuccess={fetchCompanyDetails}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("admin.company_detail.contract.status")}</p>
                <Badge variant="outline" className="mt-1">
                  {subscriptionLabel(company.subscription_status)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("admin.company_detail.contract.currency")}</p>
                <p className="mt-1">{company.currency}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("admin.company_detail.contract.base_price")}</p>
                <p className="mt-1">{t("admin.company_detail.contract.per_month", { amount: formatCurrency(company.base_price_per_month) })}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("admin.company_detail.contract.extra_user")}</p>
                <p className="mt-1">{t("admin.company_detail.contract.extra_user_value", { amount: formatCurrency(company.extra_user_price) })}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("admin.company_detail.contract.users_included")}</p>
                <p className="mt-1">{company.max_users_included}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("admin.company_detail.contract.max_manual")}</p>
                <p className="mt-1">{company.max_manual_expenses}</p>
              </div>
              {company.trial_ends_at && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">{t("admin.company_detail.contract.trial_ends")}</p>
                  <p className="mt-1">{formatDate(company.trial_ends_at)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.company_detail.users.title")}</CardTitle>
            <CardDescription>{t("admin.company_detail.users.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{t("admin.company_detail.users.empty")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.company_detail.users.table.name")}</TableHead>
                    <TableHead>{t("admin.company_detail.users.table.email")}</TableHead>
                    <TableHead>{t("admin.company_detail.users.table.role")}</TableHead>
                    <TableHead>{t("admin.company_detail.users.table.joined")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userProfile) => (
                    <TableRow key={userProfile.id}>
                      <TableCell className="font-medium">
                        {userProfile.name || t("common.none")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {userProfile.email}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(userProfile.role)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(userProfile.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
