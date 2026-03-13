
-- =============================================
-- PRODUCTS FOR ALL 11 LENDERS
-- =============================================

-- RAK Bank products
INSERT INTO public.lender_products (lender_id, product_code, product_name, product_type, min_limit, max_limit, min_tenure, max_tenure)
SELECT id, 'RAK-TL-001', 'Term Loan', 'term_loan', 100000, null, 12, 60
FROM public.onboarding_lenders WHERE short_code = 'RAK';

INSERT INTO public.lender_products (lender_id, product_code, product_name, product_type, min_limit, max_limit, min_tenure, max_tenure)
SELECT id, 'RAK-POS-001', 'POS Finance', 'pos_finance', 50000, null, 6, 36
FROM public.onboarding_lenders WHERE short_code = 'RAK';

-- Emirates NBD
INSERT INTO public.lender_products (lender_id, product_code, product_name, product_type, min_limit, max_limit, min_tenure, max_tenure)
SELECT id, 'ENBD-WC-001', 'Working Capital Loan', 'working_capital', 150000, null, 12, 48
FROM public.onboarding_lenders WHERE short_code = 'ENBD';

-- NBF
INSERT INTO public.lender_products (lender_id, product_code, product_name, product_type, min_limit, max_limit, min_tenure, max_tenure)
SELECT id, 'NBF-BL-001', 'Business Loan', 'business_loan', 100000, null, 12, 60
FROM public.onboarding_lenders WHERE short_code = 'NBF';

-- CredibleX
INSERT INTO public.lender_products (lender_id, product_code, product_name, product_type, min_limit, max_limit, min_tenure, max_tenure)
SELECT id, 'CREDX-WC-001', 'SME Working Capital', 'working_capital', 50000, 750000, 3, 18
FROM public.onboarding_lenders WHERE short_code = 'CREDX';

-- Comfi
INSERT INTO public.lender_products (lender_id, product_code, product_name, product_type, min_limit, max_limit, min_tenure, max_tenure)
SELECT id, 'COMFI-IF-001', 'Invoice Finance', 'invoice_finance', 25000, 400000, 1, 6
FROM public.onboarding_lenders WHERE short_code = 'COMFI';

-- Flapcap
INSERT INTO public.lender_products (lender_id, product_code, product_name, product_type, min_limit, max_limit, min_tenure, max_tenure)
SELECT id, 'FLAP-RBF-001', 'Revenue-Based Financing', 'revenue_based_financing', 30000, 500000, 3, 12
FROM public.onboarding_lenders WHERE short_code = 'FLAP';

-- Flow48
INSERT INTO public.lender_products (lender_id, product_code, product_name, product_type, min_limit, max_limit, min_tenure, max_tenure)
SELECT id, 'FL48-RBF-001', 'Revenue Advance', 'revenue_based_financing', 25000, 300000, 3, 12
FROM public.onboarding_lenders WHERE short_code = 'FL48';

-- Funding Souq
INSERT INTO public.lender_products (lender_id, product_code, product_name, product_type, min_limit, max_limit, min_tenure, max_tenure)
SELECT id, 'FSOUQ-BL-001', 'SME Business Loan', 'business_loan', 100000, 2000000, 6, 36
FROM public.onboarding_lenders WHERE short_code = 'FSOUQ';

-- Upfront
INSERT INTO public.lender_products (lender_id, product_code, product_name, product_type, min_limit, max_limit, min_tenure, max_tenure)
SELECT id, 'UPFR-ADV-001', 'Cash Advance', 'cash_advance', 15000, 250000, 1, 6
FROM public.onboarding_lenders WHERE short_code = 'UPFR';

-- Wio Bank
INSERT INTO public.lender_products (lender_id, product_code, product_name, product_type, min_limit, max_limit, min_tenure, max_tenure)
SELECT id, 'WIO-WC-001', 'Working Capital Finance', 'working_capital', 50000, null, 6, 36
FROM public.onboarding_lenders WHERE short_code = 'WIO';

-- Zelo
INSERT INTO public.lender_products (lender_id, product_code, product_name, product_type, min_limit, max_limit, min_tenure, max_tenure)
SELECT id, 'ZELO-ADV-001', 'Business Advance', 'cash_advance', 20000, 200000, 1, 6
FROM public.onboarding_lenders WHERE short_code = 'ZELO';

-- =============================================
-- RULE SETS FOR ALL 11 LENDERS
-- =============================================

-- RAK Bank Term Loan
INSERT INTO public.lender_rule_sets (lender_id, product_id, rule_set_name, version_no, is_active, remarks)
SELECT l.id, p.id, 'RAK Bank Term Loan Rules v1', 1, true, 'Standard term loan eligibility with POS variant'
FROM public.onboarding_lenders l JOIN public.lender_products p ON p.lender_id = l.id AND p.product_code = 'RAK-TL-001'
WHERE l.short_code = 'RAK';

