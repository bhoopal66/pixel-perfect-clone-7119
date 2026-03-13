
-- 1. Update revenue MIN from 50k to 100k
UPDATE public.lender_rules 
SET threshold_value = '100000',
    failure_message = 'Monthly revenue must be at least AED 100K'
WHERE rule_set_id = 'f2375298-1cdb-4c9d-8bad-a54df17cc07d' 
  AND rule_code = 'HFS-REV-MIN';

-- 2. Update revenue MAX from 750k to 1,000,000
UPDATE public.lender_rules 
SET threshold_value = '1000000',
    failure_message = 'Monthly revenue exceeds AED 1M cap',
    review_message = 'Monthly revenue exceeds AED 1M - review required'
WHERE rule_set_id = 'f2375298-1cdb-4c9d-8bad-a54df17cc07d' 
  AND rule_code = 'HFS-REV-MAX';

-- 3. Update bounced cheque rule: zero tolerance, major severity, REJECT
UPDATE public.lender_rules 
SET threshold_value = '0',
    severity = 'major',
    action_type = 'FAIL',
    failure_message = 'No bounced cheques allowed in the last 6 months',
    review_message = NULL
WHERE rule_set_id = 'f2375298-1cdb-4c9d-8bad-a54df17cc07d' 
  AND rule_code = 'HFS-BANK-002';

-- 4. Add legal compliance rule: no outstanding cases/claims
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_type, threshold_value, action_type, severity, failure_message, priority_order, is_active)
VALUES 
  ('f2375298-1cdb-4c9d-8bad-a54df17cc07d', 'HFS-LEGAL-001', 'No Outstanding Legal Cases', 'eligibility', 'compliance_flag', 'is_false', 'static', NULL, 'FAIL', 'major', 'No outstanding legal cases or claims allowed', 115, true);
