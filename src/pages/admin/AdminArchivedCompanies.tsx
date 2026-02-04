import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ArchivedCompany {
  id: string;
  name: string;
  org_number: string | null;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
  archived_at: string | null;
  archived_by: string | null;
  user_count?: number;
}

export default function AdminArchivedCompanies() {
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<ArchivedCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<ArchivedCompany | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { t } = useTranslation();

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

    fetchCompanies();
  }, [user, isSuperAdmin, authLoading, navigate]);

  const fetchCompanies = async () => {
    try {
      const { data: companiesData, error } = await supabase
        .from("companies")
        .select("*")
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false });

      if (error) throw error;

      const { data: profiles } = await supabase.from("profiles").select("company_id");

      const userCounts = (profiles || []).reduce((acc, profile) => {
        if (profile.company_id) {
          acc[profile.company_id] = (acc[profile.company_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const companiesWithStats = (companiesData || []).map((company) => ({
        ...company,
        user_count: userCounts[company.id] || 0,
      }));

      setCompanies(companiesWithStats as ArchivedCompany[]);
    } catch (error) {
      console.error("Error fetching archived companies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const restoreCompany = async (companyId: string) => {
    const confirmed = window.confirm(t("admin.archived_companies.action.restore"));
    if (!confirmed) return;

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from("companies")
        .update({ archived_at: null, archived_by: null })
        .eq("id", companyId);

      if (error) throw error;

      setCompanies((prev) => prev.filter((company) => company.id !== companyId));
      setSelectedCompany(null);
    } catch (error) {
      console.error("Error restoring company:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteCompany = async (companyId: string) => {
    const confirmed = window.confirm(t("admin.archived_companies.action.delete"));
    if (!confirmed) return;

    try {
      setIsUpdating(true);
      const { error } = await supabase.from("companies").delete().eq("id", companyId);

      if (error) throw error;

      setCompanies((prev) => prev.filter((company) => company.id !== companyId));
      setSelectedCompany(null);
    } catch (error) {
      console.error("Error deleting company:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("sv-SE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateStr));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "trialing":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            {t("admin.companies.status.trial")}
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            {t("admin.companies.status.active")}
          </Badge>
        );
      case "past_due":
        return <Badge variant="destructive">{t("admin.companies.status.past_due")}</Badge>;
      case "canceled":
        return <Badge variant="secondary">{t("admin.companies.status.canceled")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.archived_companies.title")}</h1>
          <p className="text-muted-foreground">{t("admin.archived_companies.subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.archived_companies.card_title")}</CardTitle>
            <CardDescription>{t("admin.archived_companies.card_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {companies.length === 0 ? (
              <div className="text-center py-12">
                <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{t("admin.archived_companies.empty_title")}</h3>
                <p className="text-muted-foreground">{t("admin.archived_companies.empty_desc")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.archived_companies.table.company")}</TableHead>
                    <TableHead>{t("admin.archived_companies.table.org")}</TableHead>
                    <TableHead>{t("admin.archived_companies.table.status")}</TableHead>
                    <TableHead>{t("admin.archived_companies.table.users")}</TableHead>
                    <TableHead>{t("admin.archived_companies.table.archived")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow
                      key={company.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedCompany(company)}
                    >
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell className="text-muted-foreground">{company.org_number || t("common.none")}</TableCell>
                      <TableCell>{getStatusBadge(company.subscription_status)}</TableCell>
                      <TableCell>{company.user_count}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {company.archived_at ? formatDate(company.archived_at) : t("common.none")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={!!selectedCompany} onOpenChange={(open) => !open && setSelectedCompany(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{t("admin.archived_companies.sheet_title")}</SheetTitle>
            <SheetDescription>{t("admin.archived_companies.sheet_desc")}</SheetDescription>
          </SheetHeader>

          {selectedCompany && (
            <div className="mt-6">
              <Tabs defaultValue="details">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="details">{t("admin.archived_companies.tab.details")}</TabsTrigger>
                  <TabsTrigger value="actions">{t("admin.archived_companies.tab.actions")}</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.companies.label.company")}</p>
                      <p className="text-base font-medium">{selectedCompany.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.companies.label.org")}</p>
                      <p className="text-base font-medium">{selectedCompany.org_number || t("common.none")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.companies.label.status")}</p>
                      <div className="mt-2">{getStatusBadge(selectedCompany.subscription_status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("common.archived")}</p>
                      <p className="text-base font-medium">
                        {selectedCompany.archived_at ? formatDate(selectedCompany.archived_at) : t("common.none")}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="actions">
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={isUpdating}
                      onClick={() => restoreCompany(selectedCompany.id)}
                    >
                      {t("admin.archived_companies.action.restore")}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-destructive hover:text-destructive"
                      disabled={isUpdating}
                      onClick={() => deleteCompany(selectedCompany.id)}
                    >
                      {t("admin.archived_companies.action.delete")}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
