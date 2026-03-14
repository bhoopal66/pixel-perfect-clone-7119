
ALTER TABLE public.business_owners
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'Partner',
  ADD COLUMN IF NOT EXISTS address text DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_signatory boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_ubo boolean NOT NULL DEFAULT false;
