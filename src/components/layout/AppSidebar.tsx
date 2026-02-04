import {
  LayoutDashboard,
  Receipt,
  Building2,
  CreditCard,
  Settings,
  ChevronLeft,
  Menu,
  Layers,
  Shield,
  Users,
  Archive,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import spendoLogo from "@/assets/spendo-logo.png";
import spendoLogoFull from "@/assets/spendo-logo-full.png";
import { useTranslation } from "react-i18next";

const mainNavItems = [
  { titleKey: "nav.dashboard", url: "/dashboard", icon: LayoutDashboard },
  { titleKey: "nav.expenses", url: "/expenses", icon: Receipt },
  { titleKey: "nav.saas", url: "/saas", icon: Layers },
  { titleKey: "nav.vendors", url: "/vendors", icon: Building2 },
];

const settingsNavItems = [
  { titleKey: "nav.integration", url: "/integration", icon: CreditCard },
  { titleKey: "nav.settings", url: "/settings", icon: Settings },
];

const adminNavItems = [
  { titleKey: "nav.admin_dashboard", url: "/admin", icon: Shield },
  { titleKey: "nav.companies", url: "/admin/companies", icon: Building2 },
  { titleKey: "nav.users", url: "/admin/users", icon: Users },
];

const adminArchiveItems = [
  { titleKey: "nav.archived_companies", url: "/admin/archived-companies", icon: Archive },
  { titleKey: "nav.archived_users", url: "/admin/archived-users", icon: Archive },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { isSuperAdmin } = useAuth();
  const { t } = useTranslation();

  const primaryNavItems = isSuperAdmin ? adminNavItems : mainNavItems;
  const secondaryNavItems = isSuperAdmin ? [] : settingsNavItems;
  const primaryLabel = isSuperAdmin ? t("nav.admin") : t("nav.overview");
  const secondaryLabel = t("nav.configuration");

  const isActive = (path: string) => {
    if (path === "/dashboard") return currentPath === "/dashboard";
    if (path === "/admin") return currentPath === "/admin";
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar
      className={cn("border-r transition-all duration-300", collapsed ? "w-16" : "w-64")}
      collapsible="icon"
    >
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <img src={spendoLogoFull} alt={t("brand.spendo")} className="h-7" />
          )}
          {collapsed && (
            <img src={spendoLogo} alt={t("brand.spendo")} className="h-8 w-8 mx-auto" />
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleSidebar}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 py-1.5">
              {primaryLabel}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNavItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? t(item.titleKey) : undefined}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard" || item.url === "/admin"}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                      activeClassName="bg-accent text-accent-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{t(item.titleKey)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSuperAdmin && (
          <SidebarGroup className="mt-4">
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                {t("nav.archive")}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {adminArchiveItems.map((item) => (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={collapsed ? t(item.titleKey) : undefined}
                    >
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                        activeClassName="bg-accent text-accent-foreground"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{t(item.titleKey)}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {secondaryNavItems.length > 0 && (
          <SidebarGroup className="mt-4">
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                {secondaryLabel}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {secondaryNavItems.map((item) => (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={collapsed ? t(item.titleKey) : undefined}
                    >
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                        activeClassName="bg-accent text-accent-foreground"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{t(item.titleKey)}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        {collapsed && (
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-10"
              onClick={toggleSidebar}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        )}
        {!collapsed && !isSuperAdmin && (
          <div className="space-y-2">
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground">{t("sidebar.company_placeholder")}</p>
              <p className="text-xs text-muted-foreground">{t("sidebar.trial_placeholder")}</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
