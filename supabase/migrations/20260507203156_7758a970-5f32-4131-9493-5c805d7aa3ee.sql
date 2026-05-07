
-- 1. team_members: personer som spenderar (kan ha eller sakna inloggning)
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  user_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members in their company"
  ON public.team_members FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage members"
  ON public.team_members FOR ALL
  USING (has_company_role(auth.uid(), company_id, ARRAY['owner'::app_role,'admin'::app_role]))
  WITH CHECK (has_company_role(auth.uid(), company_id, ARRAY['owner'::app_role,'admin'::app_role]));

CREATE TRIGGER trg_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. payment_cards: kort kopplade till en person, med sökord för auto-matchning
CREATE TABLE public.payment_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  label text NOT NULL,
  last4 text,
  match_keywords text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cards in their company"
  ON public.payment_cards FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage cards"
  ON public.payment_cards FOR ALL
  USING (has_company_role(auth.uid(), company_id, ARRAY['owner'::app_role,'admin'::app_role]))
  WITH CHECK (has_company_role(auth.uid(), company_id, ARRAY['owner'::app_role,'admin'::app_role]));

CREATE TRIGGER trg_payment_cards_updated_at
  BEFORE UPDATE ON public.payment_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. expenses: tilldelning till person + spårning av hur tilldelningen skett
CREATE TYPE public.assignment_source AS ENUM ('manual','card_match','guess','unassigned');

ALTER TABLE public.expenses
  ADD COLUMN assigned_member_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  ADD COLUMN assignment_source public.assignment_source NOT NULL DEFAULT 'unassigned',
  ADD COLUMN assignment_confidence smallint NOT NULL DEFAULT 0;

CREATE INDEX idx_expenses_assigned_member ON public.expenses(assigned_member_id);
CREATE INDEX idx_team_members_company ON public.team_members(company_id);
CREATE INDEX idx_payment_cards_company ON public.payment_cards(company_id);
