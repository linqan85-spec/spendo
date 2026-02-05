import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Plus, Trash2, Save, Loader2, Plug } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePricingSettings, useUpdatePricingSettings, PricingSettings, IntegrationPricing } from "@/hooks/useSiteSettings";
import { toast } from "sonner";

export default function AdminPricing() {
  const { t } = useTranslation();
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: pricing, isLoading } = usePricingSettings();
  const updatePricing = useUpdatePricingSettings();

  const [formData, setFormData] = useState<PricingSettings>({
    base_price: 499,
    extra_user_price: 99,
    trial_days: 14,
    currency: "kr",
    features: [],
    integrations: [],
  });
  const [newFeature, setNewFeature] = useState("");
  const [newIntegration, setNewIntegration] = useState({ name: "", price: 0 });

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
  }, [user, isSuperAdmin, authLoading, navigate]);

  useEffect(() => {
    if (pricing) {
      setFormData(pricing);
    }
  }, [pricing]);

  const handleSave = async () => {
    try {
      await updatePricing.mutateAsync(formData);
      toast.success(t("admin.pricing.saved"));
    } catch (error) {
      console.error("Error saving pricing:", error);
      toast.error(t("admin.pricing.save_error"));
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.map((f, i) => (i === index ? value : f)),
    }));
  };

  const updateIntegration = (id: string, updates: Partial<IntegrationPricing>) => {
    setFormData((prev) => ({
      ...prev,
      integrations: prev.integrations.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    }));
  };

  const addIntegration = () => {
    if (newIntegration.name.trim()) {
      const id = newIntegration.name.toLowerCase().replace(/\s+/g, "-");
      setFormData((prev) => ({
        ...prev,
        integrations: [
          ...prev.integrations,
          { id, name: newIntegration.name.trim(), price: newIntegration.price, included_in_base: false },
        ],
      }));
      setNewIntegration({ name: "", price: 0 });
    }
  };

  const removeIntegration = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      integrations: prev.integrations.filter((i) => i.id !== id),
    }));
  };

  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </AppLayout>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t("admin.pricing.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("admin.pricing.subtitle")}</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={updatePricing.isPending}>
            {updatePricing.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t("common.save_changes")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.pricing.prices")}</CardTitle>
            <CardDescription>{t("admin.pricing.prices_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="base_price">{t("admin.pricing.base_price")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="base_price"
                    type="number"
                    min={0}
                    value={formData.base_price}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, base_price: Number(e.target.value) }))
                    }
                  />
                  <span className="text-muted-foreground">{formData.currency}/mån</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="extra_user_price">{t("admin.pricing.extra_user_price")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="extra_user_price"
                    type="number"
                    min={0}
                    value={formData.extra_user_price}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, extra_user_price: Number(e.target.value) }))
                    }
                  />
                  <span className="text-muted-foreground">{formData.currency}/mån</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trial_days">{t("admin.pricing.trial_days")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="trial_days"
                    type="number"
                    min={0}
                    value={formData.trial_days}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, trial_days: Number(e.target.value) }))
                    }
                  />
                  <span className="text-muted-foreground">{t("admin.pricing.days")}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">{t("admin.pricing.currency")}</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, currency: e.target.value }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.pricing.features")}</CardTitle>
            <CardDescription>{t("admin.pricing.features_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0">
                    {index + 1}
                  </Badge>
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFeature(index)}
                    className="shrink-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <Input
                placeholder={t("admin.pricing.new_feature_placeholder")}
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFeature()}
                className="flex-1"
              />
              <Button variant="outline" onClick={addFeature} disabled={!newFeature.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                {t("admin.pricing.add_feature")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plug className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>{t("admin.pricing.integrations")}</CardTitle>
                <CardDescription>{t("admin.pricing.integrations_desc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {formData.integrations.map((integration) => (
                <div key={integration.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <Input
                      value={integration.name}
                      onChange={(e) => updateIntegration(integration.id, { name: e.target.value })}
                      className="font-medium"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Input
                      type="number"
                      min={0}
                      value={integration.price}
                      onChange={(e) => updateIntegration(integration.id, { price: Number(e.target.value) })}
                      className="w-20"
                      disabled={integration.included_in_base}
                    />
                    <span className="text-sm text-muted-foreground w-12">{formData.currency}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={integration.included_in_base}
                      onCheckedChange={(checked) =>
                        updateIntegration(integration.id, { included_in_base: checked, price: checked ? 0 : integration.price })
                      }
                    />
                    <span className="text-xs text-muted-foreground w-16">
                      {integration.included_in_base ? t("admin.pricing.included") : t("admin.pricing.addon")}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIntegration(integration.id)}
                    className="shrink-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <Input
                placeholder={t("admin.pricing.new_integration_name")}
                value={newIntegration.name}
                onChange={(e) => setNewIntegration((prev) => ({ ...prev, name: e.target.value }))}
                className="flex-1"
              />
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={newIntegration.price || ""}
                onChange={(e) => setNewIntegration((prev) => ({ ...prev, price: Number(e.target.value) }))}
                className="w-24"
              />
              <Button variant="outline" onClick={addIntegration} disabled={!newIntegration.name.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                {t("admin.pricing.add_integration")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">{t("admin.pricing.preview")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">{t("admin.pricing.from")}</p>
              <div className="mb-4">
                <span className="text-4xl font-bold">{formData.base_price}</span>
                <span className="text-muted-foreground"> {formData.currency}/mån</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                +{formData.extra_user_price} {formData.currency}/extra användare
              </p>
              <ul className="text-left space-y-2 max-w-xs mx-auto mb-4">
                {formData.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-primary">✓</span>
                    {feature}
                  </li>
                ))}
                {formData.integrations
                  .filter((i) => i.included_in_base)
                  .map((integration) => (
                    <li key={integration.id} className="flex items-center gap-2 text-sm">
                      <span className="text-primary">✓</span>
                      {integration.name}-integration
                    </li>
                  ))}
              </ul>
              {formData.integrations.filter((i) => !i.included_in_base).length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-xs text-muted-foreground mb-2">{t("admin.pricing.addons")}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {formData.integrations
                      .filter((i) => !i.included_in_base)
                      .map((integration) => (
                        <Badge key={integration.id} variant="secondary">
                          {integration.name}: +{integration.price} {formData.currency}/mån
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
