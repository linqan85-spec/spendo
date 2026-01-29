-- Skapa funktion för att kolla om användare är superadmin
-- Använder text-jämförelse istället för enum för att undvika transaktionsproblem
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = 'superadmin'
  )
$$;

-- RLS policy för superadmins att se alla companies
CREATE POLICY "Superadmins can view all companies"
ON public.companies
FOR SELECT
USING (public.is_superadmin(auth.uid()));

-- RLS policy för superadmins att uppdatera alla companies
CREATE POLICY "Superadmins can update all companies"
ON public.companies
FOR UPDATE
USING (public.is_superadmin(auth.uid()));

-- RLS policy för superadmins att se alla profiles
CREATE POLICY "Superadmins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_superadmin(auth.uid()));

-- RLS policy för superadmins att se alla expenses
CREATE POLICY "Superadmins can view all expenses"
ON public.expenses
FOR SELECT
USING (public.is_superadmin(auth.uid()));

-- RLS policy för superadmins att se alla user_roles
CREATE POLICY "Superadmins can view all user_roles"
ON public.user_roles
FOR SELECT
USING (public.is_superadmin(auth.uid()));