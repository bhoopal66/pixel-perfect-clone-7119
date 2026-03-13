
-- 1. Update HFS lender description
UPDATE public.onboarding_lenders 
SET description = 'HFS provides working capital financing focused on SMEs with stable B2B revenues and healthy gross margins. The financing is primarily used to support cost of goods sold (COGS) for new orders or contracts that generate immediate revenue growth.'
WHERE id = '9bba1450-45c8-4da8-a9f7-aeaba5bf2d38';

-- 2. Update product to match spec
UPDATE public.lender_products 
SET product_code = 'HFS_REV_FINANCE',
    product_name = 'HFS Revenue Finance',
    product_type = 'revenue_based'
WHERE id = '89fc990a-4482-48a4-b211-278abf63faa1';

-- 3. Update HFS-REV-MAX: severity minor, action REVIEW (upper bound is a soft cap)
UPDATE public.lender_rules 
SET severity = 'minor', 
    action_type = 'REVIEW',
    review_message = 'Monthly revenue exceeds AED 750,000 - review required'
WHERE rule_set_id = 'f2375298-1cdb-4c9d-8bad-a54df17cc07d' 
  AND rule_code = 'HFS-REV-MAX';

-- 4. Update HFS-NO-CASH: severity minor, action REVIEW (cash collection is soft)
UPDATE public.lender_rules 
SET severity = 'minor', 
    action_type = 'REVIEW',
    review_message = 'Cash-based collections not preferred - review required'
WHERE rule_set_id = 'f2375298-1cdb-4c9d-8bad-a54df17cc07d' 
  AND rule_code = 'HFS-NO-CASH';

-- 5. Add banking health check rules
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_type, threshold_value, action_type, severity, failure_message, review_message, priority_order, is_active)
VALUES 
  ('f2375298-1cdb-4c9d-8bad-a54df17cc07d', 'HFS-BANK-001', 'Negative Balance Days', 'banking_conduct', 'negative_balance_days', '<=', 'static', '10', 'REVIEW', 'minor', NULL, 'Elevated negative balance days detected - review banking conduct', 110, true),
  ('f2375298-1cdb-4c9d-8bad-a54df17cc07d', 'HFS-BANK-002', 'Returned Cheque Count', 'banking_conduct', 'returned_cheque_count', '<=', 'static', '3', 'REVIEW', 'minor', NULL, 'Returned cheques detected - review banking conduct', 120, true);

-- 6. Add review_required row to decision matrix (was missing)
INSERT INTO public.lender_decision_matrix (rule_set_id, min_major_failures, max_major_failures, min_minor_failures, max_minor_failures, decision_status, remarks)
VALUES 
  ('f2375298-1cdb-4c9d-8bad-a54df17cc07d', 0, 1, 3, 10, 'review_required', 'Revenue near threshold or moderate risk flags - manual review needed');
