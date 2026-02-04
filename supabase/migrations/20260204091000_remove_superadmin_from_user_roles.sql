-- Remove legacy superadmin roles from customer user_roles
UPDATE public.user_roles
SET role = 'member'
WHERE role::text = 'superadmin';

-- Prevent using superadmin in customer roles going forward
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_no_superadmin
CHECK (role::text <> 'superadmin');
