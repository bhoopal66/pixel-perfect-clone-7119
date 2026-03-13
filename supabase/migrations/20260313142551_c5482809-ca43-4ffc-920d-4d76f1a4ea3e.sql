
ALTER TABLE public.related_party_transactions RENAME COLUMN txn_date TO transaction_date;
ALTER TABLE public.related_party_transactions RENAME COLUMN match_confidence TO mapping_confidence;
ALTER TABLE public.related_party_transactions RENAME COLUMN match_method TO detected_by;
