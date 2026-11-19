BEGIN;

ALTER TABLE public.price_alerts
  ADD COLUMN IF NOT EXISTS customer_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'price_alerts_customer_id_fkey'
      AND conrelid = 'public.price_alerts'::regclass
  ) THEN
    ALTER TABLE public.price_alerts
      ADD CONSTRAINT price_alerts_customer_id_fkey
      FOREIGN KEY (customer_id)
      REFERENCES public.customers(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS price_alerts_customer_created_idx
  ON public.price_alerts (customer_id, created_at DESC);

COMMIT;
