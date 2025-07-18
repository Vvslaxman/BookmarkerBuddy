import { useAuth } from "@/hooks/use-auth";
import { useDemo } from "@/hooks/use-demo";
import { useLocation } from "wouter";
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

  return <Component />;
}