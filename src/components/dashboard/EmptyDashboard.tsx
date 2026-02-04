import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Plug,
  ArrowRight,
  Layers,
  Receipt,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function EmptyDashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t("dashboard.empty.kpi.total_spend")}
              </span>
            </div>
            <p className="text-2xl font-bold text-muted-foreground/50">
              {t("common.zero_sek")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t("dashboard.empty.kpi.saas_costs")}
              </span>
            </div>
            <p className="text-2xl font-bold text-muted-foreground/50">
              {t("common.zero_sek")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t("dashboard.empty.kpi.expenses")}
              </span>
            </div>
            <p className="text-2xl font-bold text-muted-foreground/50">
              {t("common.zero_sek")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t("dashboard.empty.kpi.invoices")}
              </span>
            </div>
            <p className="text-2xl font-bold text-muted-foreground/50">
              {t("common.zero_sek")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Plug className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {t("dashboard.empty.cta.title")}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {t("dashboard.empty.cta.description")}
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link to="/integration">
              <Plug className="h-4 w-4" />
              {t("dashboard.empty.cta.button")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <Layers className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-medium mb-1">{t("dashboard.empty.info.saas.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.empty.info.saas.description")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <BarChart3 className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-medium mb-1">{t("dashboard.empty.info.category.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.empty.info.category.description")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Receipt className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-medium mb-1">{t("dashboard.empty.info.vendor.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.empty.info.vendor.description")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
