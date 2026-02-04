import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, CreditCard, Bell, Loader2, ExternalLink, CheckCircle, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Company } from "@/types/spendo";
import { useTranslation } from "react-i18next";

interface TeamUser {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  role: "owner" | "admin" | "member" | null;
  archived_at: string | null;
  archived_by: string | null;
}

export default function Settings() {
  const { companyId, user, userRole } = useAuth();
  const { subscribed, subscriptionEnd, isLoading: subLoading, startCheckout, openCustomerPortal, checkSubscription } = useSubscription();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [selectedTeamUser, setSelectedTeamUser] = useState<TeamUser | null>(null);
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);
  const { t } = useTranslation();

  const canManageTeam = userRole === "owner" || userRole === "admin";

  useEffect(() => {
    const checkoutStatus = searchParams.get("checkout");
    if (checkoutStatus === "success") {
      toast({
        title: t("settings.pro_title"),
        description: t("settings.subscription_active"),
      });
      checkSubscription();
    } else if (checkoutStatus === "canceled") {
      toast({
        title: t("settings.subscription"),
        description: t("settings.subscription_none"),
        variant: "destructive",
      });
    }
  }, [searchParams, toast, checkSubscription, t]);

  useEffect(() => {
    async function fetchCompany() {
      if (!companyId) {
        setIsLoadingCompany(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("companies")
          .select("*")
          .eq("id", companyId)
          .single();

        if (error) throw error;
        setCompany(data as Company);
      } catch (error) {
        console.error("Error fetching company:", error);
      } finally {
        setIsLoadingCompany(false);
      }
    }

    fetchCompany();
  }, [companyId]);

  useEffect(() => {
    async function fetchTeam() {
      if (!companyId) {
        setIsLoadingTeam(false);
        return;
      }

      try {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, email, name, created_at, archived_at, archived_by")
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
          acc[role.user_id] = role.role as TeamUser["role"];
          return acc;
        }, {} as Record<string, TeamUser["role"]>);

        const enriched = (profiles || []).map((profile) => ({
          ...profile,
          role: roleMap[profile.id] ?? null,
        }));

        setTeamUsers(enriched as TeamUser[]);
      } catch (error) {
        console.error("Error fetching team:", error);
      } finally {
        setIsLoadingTeam(false);
      }
    }

    fetchTeam();
  }, [companyId]);

  const handleUpgrade = async () => {
    setIsCheckoutLoading(true);
    try {
      await startCheckout();
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: t("settings.subscription"),
        description: t("settings.subscription_none"),
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
      console.error("Portal error:", error);
      toast({
        title: t("settings.subscription"),
        description: t("settings.subscription_none"),
        variant: "destructive",
      });
    } finally {
      setIsPortalLoading(false);
    }
  };

  const updateTeamRole = async (targetUser: TeamUser, role: TeamUser["role"]) => {
    if (!companyId || !role) return;

    const confirmed = window.confirm(`${t("settings.team.tab.role")}: ${role}?`);
    if (!confirmed) return;

    try {
      setIsUpdatingTeam(true);
      const { error } = await supabase
        .from("user_roles")
        .upsert(
          {
            user_id: targetUser.id,
            company_id: companyId,
            role,
          },
          { onConflict: "user_id,company_id" }
        );

      if (error) throw error;

      setTeamUsers((prev) =>
        prev.map((item) => (item.id === targetUser.id ? { ...item, role } : item))
      );

      setSelectedTeamUser((prev) => (prev ? { ...prev, role } : prev));
    } catch (error) {
      console.error("Error updating team role:", error);
    } finally {
      setIsUpdatingTeam(false);
    }
  };

  const archiveTeamUser = async (targetUser: TeamUser) => {
    if (!user) return;
    const confirmed = window.confirm(`${t("settings.team.archive")} ${targetUser.email}?`);
    if (!confirmed) return;

    try {
      setIsUpdatingTeam(true);
      const { error } = await supabase
        .from("profiles")
        .update({ archived_at: new Date().toISOString(), archived_by: user.id })
        .eq("id", targetUser.id);

      if (error) throw error;

      setTeamUsers((prev) => prev.filter((member) => member.id !== targetUser.id));
      setSelectedTeamUser(null);
    } catch (error) {
      console.error("Error archiving team user:", error);
    } finally {
      setIsUpdatingTeam(false);
    }
  };

  const daysLeft = company?.trial_ends_at
    ? Math.max(
        0,
        Math.ceil((new Date(company.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : 0;

  const getSubscriptionBadge = () => {
    if (subLoading) return <Badge variant="outline"><Loader2 className="h-3 w-3 animate-spin" /></Badge>;

    if (subscribed) {
      return <Badge className="bg-green-500 hover:bg-green-600">{t("settings.subscription_active")}</Badge>;
    }

    if (company?.subscription_status === "trialing") {
      return <Badge variant="secondary">{t("settings.subscription_trial", { days: daysLeft })}</Badge>;
    }

    return <Badge variant="destructive">{t("settings.subscription_none")}</Badge>;
  };

  const getRoleBadge = (role: TeamUser["role"]) => {
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
          <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
          <p className="text-muted-foreground">{t("settings.subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{t("settings.company_info")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">{t("settings.company_name")}</Label>
              <Input id="company-name" defaultValue={company?.name || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-number">{t("settings.org_number")}</Label>
              <Input id="org-number" defaultValue={company?.org_number || ""} placeholder={t("settings.org_number_placeholder")} />
            </div>
            <Button>{t("settings.save_changes")}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">{t("settings.subscription")}</CardTitle>
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
                    <span className="font-medium text-primary">{t("settings.pro_title")}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.pro_renew", { date: subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString("sv-SE") : t("common.automatic") })}
                  </p>
                </div>
                <Button variant="outline" onClick={handleManageBilling} disabled={isPortalLoading}>
                  {isPortalLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  {t("settings.pro_manage")}
                </Button>
              </>
            ) : (
              <>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{t("settings.pro_title")}</span>
                    <span className="font-bold">{t("settings.pro_price", { price: company?.base_price_per_month || 499 })}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.pro_extra_users", { price: company?.extra_user_price || 99 })}
                  </p>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>{t("settings.pro_feature_1")}</li>
                  <li>{t("settings.pro_feature_2")}</li>
                  <li>{t("settings.pro_feature_3")}</li>
                  <li>{t("settings.pro_feature_4")}</li>
                </ul>
                <Button onClick={handleUpgrade} disabled={isCheckoutLoading} className="w-full">
                  {isCheckoutLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {t("settings.pro_upgrade")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{t("settings.team")}</CardTitle>
            </div>
            <CardDescription>{t("settings.team_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingTeam ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.users.table.name")}</TableHead>
                    <TableHead>{t("admin.users.table.email")}</TableHead>
                    <TableHead>{t("common.role")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamUsers.map((member) => (
                    <TableRow
                      key={member.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedTeamUser(member)}
                    >
                      <TableCell className="font-medium">{member.name || t("common.none")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {member.email}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="flex gap-2">
              <Input placeholder={t("settings.team.invite_placeholder")} className="flex-1" />
              <Button variant="outline">{t("settings.team.invite")}</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("settings.team.extra_cost", { price: company?.extra_user_price || 99 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{t("settings.notifications")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t("settings.notification_monthly")}</p>
                  <p className="text-sm text-muted-foreground">{t("settings.notification_monthly_desc")}</p>
                </div>
                <Button variant="outline" size="sm">{t("settings.activate")}</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t("settings.notification_sync")}</p>
                  <p className="text-sm text-muted-foreground">{t("settings.notification_sync_desc")}</p>
                </div>
                <Button variant="outline" size="sm">{t("settings.activate")}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={!!selectedTeamUser} onOpenChange={(open) => !open && setSelectedTeamUser(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{t("settings.team.sheet_title")}</SheetTitle>
            <SheetDescription>{t("settings.team.sheet_desc")}</SheetDescription>
          </SheetHeader>

          {selectedTeamUser && (
            <div className="mt-6">
              <Tabs defaultValue="details">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="details">{t("settings.team.tab.details")}</TabsTrigger>
                  <TabsTrigger value="role">{t("settings.team.tab.role")}</TabsTrigger>
                  <TabsTrigger value="archive">{t("settings.team.tab.archive")}</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.users.label.name")}</p>
                      <p className="text-base font-medium">{selectedTeamUser.name || t("common.none")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.users.label.email")}</p>
                      <p className="text-base font-medium">{selectedTeamUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("common.role")}</p>
                      <div className="mt-2">{getRoleBadge(selectedTeamUser.role)}</div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="role">
                  {!canManageTeam && (
                    <p className="text-sm text-muted-foreground">{t("settings.team.no_permission_role")}</p>
                  )}

                  {canManageTeam && (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={isUpdatingTeam || selectedTeamUser.role === "owner"}
                        onClick={() => updateTeamRole(selectedTeamUser, "admin")}
                      >
                        {t("settings.team.set_admin")}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={isUpdatingTeam || selectedTeamUser.role === "owner"}
                        onClick={() => updateTeamRole(selectedTeamUser, "member")}
                      >
                        {t("settings.team.set_member")}
                      </Button>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="archive">
                  {!canManageTeam && (
                    <p className="text-sm text-muted-foreground">{t("settings.team.no_permission_archive")}</p>
                  )}

                  {canManageTeam && (
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full text-destructive hover:text-destructive"
                        disabled={isUpdatingTeam || selectedTeamUser.role === "owner"}
                        onClick={() => archiveTeamUser(selectedTeamUser)}
                      >
                        {t("settings.team.archive")}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}

