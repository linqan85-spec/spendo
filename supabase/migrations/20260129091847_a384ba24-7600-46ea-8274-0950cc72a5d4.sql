-- Skapa enum för roller
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'member');

-- Skapa enum för expense-typer
CREATE TYPE public.expense_type AS ENUM ('expense', 'invoice');

-- Skapa enum för kategorier
CREATE TYPE public.expense_category AS ENUM (
  'saas',
  'resor',
  'kontor',
  'marknadsforing',
  'it_verktyg',
  'ovrigt'
);

-- Skapa enum för integration-status
CREATE TYPE public.integration_status AS ENUM ('active', 'inactive', 'error');

-- Skapa enum för subscription-status
CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid');

-- Companies tabell
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  org_number TEXT,
  currency TEXT NOT NULL DEFAULT 'SEK',
  -- Subscription info
  subscription_status subscription_status NOT NULL DEFAULT 'trialing',
  base_price_per_month INTEGER NOT NULL DEFAULT 499,
  extra_user_price INTEGER NOT NULL DEFAULT 99,
  max_users_included INTEGER NOT NULL DEFAULT 1,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles tabell (kopplas till auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles tabell (separerad enligt säkerhetskrav)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);

-- Integrations tabell
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'kleer',
  access_token TEXT,
  refresh_token TEXT,
  status integration_status NOT NULL DEFAULT 'inactive',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vendors tabell
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  normalized_name TEXT,
  is_saas BOOLEAN NOT NULL DEFAULT false,
  default_category expense_category,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expenses tabell (både utlägg och fakturor)
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  external_id TEXT,
  type expense_type NOT NULL DEFAULT 'expense',
  amount DECIMAL(12, 2) NOT NULL,
  vat_amount DECIMAL(12, 2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SEK',
  transaction_date DATE NOT NULL,
  description TEXT,
  category expense_category NOT NULL DEFAULT 'ovrigt',
  subcategory TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Monthly summary (pre-aggregerad för snabb dashboard)
CREATE TABLE public.monthly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_spend DECIMAL(12, 2) NOT NULL DEFAULT 0,
  saas_spend DECIMAL(12, 2) NOT NULL DEFAULT 0,
  expense_spend DECIMAL(12, 2) NOT NULL DEFAULT 0,
  invoice_spend DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, year, month)
);

-- Category summary per månad
CREATE TABLE public.category_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  category expense_category NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, year, month, category)
);

-- SaaS summary per månad
CREATE TABLE public.saas_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, vendor_id, year, month)
);

-- Invitations tabell för att bjuda in användare
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, email)
);

-- Enable RLS på alla tabeller
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Skapa security definer function för att kolla roller
CREATE OR REPLACE FUNCTION public.has_company_role(_user_id UUID, _company_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role = ANY(_roles)
  )
$$;

-- Funktion för att hämta användarens company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id
$$;

-- RLS Policies för companies
CREATE POLICY "Users can view their own company"
  ON public.companies FOR SELECT
  USING (
    id = public.get_user_company_id(auth.uid())
  );

CREATE POLICY "Owners and admins can update company"
  ON public.companies FOR UPDATE
  USING (
    public.has_company_role(auth.uid(), id, ARRAY['owner', 'admin']::app_role[])
  );

-- RLS Policies för profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can view profiles in same company"
  ON public.profiles FOR SELECT
  USING (
    company_id = public.get_user_company_id(auth.uid())
  );

-- RLS Policies för user_roles
CREATE POLICY "Users can view roles in their company"
  ON public.user_roles FOR SELECT
  USING (
    company_id = public.get_user_company_id(auth.uid())
  );

CREATE POLICY "Owners and admins can manage roles"
  ON public.user_roles FOR ALL
  USING (
    public.has_company_role(auth.uid(), company_id, ARRAY['owner', 'admin']::app_role[])
  );

-- RLS Policies för integrations
CREATE POLICY "Users can view integrations in their company"
  ON public.integrations FOR SELECT
  USING (
    company_id = public.get_user_company_id(auth.uid())
  );

CREATE POLICY "Admins can manage integrations"
  ON public.integrations FOR ALL
  USING (
    public.has_company_role(auth.uid(), company_id, ARRAY['owner', 'admin']::app_role[])
  );

-- RLS Policies för vendors
CREATE POLICY "Users can view vendors in their company"
  ON public.vendors FOR SELECT
  USING (
    company_id = public.get_user_company_id(auth.uid())
  );

CREATE POLICY "Users can manage vendors in their company"
  ON public.vendors FOR ALL
  USING (
    company_id = public.get_user_company_id(auth.uid())
  );

-- RLS Policies för expenses
CREATE POLICY "Users can view expenses in their company"
  ON public.expenses FOR SELECT
  USING (
    company_id = public.get_user_company_id(auth.uid())
  );

CREATE POLICY "Users can manage expenses in their company"
  ON public.expenses FOR ALL
  USING (
    company_id = public.get_user_company_id(auth.uid())
  );

-- RLS Policies för monthly_summaries
CREATE POLICY "Users can view summaries in their company"
  ON public.monthly_summaries FOR SELECT
  USING (
    company_id = public.get_user_company_id(auth.uid())
  );

-- RLS Policies för category_summaries
CREATE POLICY "Users can view category summaries in their company"
  ON public.category_summaries FOR SELECT
  USING (
    company_id = public.get_user_company_id(auth.uid())
  );

-- RLS Policies för saas_summaries
CREATE POLICY "Users can view saas summaries in their company"
  ON public.saas_summaries FOR SELECT
  USING (
    company_id = public.get_user_company_id(auth.uid())
  );

-- RLS Policies för invitations
CREATE POLICY "Users can view invitations to their company"
  ON public.invitations FOR SELECT
  USING (
    company_id = public.get_user_company_id(auth.uid())
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (
    public.has_company_role(auth.uid(), company_id, ARRAY['owner', 'admin']::app_role[])
  );

-- Trigger för updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_summaries_updated_at
  BEFORE UPDATE ON public.monthly_summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger för att skapa profil vid ny användare
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index för snabbare queries
CREATE INDEX idx_expenses_company_date ON public.expenses(company_id, transaction_date);
CREATE INDEX idx_expenses_company_category ON public.expenses(company_id, category);
CREATE INDEX idx_expenses_vendor ON public.expenses(vendor_id);
CREATE INDEX idx_vendors_company ON public.vendors(company_id);
CREATE INDEX idx_monthly_summaries_company_period ON public.monthly_summaries(company_id, year, month);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_company ON public.user_roles(company_id);