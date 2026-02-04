-- Allow superadmins to manage all user_roles
CREATE POLICY "Superadmins can manage all user_roles"
ON public.user_roles
FOR ALL
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));
