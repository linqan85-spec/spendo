-- Create company and roles on signup, or attach invited users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id uuid;
  v_invitation record;
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name')
  ON CONFLICT (id) DO NOTHING;

  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE email = NEW.email
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_invitation.id IS NOT NULL THEN
    UPDATE public.profiles
    SET company_id = v_invitation.company_id
    WHERE id = NEW.id;

    INSERT INTO public.user_roles (user_id, company_id, role)
    VALUES (NEW.id, v_invitation.company_id, v_invitation.role)
    ON CONFLICT (user_id, company_id) DO UPDATE SET role = EXCLUDED.role;

    UPDATE public.invitations
    SET accepted_at = now()
    WHERE id = v_invitation.id;
  ELSE
    INSERT INTO public.companies (name, subscription_status)
    VALUES (
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name', ''), 'Nytt företag'),
      'trialing'
    )
    RETURNING id INTO v_company_id;

    UPDATE public.profiles
    SET company_id = v_company_id
    WHERE id = NEW.id;

    INSERT INTO public.user_roles (user_id, company_id, role)
    VALUES (NEW.id, v_company_id, 'owner')
    ON CONFLICT (user_id, company_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
