import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { DemoProvider } from "./hooks/use-demo";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { ThemeProvider } from "./contexts/theme-context"; 
import { ThemeToggle } from "./components/theme-toggle";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DemoProvider>
        <AuthProvider>
          <ThemeProvider>
            <div className="relative min-h-screen">
              <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
              </div>
              <Router />
              <Toaster />
            </div>
          </ThemeProvider>
        </AuthProvider>
      </DemoProvider>
    </QueryClientProvider>
  );
}

export default App;