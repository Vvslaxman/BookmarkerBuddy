
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({ username: "", password: "" });

  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to BookmarkerBuddy</CardTitle>
            <CardDescription>
              Sign in to manage your bookmarks or create a new account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  loginMutation.mutate(formData);
                }}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        required
                        className="transition-colors backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        className=" transition-colors backdrop-blur-sm"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  registerMutation.mutate(formData);
                }}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reg-username">Username</Label>
                      <Input
                        id="reg-username"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        required
                        className=" transition-colors backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        className=" transition-colors backdrop-blur-sm"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:flex flex-col justify-center bg-muted p-8">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Save and Organize Your Bookmarks</h2>
          <p className="text-muted-foreground mb-6">
            Bookmarker helps you save and organize your favorite websites with AI-powered tag suggestions.
            Access your bookmarks from anywhere and never lose track of important resources.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-background rounded-lg">
            <h3 className="font-semibold mb-2 text-foreground">Easy Search</h3>
            <p className="text-sm text-muted-foreground">Find your bookmarks quickly with powerful search</p>
              
            </div>
            <div className="p-4 bg-background rounded-lg">
              <h3 className="font-semibold mb-2 text-foreground">Smart Tags</h3>
              <p className="text-sm text-muted-foreground">AI-powered tag suggestions for better organization</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
