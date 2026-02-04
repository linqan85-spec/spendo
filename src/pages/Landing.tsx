import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  FileText,
  Layers,
  Zap,
  Shield,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Building2,
  CreditCard,
  PieChart,
} from "lucide-react";
import spendoLogo from "@/assets/spendo-logo.png";
import spendoLogoFull from "@/assets/spendo-logo-full.png";
import financeHappy from "@/assets/finance-happy.jpg";
import { useTranslation } from "react-i18next";

export default function Landing() {
  const { t } = useTranslation();

  const problemCards = [
    {
      icon: FileText,
      title: t("landing.problem.invoices.title"),
      description: t("landing.problem.invoices.description"),
    },
    {
      icon: CreditCard,
      title: t("landing.problem.saas.title"),
      description: t("landing.problem.saas.description"),
    },
    {
      icon: PieChart,
      title: t("landing.problem.overview.title"),
      description: t("landing.problem.overview.description"),
    },
  ];

  const solutionSteps = [
    {
      icon: Zap,
      title: t("landing.solution.step1.title"),
      description: t("landing.solution.step1.description"),
    },
    {
      icon: Layers,
      title: t("landing.solution.step2.title"),
      description: t("landing.solution.step2.description"),
    },
    {
      icon: BarChart3,
      title: t("landing.solution.step3.title"),
      description: t("landing.solution.step3.description"),
    },
  ];

  const kleerFeatures = [
    t("landing.kleer.features.one"),
    t("landing.kleer.features.two"),
    t("landing.kleer.features.three"),
    t("landing.kleer.features.four"),
  ];

  const featureGrid = [
    {
      icon: PieChart,
      title: t("landing.features.categorization.title"),
      description: t("landing.features.categorization.description"),
    },
    {
      icon: Layers,
      title: t("landing.features.saas.title"),
      description: t("landing.features.saas.description"),
    },
    {
      icon: TrendingUp,
      title: t("landing.features.trends.title"),
      description: t("landing.features.trends.description"),
    },
    {
      icon: Building2,
      title: t("landing.features.vendors.title"),
      description: t("landing.features.vendors.description"),
    },
    {
      icon: FileText,
      title: t("landing.features.reports.title"),
      description: t("landing.features.reports.description"),
    },
    {
      icon: Shield,
      title: t("landing.features.security.title"),
      description: t("landing.features.security.description"),
    },
  ];

  const pricingFeatures = [
    t("landing.pricing.features.one"),
    t("landing.pricing.features.two"),
    t("landing.pricing.features.three"),
    t("landing.pricing.features.four"),
    t("landing.pricing.features.five"),
    t("landing.pricing.features.six"),
    t("landing.pricing.features.seven"),
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src={spendoLogoFull} alt={t("brand.spendo")} className="h-8" />
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">{t("landing.nav.login")}</Button>
            </Link>
            <Link to="/register">
              <Button>{t("landing.nav.get_started")}</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/15 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 py-20 lg:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary border-primary/20">
              {t("landing.hero.badge")}
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              {t("landing.hero.title")}
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("landing.hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  {t("landing.hero.cta_primary")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  {t("landing.hero.cta_secondary")}
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {t("landing.hero.disclaimer")}
            </p>
          </div>
        </div>
      </section>

      <section className="w-full">
        <div className="relative">
          <img
            src={financeHappy}
            alt={t("landing.hero.image_alt")}
            className="w-full h-48 md:h-64 lg:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
        </div>
      </section>

      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{t("landing.problem.title")}</h2>
            <p className="text-lg text-muted-foreground">{t("landing.problem.subtitle")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {problemCards.map((problem, i) => (
              <Card key={i} className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <problem.icon className="h-5 w-5 text-destructive" />
                    {problem.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{problem.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{t("landing.solution.title")}</h2>
            <p className="text-lg text-primary-foreground/80">{t("landing.solution.subtitle")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {solutionSteps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-6">
                  <step.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-primary-foreground/80">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="outline" className="mb-4">
                  {t("landing.kleer.badge")}
                </Badge>
                <h2 className="text-3xl font-bold mb-4">{t("landing.kleer.title")}</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  {t("landing.kleer.description")}
                </p>
                <ul className="space-y-3">
                  {kleerFeatures.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-card rounded-2xl border p-8 shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                  <img src={spendoLogo} alt={t("brand.spendo")} className="h-10 w-auto" />
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                    <Building2 className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{t("landing.kleer.security.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("landing.kleer.security.description")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{t("landing.features.title")}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {featureGrid.map((feature, i) => (
              <Card key={i}>
                <CardHeader>
                  <feature.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{t("landing.pricing.title")}</h2>
            <p className="text-lg text-muted-foreground">{t("landing.pricing.subtitle")}</p>
          </div>
          <div className="max-w-md mx-auto">
            <Card className="border-primary">
              <CardHeader className="text-center pb-2">
                <Badge className="w-fit mx-auto mb-4">{t("landing.pricing.badge")}</Badge>
                <CardTitle className="text-2xl">{t("landing.pricing.plan")}</CardTitle>
                <CardDescription>{t("landing.pricing.plan_subtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-5xl font-bold">{t("landing.pricing.price")}</span>
                  <span className="text-muted-foreground"> {t("landing.pricing.per_month")}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  {t("landing.pricing.extra_user")}
                </p>
                <ul className="text-left space-y-3 mb-8">
                  {pricingFeatures.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="block">
                  <Button size="lg" className="w-full">
                    {t("landing.pricing.cta")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">{t("landing.cta.title")}</h2>
            <p className="text-lg text-primary-foreground/80 mb-8">{t("landing.cta.subtitle")}</p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                {t("landing.cta.button")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <img src={spendoLogoFull} alt={t("brand.spendo")} className="h-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("landing.footer")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
