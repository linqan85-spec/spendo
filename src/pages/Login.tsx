import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import spendoLogoFull from "@/assets/spendo-logo-full.png";
import { useTranslation } from "react-i18next";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const archivedFlag = searchParams.get("archived");
  useEffect(() => {
    if (!archivedFlag) return;
    toast({
      title: t("login.archived_title"),
      description: t("login.archived_desc"),
      variant: "destructive",
    });
  }, [archivedFlag, toast, t]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: t("login.error_missing_fields"),
        description: t("login.error_missing_fields_desc"),
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
          title: t("login.error_failed"),
          description:
            error.message === "Invalid login credentials"
              ? t("login.error_invalid_credentials")
              : error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        const { data: isSuperadmin } = await supabase.rpc("is_superadmin", {
          _user_id: data.user.id,
        });

        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", data.user.id)
          .maybeSingle();

        toast({
          title: t("login.welcome_title"),
          description: t("login.welcome_desc"),
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
        title: t("login.error_generic"),
        description: t("login.error_try_again"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link to="/" className="flex items-center">
            <img src={spendoLogoFull} alt={t("brand.spendo")} className="h-8" />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
            <CardDescription>{t("login.description")}</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("login.email")}</Label>
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
                  <Label htmlFor="password">{t("login.password")}</Label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    {t("login.forgot_password")}
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("login.loading")}
                  </>
                ) : (
                  t("login.submit")
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                {t("login.no_account")}{" "}
                <Link to="/register" className="text-primary hover:underline">
                  {t("login.register")}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}

