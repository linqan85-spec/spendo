import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Archive } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AdminArchivedCompanies() {
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (!isSuperAdmin) {
      navigate("/dashboard");
      return;
    }

    // Simulate loading
    setIsLoading(false);
  }, [user, isSuperAdmin, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.archived_companies.title")}</h1>
          <p className="text-muted-foreground">{t("admin.archived_companies.subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.archived_companies.card_title")}</CardTitle>
            <CardDescription>{t("admin.archived_companies.card_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">{t("admin.archived_companies.empty_title")}</h3>
              <p className="text-muted-foreground">{t("admin.archived_companies.empty_desc")}</p>
              <p className="text-sm text-muted-foreground mt-4">
                Arkiveringsfunktionen kräver en databasmigrering.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
