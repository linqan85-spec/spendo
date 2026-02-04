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
import { Archive, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ArchivedUser {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  company_id: string | null;
  staff_role: "admin" | "support" | null;
  archived_at: string | null;
  archived_by: string | null;
}

export default function AdminArchivedUsers() {
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<(ArchivedUser & { companyName?: string; role?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<(ArchivedUser & { companyName?: string; role?: string }) | null>(null);
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

    fetchUsers();
  }, [user, isSuperAdmin, authLoading, navigate]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, name, created_at, company_id, staff_role, archived_at, archived_by")
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false });

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

      setUsers(enrichedUsers as (ArchivedUser & { companyName?: string; role?: string })[]);
    } catch (error) {
      console.error("Error fetching archived users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const restoreUser = async (targetUser: ArchivedUser) => {
    const confirmed = window.confirm(t("admin.archived_users.action.restore"));
    if (!confirmed) return;

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from("profiles")
        .update({ archived_at: null, archived_by: null })
        .eq("id", targetUser.id);

      if (error) throw error;

      setUsers((prev) => prev.filter((item) => item.id !== targetUser.id));
      setSelectedUser(null);
    } catch (error) {
      console.error("Error restoring user:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteUser = async (targetUser: ArchivedUser) => {
    const confirmed = window.confirm(t("admin.archived_users.action.delete"));
    if (!confirmed) return;

    try {
      setIsUpdating(true);
      const { error } = await supabase.from("profiles").delete().eq("id", targetUser.id);

      if (error) throw error;

      setUsers((prev) => prev.filter((item) => item.id !== targetUser.id));
      setSelectedUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
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

  const getStaffBadge = (role: ArchivedUser["staff_role"]) => {
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
          <h1 className="text-2xl font-bold">{t("admin.archived_users.title")}</h1>
          <p className="text-muted-foreground">{t("admin.archived_users.subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.archived_users.card_title")}</CardTitle>
            <CardDescription>{t("admin.archived_users.card_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{t("admin.archived_users.empty_title")}</h3>
                <p className="text-muted-foreground">{t("admin.archived_users.empty_desc")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.archived_users.table.name")}</TableHead>
                    <TableHead>{t("admin.archived_users.table.email")}</TableHead>
                    <TableHead>{t("admin.archived_users.table.company")}</TableHead>
                    <TableHead>{t("admin.archived_users.table.customer_role")}</TableHead>
                    <TableHead>{t("admin.archived_users.table.spendo_role")}</TableHead>
                    <TableHead>{t("admin.archived_users.table.archived")}</TableHead>
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
                      <TableCell className="text-muted-foreground">
                        {userProfile.archived_at ? formatDate(userProfile.archived_at) : t("common.none")}
                      </TableCell>
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
            <SheetTitle>{t("admin.archived_users.sheet_title")}</SheetTitle>
            <SheetDescription>{t("admin.archived_users.sheet_desc")}</SheetDescription>
          </SheetHeader>

          {selectedUser && (
            <div className="mt-6">
              <Tabs defaultValue="details">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="details">{t("admin.archived_users.tab.details")}</TabsTrigger>
                  <TabsTrigger value="actions">{t("admin.archived_users.tab.actions")}</TabsTrigger>
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
                      <p className="text-sm text-muted-foreground">{t("common.archived")}</p>
                      <p className="text-base font-medium">
                        {selectedUser.archived_at ? formatDate(selectedUser.archived_at) : t("common.none")}
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
                      onClick={() => restoreUser(selectedUser)}
                    >
                      {t("admin.archived_users.action.restore")}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-destructive hover:text-destructive"
                      disabled={isUpdating}
                      onClick={() => deleteUser(selectedUser)}
                    >
                      {t("admin.archived_users.action.delete")}
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
