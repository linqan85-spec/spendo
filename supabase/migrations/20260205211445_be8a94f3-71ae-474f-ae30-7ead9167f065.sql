-- Create a settings table for configurable pricing and other site-wide settings
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read site settings (for landing page pricing)
CREATE POLICY "Anyone can view site settings"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Only superadmins can update site settings
CREATE POLICY "Superadmins can update site settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (is_superadmin(auth.uid()));

-- Only superadmins can insert site settings
CREATE POLICY "Superadmins can insert site settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (is_superadmin(auth.uid()));

-- Insert default pricing settings
INSERT INTO public.site_settings (key, value) VALUES
  ('pricing', '{
    "base_price": 499,
    "extra_user_price": 99,
    "trial_days": 14,
    "currency": "kr",
    "features": [
      "Kleer-integration",
      "Obegränsat antal transaktioner",
      "Automatisk kategorisering",
      "SaaS-identifiering",
      "Schemalagda rapporter (max 1/vecka)",
      "PDF & CSV-export",
      "1 användare inkluderad"
    ]
  }'::jsonb);

-- Create trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();