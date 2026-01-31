import { 
  LayoutDashboard, 
  Receipt, 
  Building2, 
  CreditCard,
  Settings,
  ChevronLeft,
  Menu,
  Layers,
  LogOut
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

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Kostnader", url: "/expenses", icon: Receipt },
  { title: "SaaS-tjänster", url: "/saas", icon: Layers },
  { title: "Leverantörer", url: "/vendors", icon: Building2 },
];

const settingsNavItems = [
  { title: "Integration", url: "/integration", icon: CreditCard },
  { title: "Inställningar", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === "/dashboard") return currentPath === "/dashboard";
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar 
      className={cn(
        "border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img src={spendoLogo} alt="Spendo" className="h-8 w-8" />
              <span className="font-semibold text-lg">Spendo</span>
            </div>
          )}
          {collapsed && (
            <img src={spendoLogo} alt="Spendo" className="h-8 w-8 mx-auto" />
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
              Översikt
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                      activeClassName="bg-accent text-accent-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 py-1.5">
              Konfiguration
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                      activeClassName="bg-accent text-accent-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-10 text-muted-foreground hover:text-destructive"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
        {!collapsed && (
          <div className="space-y-2">
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground">
                Teknikbolaget AB
              </p>
              <p className="text-xs text-muted-foreground">
                Trial · 14 dagar kvar
              </p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 text-muted-foreground hover:text-destructive"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              Logga ut
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
