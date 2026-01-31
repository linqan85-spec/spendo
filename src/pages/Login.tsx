import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import spendoLogo from "@/assets/spendo-logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Fyll i alla fält",
        description: "E-post och lösenord krävs",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast({
          title: "Inloggning misslyckades",
          description: error.message === "Invalid login credentials" 
            ? "Fel e-post eller lösenord" 
            : error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        // Check if user is superadmin
        const { data: isSuperadmin } = await supabase.rpc('is_superadmin', { 
          _user_id: data.user.id 
        });

        toast({
          title: "Välkommen tillbaka!",
          description: "Du är nu inloggad",
        });

        if (isSuperadmin) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Något gick fel",
        description: "Försök igen senare",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src={spendoLogo} alt="Spendo" className="h-8 w-8" />
            <span className="font-semibold text-xl">Spendo</span>
          </Link>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Välkommen tillbaka</CardTitle>
            <CardDescription>
              Logga in på ditt Spendo-konto
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="namn@foretag.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Lösenord</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    Glömt lösenord?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loggar in...
                  </>
                ) : (
                  "Logga in"
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Har du inget konto?{" "}
                <Link to="/register" className="text-primary hover:underline">
                  Registrera dig
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
