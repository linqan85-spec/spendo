import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Users, TrendingUp, CreditCard, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CompanyRecord {
  id: string;
  subscription_status: string;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    archivedCompanies: 0,
    activeTrials: 0,
    paidCompanies: 0,
    totalUsers: 0,
  });

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

    fetchStats();
  }, [user, isSuperAdmin, authLoading, navigate]);

  const fetchStats = async () => {
    try {
      const { data: companiesData, error } = await supabase
        .from("companies")
        .select("id, subscription_status, archived_at");

      if (error) throw error;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("company_id");

      const userCounts = (profiles || []).reduce((acc, profile) => {
        if (profile.company_id) {
          acc[profile.company_id] = (acc[profile.company_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const allCompanies = (companiesData || []) as (CompanyRecord & { archived_at: string | null })[];
      const activeCompanies = allCompanies.filter((c) => !c.archived_at);
      const archivedCount = allCompanies.length - activeCompanies.length;
      const activeTrials = activeCompanies.filter((c) => c.subscription_status === "trialing").length;
      const paidCompanies = activeCompanies.filter((c) => c.subscription_status === "active").length;
      const totalUsers = Object.values(userCounts).reduce((a, b) => a + b, 0);

      setStats({
        totalCompanies: activeCompanies.length,
        archivedCompanies: archivedCount,
        activeTrials,
        paidCompanies,
        totalUsers,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </AppLayout>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t("admin.dashboard.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("admin.dashboard.subtitle")}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.dashboard.cards.total_companies")}</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompanies}</div>
              <p className="text-xs text-muted-foreground">
                {t("admin.dashboard.cards.total_companies_hint")}
                {stats.archivedCompanies > 0 && (
                  <span className="block mt-0.5">{stats.archivedCompanies} arkiverade</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.dashboard.cards.active_trials")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeTrials}</div>
              <p className="text-xs text-muted-foreground">{t("admin.dashboard.cards.active_trials_hint")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.dashboard.cards.paid_companies")}</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paidCompanies}</div>
              <p className="text-xs text-muted-foreground">{t("admin.dashboard.cards.paid_companies_hint")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.dashboard.cards.total_users")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">{t("admin.dashboard.cards.total_users_hint")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
