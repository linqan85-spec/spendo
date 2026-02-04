-- Add staff_role enum and staff_role column to profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role') THEN
    CREATE TYPE public.staff_role AS ENUM ('admin', 'support');
  END IF;
END $$;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS staff_role public.staff_role;

-- Update superadmin check to use staff_role on profiles
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND staff_role = 'admin'
  )
$$;

-- Allow superadmins to update all profiles (needed to manage staff roles)
CREATE POLICY "Superadmins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));
