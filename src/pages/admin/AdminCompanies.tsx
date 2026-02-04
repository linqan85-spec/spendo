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
import { Building2, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CompanyWithStats {
  id: string;
  name: string;
  org_number: string | null;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
  user_count?: number;
  archived_at?: string | null;
  archived_by?: string | null;
}

interface CompanyUser {
  id: string;
  email: string;
  name: string | null;
  role: "owner" | "admin" | "member" | null;
}

export default function AdminCompanies() {
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithStats | null>(null);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
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

  useEffect(() => {
    if (!selectedCompany) return;
    fetchCompanyUsers(selectedCompany.id);
  }, [selectedCompany?.id]);

  const fetchCompanies = async () => {
    try {
      const { data: companiesData, error } = await supabase
        .from("companies")
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("company_id")
        .is("archived_at", null);

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

      setCompanies(companiesWithStats);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanyUsers = async (companyId: string) => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, name")
        .eq("company_id", companyId)
        .is("archived_at", null)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("company_id", companyId);

      if (rolesError) throw rolesError;

      const roleMap = (rolesData || []).reduce((acc, role) => {
        acc[role.user_id] = role.role as CompanyUser["role"];
        return acc;
      }, {} as Record<string, CompanyUser["role"]>);

      const enriched = (profiles || []).map((profile) => ({
        ...profile,
        role: roleMap[profile.id] ?? null,
      }));

      setCompanyUsers(enriched as CompanyUser[]);
    } catch (error) {
      console.error("Error fetching company users:", error);
      setCompanyUsers([]);
    }
  };

  const updateCompanyStatus = async (companyId: string, status: string) => {
    const confirmed = window.confirm(`${t("admin.companies.label.status")}: ${status}?`);
    if (!confirmed) return;

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from("companies")
        .update({ subscription_status: status })
        .eq("id", companyId);

      if (error) throw error;

      setCompanies((prev) =>
        prev.map((company) =>
          company.id === companyId ? { ...company, subscription_status: status } : company
        )
      );
      setSelectedCompany((prev) => (prev ? { ...prev, subscription_status: status } : prev));
    } catch (error) {
      console.error("Error updating company status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const archiveCompany = async (companyId: string) => {
    if (!user) return;
    const confirmed = window.confirm(t("admin.companies.archive"));
    if (!confirmed) return;

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from("companies")
        .update({ archived_at: new Date().toISOString(), archived_by: user.id })
        .eq("id", companyId);

      if (error) throw error;

      setCompanies((prev) => prev.filter((company) => company.id !== companyId));
      setSelectedCompany(null);
    } catch (error) {
      console.error("Error archiving company:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const setCompanyOwner = async (companyId: string, userId: string) => {
    const confirmed = window.confirm(t("admin.companies.owner.set"));
    if (!confirmed) return;

    try {
      setIsUpdating(true);

      const { error: demoteError } = await supabase
        .from("user_roles")
        .update({ role: "admin" })
        .eq("company_id", companyId)
        .eq("role", "owner")
        .neq("user_id", userId);

      if (demoteError) throw demoteError;

      const { error: upsertError } = await supabase
        .from("user_roles")
        .upsert(
          {
            user_id: userId,
            company_id: companyId,
            role: "owner",
          },
          { onConflict: "user_id,company_id" }
        );

      if (upsertError) throw upsertError;

      setCompanyUsers((prev) =>
        prev.map((member) =>
          member.id === userId
            ? { ...member, role: "owner" }
            : member.role === "owner"
              ? { ...member, role: "admin" }
              : member
        )
      );
    } catch (error) {
      console.error("Error setting company owner:", error);
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

  const getDaysRemaining = (trialEndsAt: string | null) => {
    if (!trialEndsAt) return null;
    const diff = new Date(trialEndsAt).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const getStatusBadge = (status: string, trialEndsAt: string | null) => {
    switch (status) {
      case "trialing":
        const days = getDaysRemaining(trialEndsAt);
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            {t("admin.companies.status.trial")} ({days} dagar kvar)
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

  const getRoleBadge = (role: CompanyUser["role"]) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-primary/20 text-primary border-primary/30">{t("admin.users.role.owner")}</Badge>;
      case "admin":
        return <Badge className="bg-accent text-accent-foreground">{t("admin.users.role.admin")}</Badge>;
      case "member":
        return <Badge variant="outline">{t("admin.users.role.member")}</Badge>;
      default:
        return <Badge variant="outline">{t("admin.users.role.unknown")}</Badge>;
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
          <h1 className="text-2xl font-bold">{t("admin.companies.title")}</h1>
          <p className="text-muted-foreground">{t("admin.companies.subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.companies.card_title")}</CardTitle>
            <CardDescription>{t("admin.companies.card_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {companies.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{t("admin.companies.empty_title")}</h3>
                <p className="text-muted-foreground">{t("admin.companies.empty_desc")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.companies.table.company")}</TableHead>
                    <TableHead>{t("admin.companies.table.org")}</TableHead>
                    <TableHead>{t("admin.companies.table.status")}</TableHead>
                    <TableHead>{t("admin.companies.table.users")}</TableHead>
                    <TableHead>{t("admin.companies.table.created")}</TableHead>
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
                      <TableCell>{getStatusBadge(company.subscription_status, company.trial_ends_at)}</TableCell>
                      <TableCell>{company.user_count}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(company.created_at)}</TableCell>
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
            <SheetTitle>{t("admin.companies.sheet_title")}</SheetTitle>
            <SheetDescription>{t("admin.companies.sheet_desc")}</SheetDescription>
          </SheetHeader>

          {selectedCompany && (
            <div className="mt-6">
              <Tabs defaultValue="overview">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="overview">{t("admin.companies.tab.overview")}</TabsTrigger>
                  <TabsTrigger value="owner">{t("admin.companies.tab.owner")}</TabsTrigger>
                  <TabsTrigger value="admin">{t("admin.companies.tab.admin")}</TabsTrigger>
                  <TabsTrigger value="archive">{t("admin.companies.tab.archive")}</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
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
                      <div className="mt-2">
                        {getStatusBadge(selectedCompany.subscription_status, selectedCompany.trial_ends_at)}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.companies.label.users")}</p>
                      <p className="text-base font-medium">{selectedCompany.user_count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.companies.label.created")}</p>
                      <p className="text-base font-medium">{formatDate(selectedCompany.created_at)}</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="owner">
                  <div className="space-y-4">
                    {companyUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t("admin.users.empty_desc")}</p>
                    ) : (
                      companyUsers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{member.name || t("common.none")}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3.5 w-3.5" />
                              {member.email}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getRoleBadge(member.role)}
                            {member.role !== "owner" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isUpdating}
                                onClick={() => setCompanyOwner(selectedCompany.id, member.id)}
                              >
                                {t("admin.companies.owner.set")}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="admin">
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={isUpdating}
                      onClick={() => updateCompanyStatus(selectedCompany.id, "active")}
                    >
                      {t("admin.companies.admin.active")}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={isUpdating}
                      onClick={() => updateCompanyStatus(selectedCompany.id, "trialing")}
                    >
                      {t("admin.companies.admin.trial")}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={isUpdating}
                      onClick={() => updateCompanyStatus(selectedCompany.id, "past_due")}
                    >
                      {t("admin.companies.admin.past_due")}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-destructive hover:text-destructive"
                      disabled={isUpdating}
                      onClick={() => updateCompanyStatus(selectedCompany.id, "canceled")}
                    >
                      {t("admin.companies.admin.cancel")}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="archive">
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full text-destructive hover:text-destructive"
                      disabled={isUpdating}
                      onClick={() => archiveCompany(selectedCompany.id)}
                    >
                      {t("admin.companies.archive")}
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
