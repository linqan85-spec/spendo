-- Create a real company for the user
INSERT INTO public.companies (id, name, org_number, subscription_status)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Spendo Demo AB', '556677-8899', 'active');

-- Link the user profile to this company
UPDATE public.profiles
SET company_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE email = 'alexbrask@outlook.com';

-- Give the user the owner role in this company
INSERT INTO public.user_roles (user_id, company_id, role)
VALUES (
  'b6a8470f-c560-416f-8d47-3883b6f1bd7f',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'owner'
);