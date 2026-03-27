import { Link, useLocation } from "wouter";
import { 
  Activity, AlertTriangle, LayoutDashboard, 
  Clock, Link2, User, LogOut 
} from "lucide-react";
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
  SidebarFooter
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@workspace/replit-auth-web";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const mainNav = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Alerts", url: "/alerts", icon: AlertTriangle },
  ];

  const intelligenceNav = [
    { title: "Time-Travel Forecast", url: "/forecast/1", icon: Clock },
    { title: "Providers", url: "/providers", icon: Link2 },
  ];

  const accountNav = [
    { title: "Profile", url: "/profile", icon: User },
  ];

  const NavGroup = ({ label, items }: { label: string, items: typeof mainNav }) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-xs tracking-wider">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = location === item.url || (location.startsWith(item.url) && item.url !== "/");
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link 
                    href={item.url} 
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary font-medium shadow-sm shadow-primary/5" 
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar variant="inset" className="border-r border-white/5 bg-background">
      <SidebarHeader className="p-4 flex flex-row items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
          <Activity className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-lg leading-tight text-foreground tracking-tight">Vitals Overwatch</span>
          <span className="text-[10px] text-primary/80 font-medium uppercase tracking-wider">Guardian System</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Main" items={mainNav} />
        <NavGroup label="Intelligence" items={intelligenceNav} />
        <NavGroup label="Account" items={accountNav} />
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-white/5">
        {user && (
          <div className="flex items-center gap-3 w-full">
            <Avatar className="h-9 w-9 border border-white/10">
              <AvatarImage src={user.profileImage} />
              <AvatarFallback className="bg-secondary text-foreground">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-sm font-medium text-foreground truncate">{user.name || "User"}</span>
              <span className="text-xs text-muted-foreground truncate">{user.name ? `@${user.name.toLowerCase().replace(/\s/g, '')}` : "Free Plan"}</span>
            </div>
            <button onClick={() => logout()} className="p-2 hover:bg-white/5 rounded-md text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
