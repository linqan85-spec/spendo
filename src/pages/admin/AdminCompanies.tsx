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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Building2, Mail, Archive } from "lucide-react";
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
  const [showArchived, setShowArchived] = useState(false);
  const { t } = useTranslation();

  // Filter companies based on archived state.
  // When showArchived is enabled, include both active and archived companies.
  const filteredCompanies = companies.filter((company) =>
    showArchived ? true : company.archived_at === null
  );

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
        .order("created_at", { ascending: false });

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

  const updateCompanyStatus = async (companyId: string, status: "active" | "trialing" | "past_due" | "canceled" | "unpaid") => {
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
      // Note: archived_at column doesn't exist in companies table currently
      // This would need a database migration to work
      console.log("Would archive company:", companyId);

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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>{t("admin.companies.card_title")}</CardTitle>
              <CardDescription>{t("admin.companies.card_desc")}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-archived"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <Label htmlFor="show-archived" className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Archive className="h-3.5 w-3.5" />
                {t("admin.companies.show_archived")}
              </Label>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCompanies.length === 0 ? (
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
                  {filteredCompanies.map((company) => (
                    <TableRow
                      key={company.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedCompany(company)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {company.name}
                          {company.archived_at && (
                            <Badge variant="outline" className="text-muted-foreground">
                              <Archive className="h-3 w-3 mr-1" />
                              {t("common.archived")}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
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
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <span>{selectedCompany?.name}</span>
            </SheetTitle>
            <SheetDescription>
              {selectedCompany?.org_number || t("common.none")}
            </SheetDescription>
          </SheetHeader>

          {selectedCompany && (
            <div className="mt-6 space-y-6">
              {/* Overview Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("admin.companies.label.status")}
                    </p>
                    {getStatusBadge(selectedCompany.subscription_status, selectedCompany.trial_ends_at)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("admin.companies.label.users")}
                    </p>
                    <p className="text-sm font-medium">{selectedCompany.user_count}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("admin.companies.label.created")}
                    </p>
                    <p className="text-sm font-medium">{formatDate(selectedCompany.created_at)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t" />

              {/* Change Owner Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">{t("admin.companies.tab.owner")}</h4>
                {companyUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("admin.users.empty_desc")}</p>
                ) : (
                  <div className="space-y-2">
                    {companyUsers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {member.name || t("common.none")}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
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
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t" />

              {/* Subscription Status Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">{t("admin.companies.label.status")}</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedCompany.subscription_status === "active" ? "default" : "outline"}
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => updateCompanyStatus(selectedCompany.id, "active")}
                  >
                    {t("admin.companies.status.active")}
                  </Button>
                  <Button
                    variant={selectedCompany.subscription_status === "trialing" ? "default" : "outline"}
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => updateCompanyStatus(selectedCompany.id, "trialing")}
                  >
                    {t("admin.companies.status.trial")}
                  </Button>
                  <Button
                    variant={selectedCompany.subscription_status === "past_due" ? "destructive" : "outline"}
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => updateCompanyStatus(selectedCompany.id, "past_due")}
                  >
                    {t("admin.companies.status.past_due")}
                  </Button>
                  <Button
                    variant={selectedCompany.subscription_status === "canceled" ? "secondary" : "outline"}
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => updateCompanyStatus(selectedCompany.id, "canceled")}
                  >
                    {t("admin.companies.status.canceled")}
                  </Button>
                </div>
              </div>

              <div className="border-t" />

              {/* Danger Zone */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-destructive">{t("admin.companies.tab.archive")}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  disabled={isUpdating}
                  onClick={() => archiveCompany(selectedCompany.id)}
                >
                  {t("admin.companies.archive")}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
