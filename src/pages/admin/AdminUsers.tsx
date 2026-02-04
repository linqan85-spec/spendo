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
import { Mail, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  company_id: string | null;
  staff_role: "admin" | "support" | null;
  archived_at: string | null;
  archived_by: string | null;
}

export default function AdminUsers() {
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<(UserProfile & { companyName?: string; role?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<(UserProfile & { companyName?: string; role?: string }) | null>(null);
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

    fetchUsers();
  }, [user, isSuperAdmin, authLoading, navigate]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, name, created_at, company_id, staff_role, archived_at, archived_by")
        .is("archived_at", null)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: companies } = await supabase.from("companies").select("id, name");

      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role, company_id");

      const companyMap = (companies || []).reduce((acc, company) => {
        acc[company.id] = company.name;
        return acc;
      }, {} as Record<string, string>);

      const roleMap = (rolesData || []).reduce((acc, role) => {
        if (!acc[role.user_id]) {
          acc[role.user_id] = role.role;
        }
        return acc;
      }, {} as Record<string, string>);

      const enrichedUsers = (profiles || []).map((profile) => ({
        ...profile,
        companyName: profile.company_id ? companyMap[profile.company_id] : undefined,
        role: roleMap[profile.id],
      }));

      setUsers(enrichedUsers as (UserProfile & { companyName?: string; role?: string })[]);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStaffRole = async (
    targetUser: UserProfile & { companyName?: string; role?: string },
    staffRole: UserProfile["staff_role"]
  ) => {
    const label = staffRole === "admin"
      ? t("admin.users.spendo.admin")
      : staffRole === "support"
        ? t("admin.users.spendo.support")
        : t("admin.users.spendo.none");

    const confirmed = window.confirm(t("admin.users.spendo.set_admin").includes("Spendo")
      ? `${t("admin.users.spendo.set_admin").replace("Sätt som ", "")}: ${targetUser.email}?`
      : `Sätt ${targetUser.email} till ${label}?`);
    if (!confirmed) return;

    try {
      setUpdatingId(targetUser.id);
      const { error } = await supabase
        .from("profiles")
        .update({ staff_role: staffRole })
        .eq("id", targetUser.id);

      if (error) throw error;
      await fetchUsers();

      setSelectedUser((prev) => (prev ? { ...prev, staff_role: staffRole } : prev));
    } catch (error) {
      console.error("Error updating staff role:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const archiveUser = async (targetUser: UserProfile & { companyName?: string; role?: string }) => {
    if (!user) return;
    const confirmed = window.confirm(`${t("admin.users.archive_action")} ${targetUser.email}?`);
    if (!confirmed) return;

    try {
      setUpdatingId(targetUser.id);
      const { error } = await supabase
        .from("profiles")
        .update({
          archived_at: new Date().toISOString(),
          archived_by: user.id,
        })
        .eq("id", targetUser.id);

      if (error) throw error;

      setUsers((prev) => prev.filter((item) => item.id !== targetUser.id));
      setSelectedUser(null);
    } catch (error) {
      console.error("Error archiving user:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("sv-SE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateStr));
  };

  const getRoleBadge = (role: string | undefined) => {
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

  const getStaffBadge = (role: UserProfile["staff_role"]) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">{t("admin.users.spendo.admin")}</Badge>;
      case "support":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">{t("admin.users.spendo.support")}</Badge>;
      default:
        return <Badge variant="outline">{t("admin.users.spendo.none")}</Badge>;
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
          <h1 className="text-2xl font-bold">{t("admin.users.title")}</h1>
          <p className="text-muted-foreground">{t("admin.users.subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.users.card_title")}</CardTitle>
            <CardDescription>{t("admin.users.card_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{t("admin.users.empty_title")}</h3>
                <p className="text-muted-foreground">{t("admin.users.empty_desc")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.users.table.name")}</TableHead>
                    <TableHead>{t("admin.users.table.email")}</TableHead>
                    <TableHead>{t("admin.users.table.company")}</TableHead>
                    <TableHead>{t("admin.users.table.customer_role")}</TableHead>
                    <TableHead>{t("admin.users.table.spendo_role")}</TableHead>
                    <TableHead>{t("admin.users.table.registered")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userProfile) => (
                    <TableRow
                      key={userProfile.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedUser(userProfile)}
                    >
                      <TableCell className="font-medium">{userProfile.name || t("common.none")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {userProfile.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{userProfile.companyName || t("common.none")}</TableCell>
                      <TableCell>{getRoleBadge(userProfile.role)}</TableCell>
                      <TableCell>{getStaffBadge(userProfile.staff_role)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(userProfile.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{t("admin.users.sheet_title")}</SheetTitle>
            <SheetDescription>{t("admin.users.sheet_desc")}</SheetDescription>
          </SheetHeader>

          {selectedUser && (
            <div className="mt-6">
              <Tabs defaultValue="details">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="details">{t("admin.users.tab.details")}</TabsTrigger>
                  <TabsTrigger value="spendo">{t("admin.users.tab.spendo")}</TabsTrigger>
                  <TabsTrigger value="archive">{t("admin.users.tab.archive")}</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.users.label.name")}</p>
                      <p className="text-base font-medium">{selectedUser.name || t("common.none")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.users.label.email")}</p>
                      <p className="text-base font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.users.label.company")}</p>
                      <p className="text-base font-medium">{selectedUser.companyName || t("common.none")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.users.label.customer_role")}</p>
                      <div className="mt-2">{getRoleBadge(selectedUser.role)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.users.label.spendo_role")}</p>
                      <div className="mt-2">{getStaffBadge(selectedUser.staff_role)}</div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="spendo">
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={updatingId === selectedUser.id}
                      onClick={() => updateStaffRole(selectedUser, "admin")}
                    >
                      {t("admin.users.spendo.set_admin")}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={updatingId === selectedUser.id}
                      onClick={() => updateStaffRole(selectedUser, "support")}
                    >
                      {t("admin.users.spendo.set_support")}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-destructive hover:text-destructive"
                      disabled={updatingId === selectedUser.id}
                      onClick={() => updateStaffRole(selectedUser, null)}
                    >
                      {t("admin.users.spendo.remove")}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="archive">
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full text-destructive hover:text-destructive"
                      disabled={updatingId === selectedUser.id}
                      onClick={() => archiveUser(selectedUser)}
                    >
                      {t("admin.users.archive_action")}
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
