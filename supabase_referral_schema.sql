BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_plan') THEN
    CREATE TYPE public.referral_plan AS ENUM ('weekly', 'quarterly', 'annual');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_conversion_status') THEN
    CREATE TYPE public.referral_conversion_status AS ENUM ('paid', 'trial', 'refunded', 'canceled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_payout_status') THEN
    CREATE TYPE public.referral_payout_status AS ENUM ('pending', 'processing', 'paid', 'failed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ambassadors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL UNIQUE,
  payout_email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ambassadors_referral_code_upper_chk CHECK (referral_code = upper(referral_code))
);

CREATE TABLE IF NOT EXISTS public.referral_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code text NOT NULL REFERENCES public.ambassadors(referral_code) ON UPDATE CASCADE,
  referrer_ambassador_id uuid REFERENCES public.ambassadors(id) ON DELETE SET NULL,
  referred_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'app',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referral_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_activation_id uuid REFERENCES public.referral_activations(id) ON DELETE SET NULL,
  referral_code text NOT NULL REFERENCES public.ambassadors(referral_code) ON UPDATE CASCADE,
  purchaser_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revenuecat_event_id text NOT NULL UNIQUE,
  revenuecat_app_user_id text,
  product_id text NOT NULL,
  plan public.referral_plan NOT NULL,
  gross_amount_cents integer NOT NULL CHECK (gross_amount_cents >= 0),
  currency text NOT NULL DEFAULT 'EUR',
  status public.referral_conversion_status NOT NULL DEFAULT 'paid',
  purchased_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referral_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid NOT NULL REFERENCES public.ambassadors(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_conversions integer NOT NULL DEFAULT 0 CHECK (total_conversions >= 0),
  total_amount_cents integer NOT NULL DEFAULT 0 CHECK (total_amount_cents >= 0),
  commission_cents integer NOT NULL DEFAULT 0 CHECK (commission_cents >= 0),
  status public.referral_payout_status NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referral_payouts_period_chk CHECK (period_end >= period_start),
  CONSTRAINT referral_payouts_unique_period UNIQUE (ambassador_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_ambassadors_referral_code ON public.ambassadors(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_activations_referral_code_created_at ON public.referral_activations(referral_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referral_code_purchased_at ON public.referral_conversions(referral_code, purchased_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_status_plan ON public.referral_conversions(status, plan);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_ambassador_status ON public.referral_payouts(ambassador_id, status);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ambassadors_updated_at ON public.ambassadors;
CREATE TRIGGER trg_ambassadors_updated_at
BEFORE UPDATE ON public.ambassadors
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_referral_payouts_updated_at ON public.referral_payouts;
CREATE TRIGGER trg_referral_payouts_updated_at
BEFORE UPDATE ON public.referral_payouts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.fill_referrer_from_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT a.id
  INTO NEW.referrer_ambassador_id
  FROM public.ambassadors a
  WHERE a.referral_code = NEW.referral_code
  LIMIT 1;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_referrer_from_code ON public.referral_activations;
CREATE TRIGGER trg_fill_referrer_from_code
BEFORE INSERT ON public.referral_activations
FOR EACH ROW
EXECUTE FUNCTION public.fill_referrer_from_code();

ALTER TABLE public.ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ambassadors_select_own ON public.ambassadors;
CREATE POLICY ambassadors_select_own
ON public.ambassadors
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS ambassadors_insert_own ON public.ambassadors;
CREATE POLICY ambassadors_insert_own
ON public.ambassadors
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS ambassadors_update_own ON public.ambassadors;
CREATE POLICY ambassadors_update_own
ON public.ambassadors
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS activations_insert_own ON public.referral_activations;
CREATE POLICY activations_insert_own
ON public.referral_activations
FOR INSERT
TO authenticated
WITH CHECK (
  referred_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.ambassadors a
    WHERE a.referral_code = referral_code
      AND a.user_id <> auth.uid()
      AND a.is_active = true
  )
);

DROP POLICY IF EXISTS activations_select_related ON public.referral_activations;
CREATE POLICY activations_select_related
ON public.referral_activations
FOR SELECT
TO authenticated
USING (
  referred_user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.ambassadors a
    WHERE a.referral_code = referral_activations.referral_code
      AND a.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS conversions_select_own_ambassador ON public.referral_conversions;
CREATE POLICY conversions_select_own_ambassador
ON public.referral_conversions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.ambassadors a
    WHERE a.referral_code = referral_conversions.referral_code
      AND a.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS payouts_select_own ON public.referral_payouts;
CREATE POLICY payouts_select_own
ON public.referral_payouts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.ambassadors a
    WHERE a.id = referral_payouts.ambassador_id
      AND a.user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.get_my_referral_stats()
RETURNS TABLE (
  referral_code text,
  activations_count bigint,
  paid_count bigint,
  weekly_paid_count bigint,
  quarterly_paid_count bigint,
  annual_paid_count bigint,
  gross_paid_cents bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT id, referral_code
    FROM public.ambassadors
    WHERE user_id = auth.uid()
    LIMIT 1
  ),
  a AS (
    SELECT count(*)::bigint AS activations_count
    FROM public.referral_activations ra
    JOIN me ON me.referral_code = ra.referral_code
  ),
  c AS (
    SELECT
      count(*) FILTER (WHERE rc.status = 'paid')::bigint AS paid_count,
      count(*) FILTER (WHERE rc.status = 'paid' AND rc.plan = 'weekly')::bigint AS weekly_paid_count,
      count(*) FILTER (WHERE rc.status = 'paid' AND rc.plan = 'quarterly')::bigint AS quarterly_paid_count,
      count(*) FILTER (WHERE rc.status = 'paid' AND rc.plan = 'annual')::bigint AS annual_paid_count,
      coalesce(sum(rc.gross_amount_cents) FILTER (WHERE rc.status = 'paid'), 0)::bigint AS gross_paid_cents
    FROM public.referral_conversions rc
    JOIN me ON me.referral_code = rc.referral_code
  )
  SELECT
    me.referral_code,
    coalesce(a.activations_count, 0),
    coalesce(c.paid_count, 0),
    coalesce(c.weekly_paid_count, 0),
    coalesce(c.quarterly_paid_count, 0),
    coalesce(c.annual_paid_count, 0),
    coalesce(c.gross_paid_cents, 0)
  FROM me
  LEFT JOIN a ON true
  LEFT JOIN c ON true;
$$;

REVOKE ALL ON FUNCTION public.get_my_referral_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_referral_stats() TO authenticated;

COMMIT;
