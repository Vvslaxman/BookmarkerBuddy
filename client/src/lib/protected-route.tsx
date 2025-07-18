import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { useDemo } from "@/hooks/use-demo";
import { useEffect } from "react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const { isDemoMode } = useDemo();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user && !isDemoMode && location === path) {
      setLocation("/auth");
    }
  }, [user, isLoading, isDemoMode, location, path, setLocation]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user && !isDemoMode) {
    return null;
  }
  return <Component />
}
