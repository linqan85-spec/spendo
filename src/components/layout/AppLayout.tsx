import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isSuperAdmin, isLoading, signOut } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const { t } = useTranslation();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4 gap-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {isSuperAdmin && isAdminRoute && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/dashboard">{t("layout.view_user_dashboard")}</Link>
                </Button>
              )}
              {isSuperAdmin && !isAdminRoute && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin">{t("layout.back_to_admin")}</Link>
                </Button>
              )}
              {!isLoading && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={signOut}
                  aria-label={t("layout.logout")}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </header>
          <div className="flex-1 p-6 overflow-auto">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
