-- Step 1: Drop existing SELECT policy for general users
DROP POLICY IF EXISTS "Users can view integrations in their company" ON public.integrations;

-- Step 2: Create a new policy that only allows owners/admins to SELECT from the base table
-- This protects the access_token and refresh_token from regular members
CREATE POLICY "Only owners and admins can view integrations"
ON public.integrations
FOR SELECT
TO authenticated
USING (
  has_company_role(auth.uid(), company_id, ARRAY['owner'::app_role, 'admin'::app_role])
);

-- Step 3: Create a public view that hides sensitive fields for general status checks
-- This view can be used to show integration status without exposing tokens
CREATE OR REPLACE VIEW public.integrations_public
WITH (security_invoker = on) AS
SELECT 
  id,
  company_id,
  provider,
  status,
  last_synced_at,
  created_at,
  updated_at
  -- access_token and refresh_token are intentionally excluded
FROM public.integrations;

-- Step 4: Grant access to the view
GRANT SELECT ON public.integrations_public TO authenticated;

-- Add comment explaining the security design
COMMENT ON VIEW public.integrations_public IS 'Public view of integrations without sensitive token fields. Use this for displaying integration status to all company users.';
COMMENT ON TABLE public.integrations IS 'Integration credentials table. access_token and refresh_token are only accessible by company owners and admins via RLS.';