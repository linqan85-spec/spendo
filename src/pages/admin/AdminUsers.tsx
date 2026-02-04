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
import { Mail, Users, Archive } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  company_id: string | null;
  staff_role: "admin" | "support" | null;
  archived_at: string | null;
}

export default function AdminUsers() {
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<(UserProfile & { companyName?: string; role?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<(UserProfile & { companyName?: string; role?: string }) | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const { t } = useTranslation();

  // Filter users based on archived state.
  // When showArchived is enabled, include both active and archived users.
  const filteredUsers = users.filter((user) =>
    showArchived ? true : user.archived_at === null
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

    fetchUsers();
  }, [user, isSuperAdmin, authLoading, navigate]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, name, created_at, company_id, archived_at, staff_role")
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
        staff_role: profile.staff_role as UserProfile["staff_role"],
        archived_at: profile.archived_at,
        companyName: profile.company_id ? companyMap[profile.company_id] : undefined,
        role: roleMap[profile.id],
      }));

      setUsers(enrichedUsers);
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

    const confirmed = window.confirm(`Sätt ${targetUser.email} till ${label}?`);
    if (!confirmed) return;

    try {
      setUpdatingId(targetUser.id);
      // Note: staff_role column doesn't exist in profiles table currently
      // This would need a database migration to work
      console.log("Would update staff_role to:", staffRole, "for user:", targetUser.id);
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
      // Note: archived_at column doesn't exist in profiles table currently
      // This would need a database migration to work
      console.log("Would archive user:", targetUser.id);

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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>{t("admin.users.card_title")}</CardTitle>
              <CardDescription>{t("admin.users.card_desc")}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-archived-users"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <Label htmlFor="show-archived-users" className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Archive className="h-3.5 w-3.5" />
                {t("admin.users.show_archived")}
              </Label>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
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
                    <TableHead>{t("admin.users.table.registered")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((userProfile) => (
                    <TableRow
                      key={userProfile.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedUser(userProfile)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {userProfile.name || t("common.none")}
                          {userProfile.archived_at && (
                            <Badge variant="outline" className="text-muted-foreground">
                              <Archive className="h-3 w-3 mr-1" />
                              {t("common.archived")}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {userProfile.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{userProfile.companyName || t("common.none")}</TableCell>
                      <TableCell>{getRoleBadge(userProfile.role)}</TableCell>
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
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <span>{selectedUser?.name || selectedUser?.email}</span>
            </SheetTitle>
            <SheetDescription>{selectedUser?.email}</SheetDescription>
          </SheetHeader>

          {selectedUser && (
            <div className="mt-6 space-y-6">
              {/* User Details Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("admin.users.label.company")}
                    </p>
                    <p className="text-sm font-medium">{selectedUser.companyName || t("common.none")}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("admin.users.label.customer_role")}
                    </p>
                    {getRoleBadge(selectedUser.role)}
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("admin.users.label.spendo_role")}
                    </p>
                    {getStaffBadge(selectedUser.staff_role)}
                  </div>
                </div>
              </div>

              <div className="border-t" />

              {/* Spendo Team Role Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">{t("admin.users.tab.spendo")}</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedUser.staff_role === "admin" ? "default" : "outline"}
                    size="sm"
                    disabled={updatingId === selectedUser.id}
                    onClick={() => updateStaffRole(selectedUser, "admin")}
                  >
                    {t("admin.users.spendo.admin")}
                  </Button>
                  <Button
                    variant={selectedUser.staff_role === "support" ? "default" : "outline"}
                    size="sm"
                    disabled={updatingId === selectedUser.id}
                    onClick={() => updateStaffRole(selectedUser, "support")}
                  >
                    {t("admin.users.spendo.support")}
                  </Button>
                </div>
                {selectedUser.staff_role && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    disabled={updatingId === selectedUser.id}
                    onClick={() => updateStaffRole(selectedUser, null)}
                  >
                    {t("admin.users.spendo.remove")}
                  </Button>
                )}
              </div>

              <div className="border-t" />

              {/* Danger Zone */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-destructive">{t("admin.users.tab.archive")}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  disabled={updatingId === selectedUser.id}
                  onClick={() => archiveUser(selectedUser)}
                >
                  {t("admin.users.archive_action")}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
