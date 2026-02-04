-- Add archive metadata to companies and profiles
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id);

-- Allow owners/admins to update profiles in their company (e.g. archive)
CREATE POLICY "Owners and admins can update profiles in their company"
ON public.profiles
FOR UPDATE
USING (
  public.has_company_role(auth.uid(), company_id, ARRAY['owner', 'admin']::app_role[])
)
WITH CHECK (
  public.has_company_role(auth.uid(), company_id, ARRAY['owner', 'admin']::app_role[])
);

-- Allow superadmins to delete archived records only
CREATE POLICY "Superadmins can delete archived companies"
ON public.companies
FOR DELETE
USING (public.is_superadmin(auth.uid()) AND archived_at IS NOT NULL);

CREATE POLICY "Superadmins can delete archived profiles"
ON public.profiles
FOR DELETE
USING (public.is_superadmin(auth.uid()) AND archived_at IS NOT NULL);
