
ALTER TABLE public.case_related_parties
  ADD COLUMN IF NOT EXISTS ownership_percentage NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shareholder_name TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS remarks TEXT;

-- Rename entity_type to relationship_type for clarity
ALTER TABLE public.case_related_parties RENAME COLUMN entity_type TO relationship_type;

-- Rename is_active to active_status
ALTER TABLE public.case_related_parties RENAME COLUMN is_active TO active_status;

-- Rename added_by to created_by
ALTER TABLE public.case_related_parties RENAME COLUMN added_by TO created_by;
