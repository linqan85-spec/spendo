import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2 } from "lucide-react";
import spendoLogoFull from "@/assets/spendo-logo-full.png";
import { useTranslation } from "react-i18next";

export default function Register() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !companyName || !password) {
      toast({
        title: t("register.toast.missing_fields.title"),
        description: t("register.toast.missing_fields.description"),
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: t("register.toast.password_mismatch.title"),
        description: t("register.toast.password_mismatch.description"),
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t("register.toast.password_short.title"),
        description: t("register.toast.password_short.description"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name: name.trim(),
            company_name: companyName.trim(),
          },
        },
      });

      if (error) {
        toast({
          title: t("register.toast.failed.title"),
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: t("register.toast.success.title"),
          description: t("register.toast.success.description"),
        });
        navigate("/login");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: t("register.toast.error.title"),
        description: t("register.toast.error.description"),
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

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t("register.title")}</CardTitle>
              <CardDescription>{t("register.subtitle")}</CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("register.field.name")}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t("register.placeholder.name")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">{t("register.field.company")}</Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder={t("register.placeholder.company")}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("register.field.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("register.placeholder.email")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("register.field.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("register.placeholder.password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("register.field.confirm_password")}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t("register.placeholder.confirm_password")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-3">{t("register.trial_includes")}</p>
                  <ul className="space-y-2">
                    {[
                      t("register.trial_features.one"),
                      t("register.trial_features.two"),
                      t("register.trial_features.three"),
                      t("register.trial_features.four"),
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
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
                      {t("register.loading")}
                    </>
                  ) : (
                    t("register.submit")
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t("register.terms.prefix")}
                  <a href="#" className="text-primary hover:underline">{t("register.terms.terms")}</a>
                  {t("register.terms.and")}
                  <a href="#" className="text-primary hover:underline">{t("register.terms.privacy")}</a>
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  {t("register.login_prompt")}{" "}
                  <Link to="/login" className="text-primary hover:underline">
                    {t("register.login_link")}
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
