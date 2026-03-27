import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";

// Pages
import Dashboard from "@/pages/dashboard";
import GuardianView from "@/pages/guardian-view";
import MemberDetail from "@/pages/member-detail";
import BaselineReportView from "@/pages/baseline-report";
import AlertsPage from "@/pages/alerts";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/guardian/:id" component={GuardianView} />
      <Route path="/member/:id" component={MemberDetail} />
      <Route path="/report/:id" component={BaselineReportView} />
      <Route path="/alerts" component={AlertsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Setup sidebar CSS properties
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full bg-background overflow-hidden">
              {/* Only show sidebar on non-report, non-guardian pages via CSS trick or let wouter handle it inside if needed, but for simplicity we wrap everything. Report will hide it via print CSS. */}
              <div className="print:hidden">
                <AppSidebar />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <header className="print:hidden flex items-center justify-between p-4 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-30 lg:hidden">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger data-testid="button-sidebar-toggle" className="text-muted-foreground hover:text-foreground" />
                    <span className="font-display font-bold text-lg text-foreground">Vitals Overwatch</span>
                  </div>
                </header>
                <main className="flex-1 overflow-auto bg-background">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