-- RAK Bank POS Finance
INSERT INTO public.lender_rule_sets (lender_id, product_id, rule_set_name, version_no, is_active, remarks)
SELECT l.id, p.id, 'RAK Bank POS Finance Rules v1', 1, true, 'POS-based financing with 40% cap'
FROM public.onboarding_lenders l JOIN public.lender_products p ON p.lender_id = l.id AND p.product_code = 'RAK-POS-001'
WHERE l.short_code = 'RAK';

-- Emirates NBD
INSERT INTO public.lender_rule_sets (lender_id, product_id, rule_set_name, version_no, is_active, remarks)
SELECT l.id, p.id, 'Emirates NBD Working Capital Rules v1', 1, true, 'Working capital with variance-based multiplier'
FROM public.onboarding_lenders l JOIN public.lender_products p ON p.lender_id = l.id AND p.product_code = 'ENBD-WC-001'
WHERE l.short_code = 'ENBD';

-- NBF
INSERT INTO public.lender_rule_sets (lender_id, product_id, rule_set_name, version_no, is_active, remarks)
SELECT l.id, p.id, 'NBF Business Loan Rules v1', 1, true, '8x multiplier with variance thresholds'
FROM public.onboarding_lenders l JOIN public.lender_products p ON p.lender_id = l.id AND p.product_code = 'NBF-BL-001'
WHERE l.short_code = 'NBF';

-- CredibleX
INSERT INTO public.lender_rule_sets (lender_id, product_id, rule_set_name, version_no, is_active, remarks)
SELECT l.id, p.id, 'CredibleX SME Working Capital Rules v1', 1, true, '6x multiplier, POS 35% cap'
FROM public.onboarding_lenders l JOIN public.lender_products p ON p.lender_id = l.id AND p.product_code = 'CREDX-WC-001'
WHERE l.short_code = 'CREDX';

-- Comfi
INSERT INTO public.lender_rule_sets (lender_id, product_id, rule_set_name, version_no, is_active, remarks)
SELECT l.id, p.id, 'Comfi Invoice Finance Rules v1', 1, true, '5x multiplier, 30% POS cap'
FROM public.onboarding_lenders l JOIN public.lender_products p ON p.lender_id = l.id AND p.product_code = 'COMFI-IF-001'
WHERE l.short_code = 'COMFI';

-- Flapcap
INSERT INTO public.lender_rule_sets (lender_id, product_id, rule_set_name, version_no, is_active, remarks)
SELECT l.id, p.id, 'Flapcap Revenue Financing Rules v1', 1, true, '6x multiplier, turnover-based'
FROM public.onboarding_lenders l JOIN public.lender_products p ON p.lender_id = l.id AND p.product_code = 'FLAP-RBF-001'
WHERE l.short_code = 'FLAP';

-- Flow48
INSERT INTO public.lender_rule_sets (lender_id, product_id, rule_set_name, version_no, is_active, remarks)
SELECT l.id, p.id, 'Flow48 Revenue Advance Rules v1', 1, true, '5x multiplier, 12-month vintage'
FROM public.onboarding_lenders l JOIN public.lender_products p ON p.lender_id = l.id AND p.product_code = 'FL48-RBF-001'
WHERE l.short_code = 'FL48';

-- Funding Souq
INSERT INTO public.lender_rule_sets (lender_id, product_id, rule_set_name, version_no, is_active, remarks)
SELECT l.id, p.id, 'Funding Souq SME Loan Rules v1', 1, true, '8x multiplier, 24-month vintage, POS 40% cap'
FROM public.onboarding_lenders l JOIN public.lender_products p ON p.lender_id = l.id AND p.product_code = 'FSOUQ-BL-001'
WHERE l.short_code = 'FSOUQ';

-- Upfront
INSERT INTO public.lender_rule_sets (lender_id, product_id, rule_set_name, version_no, is_active, remarks)
SELECT l.id, p.id, 'Upfront Cash Advance Rules v1', 1, true, '4x multiplier, low barrier entry'
FROM public.onboarding_lenders l JOIN public.lender_products p ON p.lender_id = l.id AND p.product_code = 'UPFR-ADV-001'
WHERE l.short_code = 'UPFR';

-- Wio Bank
INSERT INTO public.lender_rule_sets (lender_id, product_id, rule_set_name, version_no, is_active, remarks)
SELECT l.id, p.id, 'Wio Bank Working Capital Rules v1', 1, true, '8x multiplier, WIO POS 30% cap'
FROM public.onboarding_lenders l JOIN public.lender_products p ON p.lender_id = l.id AND p.product_code = 'WIO-WC-001'
WHERE l.short_code = 'WIO';

-- Zelo
INSERT INTO public.lender_rule_sets (lender_id, product_id, rule_set_name, version_no, is_active, remarks)
SELECT l.id, p.id, 'Zelo Business Advance Rules v1', 1, true, '4x multiplier, fast approval'
FROM public.onboarding_lenders l JOIN public.lender_products p ON p.lender_id = l.id AND p.product_code = 'ZELO-ADV-001'
WHERE l.short_code = 'ZELO';
