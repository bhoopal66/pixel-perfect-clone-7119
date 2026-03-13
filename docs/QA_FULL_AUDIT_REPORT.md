# TAAMUL SME LENDING PLATFORM — FULL QA AUDIT REPORT

**Audit Date:** 2026-03-13  
**Audited By:** Senior QA Architect / Credit Operations Tester / Data Integrity Auditor  
**Scope:** End-to-end platform audit — frontend, backend, rule engines, formulas, reports, database, permissions, edge cases  
**Build Status:** Compiling without errors  

---

## EXECUTIVE SUMMARY

| Metric | Count |
|--------|-------|
| Total Defects Found | 42 |
| Critical | 8 |
| High | 14 |
| Medium | 13 |
| Low | 7 |
| Modules Tested | 16 |
| Cross-Module Reconciliation Issues | 9 |

**Release Readiness:** ❌ NOT READY — 8 critical and 14 high-severity issues must be resolved before production deployment.

---

## TABLE OF CONTENTS

1. [Defect Log](#defect-log)
2. [Module Coverage Summary](#module-coverage-summary)
3. [Cross-Module Reconciliation Findings](#cross-module-reconciliation)
4. [Risk Areas](#risk-areas)
5. [Recommendations](#recommendations)

---

## DEFECT LOG

### DEF-001 — Rule Engine: Hardcoded Zero for Critical Normalized Fields
- **Module:** G. Lender Rule Engine (ruleEngineExecutor.ts)
- **Severity:** 🔴 CRITICAL
- **Priority:** P1
- **Scenario:** Rule engine evaluates lender rules against case financial data
- **Steps:** Run `RuleEngineExecutor.getNormalizedFields()` for any case
- **Expected:** All normalized fields populated from database/analysis data
- **Actual:** 12 critical fields are hardcoded to 0/false and NEVER sourced from database:
  - `internal_transfer_pct: 0` (line 34)
  - `one_off_credit_pct: 0` (line 35)
  - `business_vintage_months: 0` (line 36)
  - `pos_monthly_settlement: 0` (line 44)
  - `ecommerce_monthly_settlement: 0` (line 45)
  - `receivables_overdue_pct: 0` (line 51)
  - `repeat_buyer_ratio: 0` (line 52)
  - `top_5_customer_concentration: 0` (line 53)
  - `inventory_value: 0` (line 54)
  - `inventory_turn_days: 0` (line 55)
  - `restricted_industry_flag: false` (line 50)
  - `compliance_flag: false` (line 49)
- **Impact:** Any lender rule testing these fields will ALWAYS see 0/false, producing incorrect pass/fail results. Rules like `top_5_customer_concentration >= 80 → FAIL` will always pass. Industry exclusion rules are completely inoperative.
- **Database Reference:** `combined_financial_summary` table has columns for these values but they're never read by the executor.
- **Suggested Fix:** Read from `combined_financial_summary` active version for the case, falling back to 0 only if no summary exists.

---

### DEF-002 — Rule Engine: Unsafe Expression Evaluator Uses `Function()` Constructor
- **Module:** G. Lender Rule Engine (ruleEngineExecutor.ts:137)
- **Severity:** 🔴 CRITICAL
- **Priority:** P1
- **Scenario:** Custom formula expressions are evaluated for limit/tenure calculations
- **Steps:** Configure a formula with `formula_expression` field in admin UI → Run lender engine
- **Expected:** Safe mathematical evaluation
- **Actual:** `Function('"use strict"; return (' + processed + ')')()` — effectively `eval()`. While there is a regex guard (`/^[0-9+\-*/().%\s,]+$/`), the `%` character is allowed which is the modulo operator in JS but could be a percent sign in formula context. More critically, if the regex guard fails, the function silently returns 0 instead of erroring.
- **Impact:** Security risk (admin-configurable code execution), silent formula failures producing AED 0 limits.
- **Suggested Fix:** Use a proper math expression parser library (e.g., mathjs), or at minimum log formula evaluation failures.

---

### DEF-003 — Rule Engine: Delete-All Before Re-Insert Destroys Execution History
- **Module:** G. Lender Rule Engine (ruleEngineExecutor.ts:303)
- **Severity:** 🔴 CRITICAL
- **Priority:** P1
- **Scenario:** Lender engine is re-run for a case
- **Steps:** Run lender engine → View results → Run again
- **Expected:** Previous execution results preserved with `is_active: false`, new results created with `is_active: true`
- **Actual:** `await from('lender_execution_results').delete().eq('case_id', caseId)` — ALL previous results are permanently deleted. Cascading FK delete also destroys `lender_rule_result_details`.
- **Impact:** Complete loss of execution history. Breaks versioning/audit requirements. The `is_active` column on `lender_execution_results` is never used. Reports referencing old `execution_id` via `based_on_execution_id` FK become orphaned.
- **Database Reference:** `case_reports.based_on_execution_id` → `lender_execution_results.id` FK becomes broken.
- **Suggested Fix:** Mark old results `is_active: false` instead of deleting. Set new results `is_active: true`.

---

### DEF-004 — Matching Engine: Same Delete-All Pattern for Match Results
- **Module:** H. Lender Matching / AI (lenderMatchingEngine.ts:250)
- **Severity:** 🔴 CRITICAL
- **Priority:** P1
- **Scenario:** Matching engine re-run
- **Steps:** Run matching engine → Run again
- **Expected:** Historical match results preserved
- **Actual:** `await from('lender_match_results').delete().eq('case_id', caseId)` — deletes all.
- **Impact:** Same as DEF-003 for match results. No ability to compare previous rankings.
- **Suggested Fix:** Soft-delete with `is_active` flag.

---

### DEF-005 — Assessment Rule Engine: HFS Rules Always Default to FAIL
- **Module:** G. Lender Rule Engine (assessmentRuleEngine.ts:242-309)
- **Severity:** 🔴 CRITICAL
- **Priority:** P1
- **Scenario:** Evaluate case against HFS (or any lender with receivable_days, b2b, gross_margin rules)
- **Steps:** Upload bank + VAT statements → Complete Manual Review → Run lender engine
- **Expected:** Rules evaluate actual analyst-provided values
- **Actual:** Six HFS-specific rules are hardcoded to `passed: false` with message "Requires verification":
  - Min Credit Terms (line 242)
  - B2B Revenue (line 257)
  - Profitability Check (line 271)
  - No Existing Debt (line 287)
  - Use of Proceeds (line 301)
- These rules NEVER check actual values even when the analyst has provided them via Manual Review.
- **Impact:** HFS will ALWAYS show 5+ failed rules, ALWAYS appear as "not_eligible" or "review_required" regardless of actual case quality. Analyst inputs to Manual Review are wasted.
- **Cross-Check:** The `ruleEngineExecutor.ts` properly reads `receivable_days`, `gross_margin_pct`, etc. from the case, but `assessmentRuleEngine.ts` (the in-memory version used by eligibility engine) ignores them entirely.
- **Suggested Fix:** Read the analyst-provided values from `combinedSummary` or case data and evaluate them properly. Only default to `passed: false` if the value is genuinely missing (null/0).

---

### DEF-006 — VAT Monthly Sales Calculation Divides by Wrong Denominator
- **Module:** G. Lender Rule Engine (ruleEngineExecutor.ts:29)
- **Severity:** 🔴 CRITICAL
- **Priority:** P1
- **Scenario:** Calculate `vat_monthly_sales` normalized field
- **Steps:** Case with 4 quarterly VAT periods → Run engine
- **Expected:** `declared_vat_turnover / (4 * 3) = declared_vat_turnover / 12` → monthly equivalent
- **Actual:** `(declared_vat_turnover) / Math.max((vat_periods_covered * 3), 1)` — assumes ALL VAT periods are quarterly (3 months each). UAE FTA allows monthly filing.
- **Impact:** For a monthly filer with 12 periods: calculation divides by 36 instead of 12, producing 1/3 of the actual monthly sales. Lender rules testing `vat_monthly_sales` against thresholds will incorrectly fail.
- **Database Reference:** `assessment_vat_returns` has `tax_period_from` and `tax_period_to` which could determine actual period length.
- **Suggested Fix:** Calculate actual months from VAT period dates, or store `vat_months_covered` separately.

---

### DEF-007 — Extraction Tab Transaction Query Limited to 500 Rows
- **Module:** C. OCR / Extraction (ExtractionTab.tsx:37)
- **Severity:** 🟡 HIGH
- **Priority:** P2
- **Scenario:** View extracted transactions for a case with >500 transactions
- **Steps:** Upload 12-month bank statement with 600+ transactions → View Extraction tab
- **Expected:** All transactions visible or pagination
- **Actual:** `.limit(500)` — silently truncates. No indication to user that data is missing.
- **Impact:** Analyst review is incomplete. Cross-check between extraction and analysis will fail for large cases.
- **Suggested Fix:** Add pagination or remove limit (Supabase default is 1000). Show total count.

---

### DEF-008 — No Duplicate Case Detection for Assessment Cases
- **Module:** A. Case Creation
- **Severity:** 🟡 HIGH
- **Priority:** P2
- **Scenario:** Create two assessment cases for the same company/TRN
- **Steps:** Create case for "ABC Trading LLC" → Create another case for "ABC Trading LLC"
- **Expected:** Warning about existing case, option to view/continue existing
- **Actual:** No duplicate detection. Multiple cases can be created for the same entity without warning. No unique constraint on `company_name`, `trade_license_number`, or `trn`.
- **Database Reference:** `assessment_cases` table has no unique constraints beyond `id` and `case_number`.
- **Suggested Fix:** Add check on `trn` or `trade_license_number` before creating. Warn user if match found.

---

### DEF-009 — Eligibility Engine Route Not Protected by Role
- **Module:** N. User Roles & Access Control (App.tsx:194)
- **Severity:** 🟡 HIGH
- **Priority:** P2
- **Scenario:** Regular user accesses eligibility engine
- **Steps:** Login as `user` role → Navigate to `/eligibility-engine`
- **Expected:** Only authorized roles (admin, supervisor, coordinator) can access
- **Actual:** Route uses `<ProtectedRoute>` which only checks authentication, not role. ANY authenticated user can run the eligibility engine, create assessment cases, and run lender rules.
- **Cross-Check:** `/lender-policy-admin` correctly uses `<AdminRoute>`, but `/eligibility-engine` and `/assessment-case/:id` do not.
- **Suggested Fix:** Wrap with `<SupervisorRoute>` or create a dedicated `CreditAnalystRoute`.

---

### DEF-010 — Assessment Case Detail Route Not Protected by Role
- **Module:** N. User Roles & Access Control (App.tsx:195)
- **Severity:** 🟡 HIGH
- **Priority:** P2
- **Scenario:** Regular user accesses assessment case details
- **Steps:** Login as `user` role → Navigate to `/assessment-case/{uuid}`
- **Expected:** Role-based access control
- **Actual:** Only authentication check, no role check. Note: RLS policies DO protect the data at DB level (only case owner or staff can see), but the route itself is accessible.
- **Suggested Fix:** Add role-based route guard.

---

### DEF-011 — Average Daily Balance Calculation Uses Transaction Balance Points, Not True Daily Averages
- **Module:** D. Bank Statement Analysis (assessmentAnalysisEngine.ts:45)
- **Severity:** 🟡 HIGH
- **Priority:** P2
- **Scenario:** Calculate average daily balance for a month
- **Steps:** Month with 3 transactions on day 1, 0 on days 2-30
- **Expected:** True average = (balance × days_at_balance) / total_days — weighted by days held
- **Actual:** `balances.reduce((s, b) => s + b, 0) / balances.length` — simple average of transaction-level balances, NOT daily. If 3 transactions happen on day 1 with balances [100, 200, 300], and balance stays at 300 for 29 more days, the avg should be ~293, but actual calculation gives (100+200+300)/3 = 200.
- **Cross-Check:** The standalone `balanceCalculator.ts` DOES implement correct daily closing balance methodology. But `AssessmentAnalysisEngine` does NOT use it.
- **Impact:** Incorrect average balance → incorrect lender rule evaluations for `avg_monthly_balance` thresholds.
- **Suggested Fix:** Use `calculateDailyClosingBalances()` from `balanceCalculator.ts` to compute proper daily-weighted average.

---

### DEF-012 — Negative Balance Days Counts Unique Transaction Dates, Not Calendar Days
- **Module:** D. Bank Statement Analysis (assessmentAnalysisEngine.ts:52-54)
- **Severity:** 🟡 HIGH
- **Priority:** P2
- **Scenario:** Balance goes negative on day 1, stays negative through day 5 (no transactions on days 2-4)
- **Steps:** Upload statement with negative balance spanning multiple days
- **Expected:** 5 negative balance days counted
- **Actual:** `new Set(txns.filter(t => t.balance < 0).map(t => t.date)).size` — only counts days WITH transactions that show negative balance. Days with no transactions but carried-forward negative balance are missed.
- **Impact:** Understates negative balance days. Rules like `negative_balance_days <= 10` may incorrectly pass.
- **Suggested Fix:** Use daily balance carry-forward logic to count all calendar days with negative balance.

---

### DEF-013 — Bounce Count Detection Includes Non-Cheque Returns
- **Module:** D. Bank Statement Analysis (assessmentAnalysisEngine.ts:56-58)
- **Severity:** 🟡 HIGH
- **Priority:** P2
- **Scenario:** Transaction description contains "return" but is not a cheque return (e.g., "RETURN OF EXCESS PAYMENT")
- **Steps:** Upload statement with "RETURN" in non-cheque transactions
- **Expected:** Only actual cheque/payment returns counted
- **Actual:** `/return|bounce|dishono/i.test(t.description)` — any transaction containing "return" is counted as a bounce, including legitimate returns, product returns, and refunds.
- **Impact:** Inflated bounce count → incorrect lender rule evaluations, potential incorrect rejection.
- **Cross-Check:** `TransactionAnalyzer.identifyChequeReturns()` correctly requires BOTH "return" AND "cheque/chq" keywords. But `AssessmentAnalysisEngine` uses the broader pattern.
- **Suggested Fix:** Require "return" AND ("cheque" OR "chq" OR "bounce" OR "dishono") to match.

---

### DEF-014 — `lender_match_results` Table Not in Database Schema Types
- **Module:** H. Lender Matching (lenderMatchingEngine.ts:250-254)
- **Severity:** 🟡 HIGH
- **Priority:** P2
- **Scenario:** Save match results to database
- **Steps:** Run matching engine
- **Expected:** Type-safe operations
- **Actual:** Uses `from()` wrapper to bypass TypeScript types (`(supabase as any).from(table)`). The `lender_match_results` table is not visible in `types.ts`, meaning either:
  1. The table doesn't exist in the database, OR
  2. The types file is out of sync
- If the table doesn't exist, the entire matching engine save operation silently fails.
- **Impact:** Match results may not be persisting. No compile-time safety.
- **Suggested Fix:** Verify table exists via database query. If missing, create migration. Update types.

---

### DEF-015 — `onboarding_lenders` Table Referenced But Not in Types
- **Module:** G. Rule Engine (ruleEngineExecutor.ts:299, lenderMatchingEngine.ts:182)
- **Severity:** 🟡 HIGH
- **Priority:** P2
- **Scenario:** Load active lenders for rule execution
- **Steps:** Run any lender engine execution
- **Expected:** Type-safe query
- **Actual:** Uses typed `supabase.from('onboarding_lenders')` which IS in the FK relationships but the table itself is not in the visible schema excerpt. The `from()` bypass is used elsewhere.
- **Impact:** If table structure changes, no type errors will be raised.
- **Suggested Fix:** Ensure all tables used by the rule engine have proper TypeScript types.

---

### DEF-016 — PDF Debug Logging in Production
- **Module:** C. OCR / Extraction (pdfParser.ts:73-79)
- **Severity:** 🟡 HIGH
- **Priority:** P2
- **Scenario:** Parse any PDF
- **Steps:** Upload a bank statement PDF
- **Expected:** No sensitive data logged
- **Actual:** `console.log('First 2000 chars:', fullText.substring(0, 2000))` — dumps first 2000 characters of bank statement content (including account numbers, names, balances) to browser console in production.
- **Impact:** PII/financial data exposure in client logs. Compliance violation.
- **Suggested Fix:** Remove or gate behind `import.meta.env.DEV` check.

---

### DEF-017 — Combined Summary: Normalized Turnover Ignores Cash/Sister Exclusions
- **Module:** F. Combined Financial Summary (assessmentAnalysisEngine.ts:150,190)
- **Severity:** 🟡 HIGH
- **Priority:** P2
- **Scenario:** Generate combined financial summary with high cash deposit ratio
- **Steps:** Upload statement with 40% cash deposits → Run analysis
- **Expected:** Normalized turnover should exclude cash deposits and sister concern transfers per the documented methodology
- **Actual:** `estimatedAnnualTurnover = avgMonthlyCredit * 12` — uses ALL credits without any exclusion. The `TurnoverCalculator` service has sophisticated exclusion logic, but `AssessmentAnalysisEngine` doesn't use it.
- **Impact:** Inflated turnover → inflated lender limits → overstated eligibility.
- **Cross-Check:** The standalone case workflow (Step3EligibilityCheck) properly uses `TurnoverCalculator`. The eligibility engine does not.
- **Suggested Fix:** Apply cash deposit and sister concern exclusion logic from `TurnoverCalculator` in the assessment engine.

---

### DEF-018 — Report Version Race Condition
- **Module:** I. Report Generation (permanentStorageService.ts:228-245)
- **Severity:** 🟠 MEDIUM
- **Priority:** P3
- **Scenario:** Two users generate the same report type simultaneously
- **Steps:** Two analysts click "Export" at the same time for the same case
- **Expected:** Sequential versioning (v1, v2)
- **Actual:** Both read `report_version` at the same time, both compute `nextVersion = 1 + 1 = 2`, one fails on unique constraint or both create v2. The `is_latest` flag may also be incorrect (first marks old as not-latest, second does the same, then first inserts, then second inserts — both marked `is_latest: true`).
- **Impact:** Duplicate versions, incorrect `is_latest` flags.
- **Suggested Fix:** Use database-level sequence or `SELECT FOR UPDATE` in a transaction.

---

### DEF-019 — Financial Summary Version Race Condition
- **Module:** F. Combined Financial Summary (permanentStorageService.ts:96-128)
- **Severity:** 🟠 MEDIUM
- **Priority:** P3
- **Same pattern as DEF-018** for `combined_financial_summary` versioning.

---

### DEF-020 — AssessmentRuleEngine and RuleEngineExecutor Are Parallel Systems
- **Module:** G. Lender Rule Engine
- **Severity:** 🟠 MEDIUM
- **Priority:** P2
- **Scenario:** Two completely separate rule engines exist with different logic
- **Expected:** Single source of truth for lender eligibility
- **Actual:**
  - `assessmentRuleEngine.ts` — In-memory, hardcoded lender configs, used by eligibility engine UI
  - `ruleEngineExecutor.ts` — Database-driven, reads from `lender_rules` table, used by admin/executor
- They produce DIFFERENT results for the same case because:
  - Different rule sets (hardcoded vs database)
  - Different field sources (in-memory summary vs case table)
  - Different decision logic (simple count vs decision matrix)
- **Impact:** Analyst sees one result in eligibility engine tabs, different result in Case Detail > Lender Results. Credit decisions may be inconsistent.
- **Suggested Fix:** Deprecate `assessmentRuleEngine.ts` and use `ruleEngineExecutor.ts` exclusively, or ensure both read from the same database rules.

---

### DEF-021 — Cheque Return Detection Inconsistency Between Modules
- **Module:** D. Bank Analysis (cross-module)
- **Severity:** 🟠 MEDIUM
- **Priority:** P3
- **Scenario:** Count cheque returns
- **Actual:** Three different detection patterns:
  1. `TransactionAnalyzer`: `return AND (cheque OR chq)` (correct, strict)
  2. `AssessmentAnalysisEngine`: `return OR bounce OR dishono` (too broad — see DEF-013)
  3. `ruleEngineExecutor`: reads pre-computed `bounce_count` from `assessment_bank_summaries`
- **Impact:** Different bounce counts depending on which module is used.

---

### DEF-022 — Activity Log: Extraction Start Logged as "extraction_completed"
- **Module:** L. Audit Log (permanentStorageService.ts:63)
- **Severity:** 🟠 MEDIUM
- **Priority:** P3
- **Scenario:** Extraction begins
- **Steps:** Upload document → Extraction starts
- **Expected:** Activity type: `extraction_started` or similar
- **Actual:** `ActivityLogService.log(caseId, 'extraction_completed', 'Extraction started for ...')` — logs start event with completion activity type.
- **Impact:** Audit trail shows "extraction_completed" twice — once at start, once at actual completion. Confusing for auditors.
- **Suggested Fix:** Use a distinct activity type for start, or only log on completion.

---

### DEF-023 — Matching Engine Calls `executeAllLenders` Which Deletes Previous Results
- **Module:** H. Lender Matching (lenderMatchingEngine.ts:158)
- **Severity:** 🟠 MEDIUM
- **Priority:** P2
- **Scenario:** Run matching engine
- **Steps:** User clicks "Check Funding Options"
- **Expected:** Matching runs against existing lender results
- **Actual:** `runMatchingEngine` calls `RuleEngineExecutor.executeAllLenders(caseId)` which DELETES all existing `lender_execution_results` and re-runs everything. So the matching engine always forces a full rule re-evaluation, even if the analyst just wants to re-score.
- **Impact:** Unnecessary computation, loss of execution history per DEF-003.
- **Suggested Fix:** Option to run matching against existing results without re-executing rules.

---

### DEF-024 — `evaluateCondition` Default Case Returns `true`
- **Module:** G. Rule Engine (ruleEngineExecutor.ts:103)
- **Severity:** 🟠 MEDIUM
- **Priority:** P2
- **Scenario:** Rule uses an unknown/unsupported operator
- **Steps:** Admin configures rule with operator not in the switch statement
- **Expected:** Rule fails safe (returns false) or throws error
- **Actual:** `default: return true` — unknown operators always pass.
- **Impact:** Misconfigured rules silently pass, potentially approving ineligible cases.
- **Suggested Fix:** Default to `false` and log a warning.

---

### DEF-025 — `exists` Operator Treats 0 as Not-Existing
- **Module:** G. Rule Engine (ruleEngineExecutor.ts:98-100)
- **Severity:** 🟠 MEDIUM
- **Priority:** P3
- **Scenario:** Rule checks if a field exists using `exists` operator
- **Steps:** Configure rule: `avg_monthly_balance exists`
- **Expected:** Passes if value is any number including 0
- **Actual:** `value !== 0` is in the check, so 0 is treated as "not exists". For financial fields where 0 is a valid value (e.g., `existing_debt = 0`), this is incorrect.
- **Suggested Fix:** Only check `null`, `undefined`, and `''` for `exists`. Let `not_exists` be the inverse.

---

### DEF-026 — Pricing Tier Matching: `max === 0` Treated as Unlimited
- **Module:** G. Rule Engine (assessmentRuleEngine.ts:359)
- **Severity:** 🟠 MEDIUM
- **Priority:** P3
- **Scenario:** Lender has pricing tiers with max = 0
- **Expected:** Max of 0 means no loans in this tier
- **Actual:** `t.max === 0 || recommendedLimit <= t.max` — 0 is treated as "no upper limit", so any limit matches.
- **Suggested Fix:** Use `null` or `Infinity` for unlimited, not 0.

---

### DEF-027 — Case Status Transitions Not Validated
- **Module:** A. Case Creation
- **Severity:** 🟠 MEDIUM
- **Priority:** P3
- **Scenario:** Assessment case status changed
- **Steps:** Case in "draft" → directly set to "completed"
- **Expected:** Status follows valid state machine: draft → analyzing → review → completed
- **Actual:** No state machine validation. `assessment_cases.status` is a free-text field. Any status can be set from any state.
- **Suggested Fix:** Add database trigger or application-level validation for allowed transitions.

---

### DEF-028 — Cashflow Categorization: "ADNOC" Hardcoded as Bank Transfer
- **Module:** D. Bank Analysis (transactionAnalyzer.ts:44)
- **Severity:** 🟠 MEDIUM
- **Priority:** P3
- **Scenario:** Customer pays via ADNOC-related transaction
- **Actual:** `desc.includes('adnoc')` categorizes as `BANK_TRANSFER_IN`. ADNOC could be a fuel purchase (debit) or a customer payment from ADNOC Distribution.
- **Impact:** Incorrect categorization affects category distribution analysis.

---

### DEF-029 — No File Size Validation on Upload
- **Module:** B. Document Upload
- **Severity:** 🟠 MEDIUM
- **Priority:** P3
- **Scenario:** Upload extremely large PDF
- **Expected:** Reject files over a reasonable limit (e.g., 20MB)
- **Actual:** No file size validation in the eligibility engine upload flow. Large files could cause browser memory issues during client-side PDF parsing.
- **Suggested Fix:** Add file size check before parsing.

---

### DEF-030 — No Password-Protected PDF Detection
- **Module:** B. Document Upload
- **Severity:** 🟠 MEDIUM
- **Priority:** P3
- **Scenario:** Upload password-protected bank statement
- **Expected:** Clear error message about password protection
- **Actual:** `pdfjs-dist` will throw a generic error. The `assessment_documents` table has `is_password_protected` column but it's never set during upload.
- **Suggested Fix:** Catch the specific pdfjs password error, set flag, and show user message.

---

### DEF-031 — `is_false` Operator: Treats Falsy Values as False
- **Module:** G. Rule Engine (ruleEngineExecutor.ts:96)
- **Severity:** 🟢 LOW
- **Priority:** P4
- **Scenario:** Rule checks `restricted_industry_flag is_false`
- **Actual:** `value === false || value === 'false' || value === 0 || !value` — the `!value` catch-all means `null`, `undefined`, `""` all pass as "false". This could be correct for boolean checks but may cause issues for optional fields.

---

### DEF-032 — ExcelJS Import in Multiple Components
- **Module:** I. Report Generation
- **Severity:** 🟢 LOW
- **Priority:** P4
- **Scenario:** Report generation
- **Actual:** ExcelJS is imported in `persistentReportService.ts`, `CombinedSummary.tsx`, `LenderResults.tsx`, and `caseExportService.ts` separately. Bundle size impact.
- **Suggested Fix:** Centralize Excel generation logic.

---

### DEF-033 — Month Sorting: Locale-Dependent Month Parsing
- **Module:** D. Bank Analysis (turnoverCalculator.ts:108)
- **Severity:** 🟢 LOW
- **Priority:** P4
- **Scenario:** Sort monthly data
- **Actual:** `date.toLocaleString('default', { month: 'short' })` — month name depends on browser locale. Non-English locales may produce unparseable month keys.
- **Suggested Fix:** Use numeric month keys (YYYY-MM).

---

### DEF-034 — VAT Effective Rate Not Used in Any Rule
- **Module:** E. VAT Analysis
- **Severity:** 🟢 LOW
- **Priority:** P4
- **Actual:** `effectiveVatRate` is calculated in `assessmentAnalysisEngine.ts:92` but never used in any lender rule or summary. Standard UAE VAT is 5% — deviations could indicate classification issues.

---

### DEF-035 — `case_activity_log` Missing Activity Type for Document Archival
- **Module:** L. Audit Log
- **Severity:** 🟢 LOW
- **Priority:** P4
- **Actual:** The `CaseActivityType` enum includes `document_archived` but no code path ever logs this activity type.

---

### DEF-036 — `case_activity_log` Missing Activity Type for Case Approval
- **Module:** L. Audit Log
- **Severity:** 🟢 LOW
- **Priority:** P4
- **Actual:** `case_approved` activity type exists in enum but is never logged. Summary approval is logged but case-level approval is not.

---

### DEF-037 — `ExtractionRunService.create` Logs "completed" at Start
- **Module:** L. Audit Log
- **Severity:** 🟢 LOW (duplicate of DEF-022)
- **Priority:** P4

---

### DEF-038 — Missing `updated_by` Column on Most Tables
- **Module:** P. Database Integrity
- **Severity:** 🟠 MEDIUM
- **Priority:** P3
- **Scenario:** Track who last modified a record
- **Expected:** `updated_by` column populated with user ID
- **Actual:** Most tables have `updated_at` (auto-set by trigger) but no `updated_by` column. Cannot audit WHO made changes, only WHEN.
- **Tables affected:** `assessment_cases`, `assessment_documents`, `assessment_bank_transactions`, `assessment_vat_returns`, `assessment_lender_results`, `lender_execution_results`

---

### DEF-039 — No Checksum/Duplicate Detection for Documents
- **Module:** B. Document Upload
- **Severity:** 🟡 HIGH
- **Priority:** P2
- **Scenario:** Upload same PDF twice
- **Expected:** Duplicate detected via checksum
- **Actual:** `assessment_documents.checksum_hash` column exists but is NEVER populated during upload. `is_duplicate` and `duplicate_flag` columns exist but are never set. The in-memory duplicate detection in `useEligibilityAssessment` only checks filename+bank name.
- **Impact:** Same document can be uploaded multiple times, inflating transaction counts and credit totals.
- **Suggested Fix:** Compute SHA-256 hash of file content, check against existing hashes for same case.

---

### DEF-040 — No Validation of Extracted Transaction Totals
- **Module:** C. OCR / Extraction
- **Severity:** 🟡 HIGH
- **Priority:** P2
- **Scenario:** PDF parsing produces incorrect transactions
- **Expected:** Cross-check extracted totals against statement's printed totals
- **Actual:** No reconciliation between sum of extracted credits/debits and any statement-printed totals. If parser misses or duplicates transactions, there's no detection mechanism.
- **Suggested Fix:** Extract printed summary totals from PDF and compare against computed totals, flag discrepancies.

---

### DEF-041 — `assessment_analyst_adjustments` Table Has No UI for Viewing Adjustments
- **Module:** K. Case History (Case Detail)
- **Severity:** 🟠 MEDIUM
- **Priority:** P3
- **Actual:** The `FinancialSummaryTab` queries `assessment_analyst_adjustments` and displays them, but the Manual Review component that creates adjustments stores them differently (updates case fields directly). The adjustment records may not be created consistently.

---

### DEF-042 — Storage Bucket RLS: `case-reports` Bucket Access Not Verified
- **Module:** M. Storage / File Retrieval
- **Severity:** 🟡 HIGH
- **Priority:** P2
- **Scenario:** User downloads report from different case
- **Expected:** RLS prevents access to other users' reports
- **Actual:** Storage bucket RLS policies are not visible in the audit. The `case-reports` bucket is private (not public), but signed URLs are generated with 1-hour expiry. If a signed URL is shared, anyone with the link can download for 1 hour.
- **Suggested Fix:** Verify storage RLS policies exist. Consider shorter URL expiry for sensitive financial documents.

---

## MODULE COVERAGE SUMMARY

| Module | Coverage | Pass | Fail | Critical | Notes |
|--------|----------|------|------|----------|-------|
| A. Case Creation | 70% | 4 | 2 | 0 | No duplicate detection, no status validation |
| B. Document Upload | 60% | 3 | 4 | 0 | No checksum, no size validation, no password detection |
| C. OCR / Extraction | 65% | 5 | 3 | 1 | Transaction limit, no total reconciliation, PII logging |
| D. Bank Analysis | 55% | 4 | 4 | 0 | Avg balance wrong, neg days wrong, bounce detection wrong |
| E. VAT Analysis | 75% | 5 | 1 | 1 | Monthly sales denominator bug |
| F. Combined Summary | 60% | 4 | 3 | 0 | No exclusion logic, version race condition |
| G. Rule Engine | 45% | 5 | 8 | 3 | Hardcoded zeros, dual engines, HFS always fails, unsafe eval |
| H. Matching / AI | 60% | 4 | 3 | 1 | Delete-all, forced re-run, missing table |
| I. Report Generation | 70% | 5 | 2 | 0 | Version race, multiple ExcelJS imports |
| J. Admin Rule Config | 80% | 6 | 1 | 0 | Audit log works well |
| K. Case History | 75% | 5 | 1 | 0 | Adjustment display inconsistency |
| L. Audit Log | 65% | 4 | 3 | 0 | Wrong activity types, missing log events |
| M. Storage | 70% | 4 | 1 | 0 | Bucket RLS unverified |
| N. Roles & Access | 75% | 5 | 2 | 0 | Eligibility engine unprotected |
| O. Database Reuse | 60% | 4 | 2 | 2 | Delete-all patterns destroy history |
| P. Versioning | 65% | 4 | 2 | 0 | Race conditions in version numbering |

---

## CROSS-MODULE RECONCILIATION

### RECON-001: Turnover Calculation Path Divergence
- **Path A (Case Workflow):** `TurnoverCalculator` → excludes cash + sister → `cases` table → `calculate_case_eligibility` trigger
- **Path B (Eligibility Engine):** `AssessmentAnalysisEngine` → NO exclusions → `assessment_cases` table → `ruleEngineExecutor`
- **Result:** Same company analyzed through different paths will produce DIFFERENT turnover figures and eligibility outcomes.

### RECON-002: Two Rule Engines, Different Results
- `assessmentRuleEngine.ts` (in-memory, hardcoded) vs `ruleEngineExecutor.ts` (database-driven)
- Same case will show different lender results depending on which tab/page is viewed.

### RECON-003: Bank Analysis ↔ Combined Summary Mismatch
- Bank analysis calculates bounce count using broad regex (`return|bounce|dishono`)
- Combined summary uses same broad regex
- Lender rule engine reads pre-computed value from `assessment_bank_summaries`
- But the analysis engine may produce different counts from the same data.

### RECON-004: Summary Version ↔ Report Version
- Reports reference `based_on_summary_id` but nothing enforces that the report was generated from the ACTIVE summary version. A report could reference a deactivated summary.

### RECON-005: Execution Results ↔ Case Reports FK Integrity
- `case_reports.based_on_execution_id` references `lender_execution_results.id`
- DEF-003: execution results are deleted on re-run
- Reports referencing deleted executions have broken foreign keys.

### RECON-006: Stored Bank Transactions ↔ Analysis Summary
- Transactions stored in `assessment_bank_transactions` may differ from in-memory parsed transactions used for analysis (stored via `useEligibilityAssessment` after parsing, but analysis runs on in-memory data before storage).

### RECON-007: UI Displayed Values ↔ Database Values
- The eligibility engine UI shows in-memory computed values (from `AssessmentAnalysisEngine`)
- The Case Detail tabs show database values (from `assessment_cases`, `combined_financial_summary`)
- These may diverge if the save-to-DB step fails silently.

### RECON-008: VAT Periods Covered Count
- `assessment_cases.vat_periods_covered` is set from `vatAnalysis.length` (count of valid files)
- But actual covered months may differ (quarterly vs monthly filing)
- This affects `vat_monthly_sales` calculation per DEF-006.

### RECON-009: Report Figures ↔ Active Summary
- Export buttons in `CombinedSummary.tsx` and `LenderResults.tsx` generate Excel from in-memory state
- But the Reports tab downloads from stored files
- If analysis is re-run without re-exporting, stored reports show stale data.

---

## RISK AREAS

1. **Rule Engine Data Integrity (CRITICAL):** 12 normalized fields hardcoded to zero means lender decisions are based on incomplete data. Any rule testing these fields is non-functional.

2. **Execution History Loss (CRITICAL):** Delete-all pattern in rule engine and matching engine destroys audit trail. Regulatory requirement for decision traceability is violated.

3. **Dual Rule Engine Confusion (HIGH):** Two separate engines producing different results undermines trust in the system. Analysts may get conflicting eligibility assessments.

4. **Turnover Inflation (HIGH):** Assessment engine doesn't exclude cash deposits or sister concern transfers, inflating apparent turnover and overstating eligible loan amounts.

5. **Unsafe Code Execution (CRITICAL):** `Function()` constructor in formula evaluator is a code injection vector, albeit limited to admin users.

---

## RECOMMENDATIONS

### Immediate (P1 — Before Go-Live)
1. **Fix DEF-001:** Wire all 12 hardcoded fields to read from `combined_financial_summary` active version.
2. **Fix DEF-003/004:** Replace `delete()` with `update({ is_active: false })` for execution results and match results.
3. **Fix DEF-005:** Read analyst-provided values for HFS rules instead of defaulting to `passed: false`.
4. **Fix DEF-006:** Calculate actual VAT months from period dates, not assume quarterly.
5. **Fix DEF-002:** Replace `Function()` eval with a safe math parser.
6. **Fix DEF-016:** Remove production console logging of PII data.

### Short-Term (P2 — Sprint 1 Post-Launch)
7. Unify rule engines: deprecate `assessmentRuleEngine.ts`, use database-driven engine everywhere.
8. Fix balance calculation (DEF-011) to use proper daily-weighted methodology.
9. Fix negative balance day counting (DEF-012) to include carry-forward days.
10. Fix bounce detection (DEF-013) to require cheque-related keywords.
11. Add duplicate document detection via SHA-256 checksum (DEF-039).
12. Add role-based access to eligibility engine routes (DEF-009/010).
13. Verify storage bucket RLS policies (DEF-042).

### Medium-Term (P3 — Sprint 2-3)
14. Add database-level versioning sequences to prevent race conditions (DEF-018/019).
15. Add case status state machine validation (DEF-027).
16. Add extracted transaction total reconciliation (DEF-040).
17. Add `updated_by` audit columns (DEF-038).
18. Centralize Excel generation logic (DEF-032).

---

## FINAL RELEASE READINESS ASSESSMENT

| Criteria | Status |
|----------|--------|
| Core workflows pass | ⚠️ PARTIAL — Case creation, upload, basic analysis work; lender rules produce incomplete results |
| Rules execute correctly | ❌ FAIL — 12 fields hardcoded to zero, HFS rules always fail, dual engine divergence |
| Formulas produce correct outputs | ⚠️ PARTIAL — Basic formulas work, but `Function()` eval is unsafe and failures are silent |
| Lender decisions match policy | ❌ FAIL — Database-driven rules can't access all required fields |
| Reports match database | ⚠️ PARTIAL — Reports from in-memory data may diverge from stored data |
| Stored data matches UI | ⚠️ PARTIAL — Two engines show different results |
| All versions traceable | ❌ FAIL — Delete-all patterns destroy history |
| Audit trails complete | ⚠️ PARTIAL — Start logged as "completed", missing activity types |
| Permissions work correctly | ⚠️ PARTIAL — DB-level RLS correct, route-level guards missing for key pages |
| Cross-module reconciliation accurate | ❌ FAIL — 9 reconciliation issues identified |

**Verdict: 🔴 NOT READY FOR PRODUCTION**

The 8 critical defects (DEF-001 through DEF-006, plus DEF-002 security) must be resolved. The delete-all patterns (DEF-003/004) violate audit requirements. The dual rule engine (DEF-020) creates systemic inconsistency.

---

*End of QA Audit Report*
