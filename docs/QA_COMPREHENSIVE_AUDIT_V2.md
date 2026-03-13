# Comprehensive QA & Data Integrity Audit Report V2

**Audit Date:** 2026-03-13  
**Auditor Role:** Senior QA Architect, UAT Lead, Credit Operations Tester, Data Integrity Auditor  
**Platform:** Taamul Multi-Lender SME Lending Platform  
**Scope:** Full end-to-end — frontend, backend, workflows, rule engines, formulas, reports, database accuracy, audit trail, storage, permissions, edge cases, failure handling, cross-module consistency

---

## EXECUTIVE SUMMARY

| Metric | Count |
|--------|-------|
| **Total Defects Found** | **67** |
| Critical | 11 |
| High | 19 |
| Medium | 22 |
| Low | 15 |
| **Modules Tested** | 16 |
| **Release Readiness** | ❌ NOT PRODUCTION-READY |

### Top Risk Areas
1. **Security**: Unsafe `Function()` constructor for formula evaluation (RCE vector)
2. **Data Loss**: Destructive delete-then-insert patterns destroy audit history
3. **Access Control**: Assessment case detail page lacks role-based protection
4. **Financial Accuracy**: Hardcoded thresholds bypass configurable rule engine
5. **Cross-Module Consistency**: Multiple turnover calculation paths produce divergent results

---

## SECTION 1 — DEFECT LOG

### CRITICAL DEFECTS (P1)

---

#### DEF-001: Unsafe `Function()` Constructor in Formula Evaluator
- **Module:** Lender Rule Engine (ruleEngineExecutor.ts:152)
- **Scenario:** Admin creates a formula expression containing malicious code
- **Steps:** 1) Navigate to Lender Policy Admin → Formula Builder 2) Enter formula expression with JS code 3) Execute rule engine
- **Expected:** Formula should be safely evaluated using a sandboxed parser
- **Actual:** `Function('"use strict"; return (' + processed + ')')()` executes arbitrary JavaScript. The regex guard `/^[0-9+\-*/().%\s,]+$/` is applied AFTER variable substitution, but variable values could contain chars that bypass it if data is crafted
- **Severity:** Critical
- **Database Ref:** `lender_formula_configs.formula_expression`
- **Suggested Fix:** Replace `Function()` with a proper math expression parser (e.g., `mathjs` or custom recursive descent parser). Never use `eval`/`Function` with user-controlled input.

---

#### DEF-002: Destructive Delete of Lender Execution History
- **Module:** Rule Engine Executor (ruleEngineExecutor.ts:318)
- **Scenario:** Re-running lender rules for a case
- **Steps:** 1) Run lender engine for case X 2) Re-run lender engine for case X
- **Expected:** Previous execution results preserved with `is_active=false` for audit trail
- **Actual:** `await from('lender_execution_results').delete().eq('case_id', caseId)` permanently deletes all prior results. Violates audit requirements.
- **Severity:** Critical
- **Database Ref:** `lender_execution_results`, `lender_rule_result_details` (orphaned when parent deleted)
- **Suggested Fix:** Set `is_active=false` on old results instead of deleting. Add cascade soft-delete for rule_result_details.

---

#### DEF-003: Destructive Delete of Fraud Detection Results
- **Module:** Fraud Detection Engine (fraudDetectionEngine.ts:276)
- **Scenario:** Re-running fraud detection
- **Steps:** 1) Run fraud detection 2) Re-run fraud detection
- **Expected:** Previous fraud results preserved for comparison/audit
- **Actual:** `await from('fraud_detection_results').delete().eq('case_id', caseId)` permanently destroys prior fraud analysis
- **Severity:** Critical
- **Suggested Fix:** Version fraud results or soft-delete

---

#### DEF-004: Destructive Delete of Bank Analysis Results
- **Module:** Banking Risk Analysis Engine (bankingRiskAnalysisEngine.ts:366-377)
- **Scenario:** Re-running bank analysis
- **Actual:** Both `bank_analysis_results` and `bank_analysis_consolidated` rows are deleted and re-inserted
- **Severity:** Critical
- **Suggested Fix:** Version bank analysis results

---

#### DEF-005: Destructive Delete of Lender Match Results
- **Module:** Lender Matching Engine (lenderMatchingEngine.ts:279)
- **Scenario:** Re-running matching engine
- **Actual:** `await from('lender_match_results').delete().eq('case_id', caseId)` destroys ranking history
- **Severity:** Critical

---

#### DEF-006: Destructive Delete of Related Party Transactions
- **Module:** Related Party Service (relatedPartyService.ts:195-197)
- **Scenario:** Re-running RP detection
- **Actual:** All matched transactions deleted before re-detection. If detection fails mid-way, data is lost.
- **Severity:** Critical

---

#### DEF-007: Assessment Case Detail Route Not Role-Protected
- **Module:** App Router (App.tsx:195)
- **Scenario:** Any authenticated user accessing `/assessment-case/:id`
- **Steps:** 1) Log in as basic 'user' role 2) Navigate to `/assessment-case/<any-case-id>`
- **Expected:** Only authorized roles (admin, supervisor, coordinator, case owner) should access
- **Actual:** Route uses generic `<ProtectedRoute>` (auth-only, no role check). RLS on the DB provides some protection, but UI still renders the page shell.
- **Severity:** Critical
- **Suggested Fix:** Use role-based route guard or check access in component

---

#### DEF-008: Eligibility Engine Route Not Role-Protected
- **Module:** App Router (App.tsx:194)
- **Scenario:** Any authenticated user can create assessment cases
- **Expected:** Case creation should be restricted to authorized roles
- **Actual:** `/eligibility-engine` uses generic `<ProtectedRoute>`. Any logged-in user can trigger full analysis pipeline.
- **Severity:** Critical

---

#### DEF-009: No Transaction Atomicity — Partial Failure Leaves Inconsistent State
- **Module:** useEligibilityAssessment.ts (runAnalysis function, ~300 lines)
- **Scenario:** Network failure during the multi-step analysis pipeline
- **Steps:** 1) Upload documents 2) Start analysis 3) Network drops after case creation but before summary save
- **Expected:** Atomic operation — all or nothing
- **Actual:** Case created in DB with status 'analyzing', but no documents/transactions/summaries saved. Case stuck in 'analyzing' forever with no retry mechanism.
- **Severity:** Critical
- **Suggested Fix:** Implement idempotent operations and a recovery mechanism. Track pipeline progress.

---

#### DEF-010: Bank Summaries Only Save First Bank Name
- **Module:** useEligibilityAssessment.ts:361
- **Scenario:** Multiple bank statements from different banks uploaded
- **Steps:** 1) Upload ENBD statement 2) Upload ADCB statement 3) Run analysis
- **Expected:** Each monthly summary tagged with its source bank
- **Actual:** `bank_name: bankFiles[0]?.bankName` — ALL monthly summaries get the first file's bank name regardless of source
- **Severity:** Critical
- **Database Ref:** `assessment_bank_summaries.bank_name`
- **Suggested Fix:** Track bank_name per transaction group, not globally

---

#### DEF-011: Revenue Mismatch Compares Annual vs Total (Wrong Basis)
- **Module:** Fraud Detection Engine (fraudDetectionEngine.ts:572-581)
- **Scenario:** Revenue mismatch check
- **Expected:** Compare comparable figures (both annualized or both total)
- **Actual:** Compares `total_bank_credits` (total over statement period) with `declared_vat_turnover` (annualized). If statement covers 6 months, bank credits ≈ half of annual, causing false positive revenue mismatch.
- **Severity:** Critical
- **Suggested Fix:** Annualize bank credits: `bankCredits / statementMonths * 12`

---

### HIGH DEFECTS (P2)

---

#### DEF-012: No Duplicate Case Detection
- **Module:** Case Creation
- **Scenario:** Same company submitted multiple times
- **Expected:** Duplicate detection by TRN, Trade License, or company name
- **Actual:** No duplicate check exists. Each `runAnalysis()` creates a brand new case.
- **Severity:** High

---

#### DEF-013: No Checksum/Hash Duplicate Document Detection
- **Module:** Document Upload (useEligibilityAssessment.ts:72-73)
- **Scenario:** Same PDF uploaded twice
- **Expected:** Checksum-based duplicate detection
- **Actual:** Duplicate check only compares `fileName` and `totalCredits` in-memory. Same file with different name passes. Re-analysis creates new docs without checking DB.
- **Severity:** High
- **Database Ref:** `assessment_documents.checksum_hash` exists but never populated

---

#### DEF-014: Related Party Flow Summary Has No Foreign Key
- **Module:** Database Schema
- **Scenario:** Data integrity
- **Expected:** `related_party_flow_summary.case_id` should FK to `assessment_cases.id`
- **Actual:** No foreign key constraint. Orphan records possible.
- **Severity:** High

---

#### DEF-015: Related Party Transactions Table Has No FK Enforcement
- **Module:** Database Schema
- **Scenario:** Data integrity
- **Actual:** `related_party_transactions.case_id` has no FK. `related_party_id` has no FK to `case_related_parties.id`.
- **Severity:** High

---

#### DEF-016: Fraud Detection Config Table Has No FK on case_id in Results
- **Module:** Database Schema
- **Scenario:** Data integrity
- **Actual:** `fraud_detection_results.case_id` has no FK to `assessment_cases.id`
- **Severity:** High

---

#### DEF-017: Formula Expression Validation Missing
- **Module:** Lender Policy Admin → Formula Builder
- **Scenario:** Admin enters invalid formula
- **Expected:** Syntax validation before save
- **Actual:** Invalid formulas silently return 0 at execution time (ruleEngineExecutor.ts:156). No error feedback to admin.
- **Severity:** High

---

#### DEF-018: Hardcoded Negative Balance Threshold
- **Module:** Assessment Rule Engine (assessmentRuleEngine.ts:204)
- **Scenario:** Negative balance rule evaluation
- **Expected:** Threshold configurable per lender
- **Actual:** `summary.negativeBalanceDays <= 10` hardcoded. Cannot be customized via rule builder.
- **Severity:** High

---

#### DEF-019: Dual Rule Engine Architecture Creates Inconsistency
- **Module:** Assessment Rule Engine + Lender Rule Engine Executor
- **Scenario:** Lender eligibility evaluation
- **Expected:** Single source of truth for rule evaluation
- **Actual:** Two separate engines run: `AssessmentRuleEngine.evaluateAllLenders()` (hardcoded rules from `onboarding_lenders.eligibility_rules` JSON) AND `RuleEngineExecutor.executeAllLenders()` (database-driven rules from `lender_rule_sets`). Results may conflict.
- **Severity:** High
- **Suggested Fix:** Deprecate the hardcoded AssessmentRuleEngine in favor of the configurable RuleEngineExecutor

---

#### DEF-020: HFS-Specific Rules Always Fail by Default
- **Module:** Assessment Rule Engine (assessmentRuleEngine.ts:243, 258, 272, 288, 302)
- **Scenario:** HFS lender evaluation
- **Expected:** Rules that require analyst input should be deferred, not failed
- **Actual:** Multiple rules hardcoded as `passed: false` with message "Requires verification". These always count as failures, making HFS never eligible unless few other rules fail.
- **Severity:** High

---

#### DEF-021: Matching Engine Sequential N+1 Database Queries
- **Module:** Lender Matching Engine (lenderMatchingEngine.ts:199-213)
- **Scenario:** Running matching for 10+ lenders
- **Expected:** Efficient batch queries
- **Actual:** For each execution result: 1 query for rule count, 1 for product, 1 for lender name = 3N queries. With 10 lenders × 2 products = 60 queries per run.
- **Severity:** High (Performance)

---

#### DEF-022: Rule Engine Sequential Execution
- **Module:** Rule Engine Executor (ruleEngineExecutor.ts:321-350)
- **Scenario:** Executing rules for multiple lenders
- **Actual:** `for (const lender of lenders)` → sequential. Each lender triggers 4+ DB queries. With 5 lenders × 2 products = 40+ sequential queries.
- **Severity:** High (Performance)

---

#### DEF-023: No Error Handling on Bank Summary DB Insert
- **Module:** useEligibilityAssessment.ts:357-376
- **Scenario:** DB insert of bank summaries fails
- **Actual:** No error check on the insert result. Analysis continues with potentially missing data in DB.
- **Severity:** High

---

#### DEF-024: Lender Results Insert Has No Error Handling
- **Module:** useEligibilityAssessment.ts:457-475
- **Actual:** `await supabase.from('assessment_lender_results').insert(...)` — no error check
- **Severity:** High

---

#### DEF-025: Case Status Update Has No Error Handling
- **Module:** useEligibilityAssessment.ts:481-498
- **Actual:** `await supabase.from('assessment_cases').update(...)` — no error check. Case may remain 'analyzing' if update fails.
- **Severity:** High

---

#### DEF-026: `is_active` Flag Not Used in Lender Execution Results
- **Module:** Rule Engine Executor
- **Scenario:** Querying lender results
- **Expected:** Filter by `is_active=true` for current results
- **Actual:** Results are deleted and re-inserted, so `is_active` column exists but is never set to `false`. The column serves no purpose.
- **Severity:** High

---

#### DEF-027: Assessment Case Update Calculates total_bank_credits Incorrectly
- **Module:** useEligibilityAssessment.ts:483
- **Scenario:** Storing case summary
- **Expected:** `total_bank_credits` = actual sum of all credits
- **Actual:** `total_bank_credits: combined.avgMonthlyCredit * combined.statementMonthsCovered` — this is a reconstruction from averages, not the actual total. Rounding errors accumulate.
- **Severity:** High

---

#### DEF-028: No Pagination on Transaction Queries
- **Module:** Fraud Detection Engine (fraudDetectionEngine.ts:586-589)
- **Scenario:** Case with >1000 bank transactions
- **Expected:** Handle Supabase's default 1000-row limit
- **Actual:** `supabase.from('assessment_bank_transactions').select('*').eq('case_id', caseId)` — no `.range()` or pagination. Cases with >1000 transactions will have incomplete fraud analysis.
- **Severity:** High

---

#### DEF-029: No Pagination on Related Party Transaction Fetch
- **Module:** Related Party Service (relatedPartyService.ts:176-179)
- **Severity:** High (same 1000-row limit issue)

---

#### DEF-030: No Pagination on Rule Engine Normalized Fields Query
- **Module:** Rule Engine Executor (ruleEngineExecutor.ts:18)
- **Severity:** High (bank summaries limited to 1000 rows)

---

### MEDIUM DEFECTS (P3)

---

#### DEF-031: Circular Transaction Detection False Positives
- **Module:** Fraud Detection Engine (fraudDetectionEngine.ts:327-328)
- **Scenario:** Normal business with credits and debits on same day
- **Expected:** Only flag genuinely suspicious patterns
- **Actual:** Any credit followed by a debit within `windowDays` where amounts are within 5% is flagged. Normal business (e.g., receiving payment and paying supplier same day) generates false positives.
- **Severity:** Medium

---

#### DEF-032: Round Tripping Detection Overly Sensitive
- **Module:** Fraud Detection Engine (fraudDetectionEngine.ts:361-363)
- **Scenario:** Regular vendor relationship
- **Actual:** Any counterparty with ≥4 transactions where credits/debits ratio >70% is flagged. Regular vendor relationships (buy materials, receive refunds) would trigger.
- **Severity:** Medium

---

#### DEF-033: Window Dressing Month Calculation Bug
- **Module:** Fraud Detection Engine (fraudDetectionEngine.ts:428-429)
- **Scenario:** Month boundary calculation
- **Actual:** `const lastDay = new Date(y, m, 0).getDate()` is correct, but `const cutoff = new Date(y, m - 1, lastDay - periodDays + 1)` uses `m - 1` which is already 0-indexed from split. For month "2026-01", m=1, so `m-1=0` (January). This is correct. However, `d.getMonth() === m - 1` at line 437 compares transaction month (0-indexed) with `m-1`, which for "01" would be 0. This works but is fragile.
- **Severity:** Medium

---

#### DEF-034: VAT Monthly Sales Calculation Discrepancy
- **Module:** Rule Engine Executor (ruleEngineExecutor.ts:39) vs Assessment Analysis Engine
- **Scenario:** VAT monthly sales used in lender rules
- **Expected:** Consistent calculation
- **Actual:** `vat_monthly_sales: (declaredVatTurnover) / Math.max((vat_periods_covered || 1) * 3, 1)` assumes all VAT periods are quarterly (×3). But actual periods could be monthly or annual.
- **Severity:** Medium

---

#### DEF-035: Missing `account_number_masked` in Assessment Case Schema
- **Module:** Fraud Detection Engine
- **Actual:** `BankTxn.account_number_masked` used in detection but field is nullable and inconsistently populated from extraction
- **Severity:** Medium

---

#### DEF-036: Counterparty Extraction Too Simplistic
- **Module:** Fraud Detection Engine (fraudDetectionEngine.ts:598-603)
- **Actual:** Strips common prefixes and takes first 40 chars. "TRF FROM ABC TRADING LLC" and "TRF TO ABC TRADING LLC" both resolve to "abc trading llc" — good. But "SALARY TRANSFER" becomes "transfer" — matches incorrectly across unrelated transactions.
- **Severity:** Medium

---

#### DEF-037: Structured Transaction Detection Ignores Time Proximity
- **Module:** Fraud Detection Engine (fraudDetectionEngine.ts:465-488)
- **Scenario:** Recurring legitimate payments (e.g., monthly rent)
- **Expected:** Only flag same-day or near-simultaneous splits
- **Actual:** Counts ALL transactions with identical amounts across the entire period. Monthly rent of AED 5,000 for 12 months would be flagged as "structured" (12 ≥ threshold of 5).
- **Severity:** Medium

---

#### DEF-038: Employee Count Estimation Hardcoded
- **Module:** Banking Risk Analysis Engine (bankingRiskAnalysisEngine.ts:160)
- **Actual:** `Math.round(monthlySalary / 5000)` assumes AED 5,000 average salary. Unrealistic for many sectors.
- **Severity:** Medium

---

#### DEF-039: VAT Turnover Analysis Doesn't Handle Annual Filers
- **Module:** Assessment Analysis Engine (assessmentAnalysisEngine.ts:95-99)
- **Actual:** Default period assumed as 3 months (quarterly). Monthly filers or annual filers would get wrong per-month calculation.
- **Severity:** Medium

---

#### DEF-040: Cash Keyword Detection Overly Broad
- **Module:** Banking Risk Analysis Engine (bankingRiskAnalysisEngine.ts:89)
- **Actual:** `CASH_KW = ['cash deposit', 'cdm', 'atm cash', 'cash']` — the keyword `'cash'` alone matches "CASHBACK REWARD", "CASHIER CHEQUE", "DISCOUNT CASH". Inflates cash deposit ratio.
- **Severity:** Medium

---

#### DEF-041: Missing `updated_by` Tracking
- **Module:** Multiple tables
- **Scenario:** Analyst modifies data
- **Expected:** Track who last modified each record
- **Actual:** Most tables have `updated_at` but no `updated_by` field. Cannot audit who made changes.
- **Severity:** Medium

---

#### DEF-042: Fraud Risk Score Can Go Below 0
- **Module:** Fraud Detection Engine (fraudDetectionEngine.ts:267-268)
- **Actual:** Code has `frs = Math.max(0, Math.min(100, frs))` — this is correct. However, if ALL 10 modules trigger, total deductions = 10+15+15+10+10+5+10+10+5+10 = 100. Score = 0. This means the "deduction" model has no room for additional severity weighting.
- **Severity:** Medium (Design limitation)

---

#### DEF-043: No Fraud Detection Config Admin UI
- **Module:** Admin Panel
- **Scenario:** Admin wants to adjust fraud thresholds
- **Expected:** Config UI in Lender Policy Admin or dedicated page
- **Actual:** `fraud_detection_config` table exists but no UI to manage it. Changes require direct DB access.
- **Severity:** Medium

---

#### DEF-044: Decision Matrix Empty Fallback Logic
- **Module:** Rule Engine Executor (ruleEngineExecutor.ts:288-293)
- **Scenario:** No decision matrix configured for a lender
- **Actual:** Hardcoded fallback: `if (majorFails === 0 && minorFails <= 2) → conditionally_eligible`. This bypasses the configurable system.
- **Severity:** Medium

---

#### DEF-045: Related Party Ratio Inconsistent Units
- **Module:** Rule Engine Executor (ruleEngineExecutor.ts:67)
- **Scenario:** Using RP ratio in lender rules
- **Actual:** `related_party_ratio: Math.round(rpRatio * 10000) / 100` converts decimal to percentage (e.g., 0.15 → 15). But `related_party_flow_ratio: rpRatio` keeps it as decimal. Lender rules must know which field to use, creating confusion.
- **Severity:** Medium

---

#### DEF-046: No Validation on Case Status Transitions
- **Module:** Case Service (caseService.ts)
- **Scenario:** Status changes
- **Expected:** Enforce valid transitions (Draft → Analysis → Review → Completed)
- **Actual:** `updateStatus()` accepts any status string. Can go from "Completed" back to "Draft".
- **Severity:** Medium

---

#### DEF-047: EMI Keyword Detection Catches Non-EMI Transactions
- **Module:** Banking Risk Analysis Engine (bankingRiskAnalysisEngine.ts:87)
- **Actual:** `EMI_KW = ['loan', 'emi', 'installment', 'finance', ...]` — "FINANCE DEPARTMENT PAYMENT" or "LOAN APPLICATION FEE" would be incorrectly counted as EMI.
- **Severity:** Medium

---

#### DEF-048: Artificial Turnover Detection Bug — Checks Credits for Debits
- **Module:** Fraud Detection Engine (fraudDetectionEngine.ts:400-404)
- **Actual:** `const nextDebits = sorted.filter(dt => dt.debit > 0 ...)` — but `sorted` only contains credits (`t.credit > 0` filter at line 378). So `nextDebits` will always be empty. The entire artificial turnover module never flags anything.
- **Severity:** Medium → **HIGH** (Module non-functional)

---

#### DEF-049: Onboarding Route Unprotected for Role
- **Module:** App Router (App.tsx:190)
- **Actual:** `/onboarding` uses `<ProtectedRoute>` — any authenticated user can start onboarding
- **Severity:** Medium

---

#### DEF-050: Missing Fraud Detection Trigger for Existing Cases
- **Module:** Assessment Case Detail
- **Scenario:** Analyst opens old case without fraud detection
- **Expected:** Button to trigger fraud detection
- **Actual:** Fraud detection only runs automatically during initial analysis. No way to run it on demand from the case detail page.
- **Severity:** Medium

---

#### DEF-051: ExcelJS Report Doesn't Include Flagged Transactions
- **Module:** Combined Summary Export (CombinedSummary.tsx:88-130)
- **Actual:** Fraud sheet only includes flag counts and score. Does not include the `flagged_transactions_json` examples, which are the most useful for analysts.
- **Severity:** Medium

---

#### DEF-052: No Report Versioning for Financial Summary Export
- **Module:** CombinedSummary.tsx
- **Actual:** Uses `saveAndDownloadReport` which versions correctly, but the version is derived from existing reports in DB. If the function fails after upload but before record creation, file exists in storage but no DB record.
- **Severity:** Medium

---

### LOW DEFECTS (P4)

---

#### DEF-053: `(supabase as any).from(table)` Pattern Bypasses Type Safety
- **Module:** Multiple services (lenderMatchingEngine.ts, fraudDetectionEngine.ts, ruleEngineExecutor.ts)
- **Severity:** Low (Code quality)

---

#### DEF-054: Month-End Balance Trend Uses Last Transaction, Not Actual Month-End
- **Module:** Banking Risk Analysis Engine (bankingRiskAnalysisEngine.ts:199)
- **Actual:** `monthEndBalances.push(mt[mt.length - 1].balance)` — assumes transactions are sorted by date within month. Not guaranteed.
- **Severity:** Low

---

#### DEF-055: Salary Consistency Check Missing Months
- **Module:** Banking Risk Analysis Engine
- **Actual:** `salaryByMonth` only has entries for months with salary transactions. Months with zero salary are not counted as inconsistent.
- **Severity:** Low

---

#### DEF-056: Tab Grid Assumes Exactly 9 Tabs
- **Module:** AssessmentCaseDetail.tsx:115
- **Actual:** `grid-cols-9` hardcoded. Adding/removing tabs requires manual grid update.
- **Severity:** Low (Maintainability)

---

#### DEF-057: `as any` Type Assertions on DB Operations
- **Module:** Multiple files (permanentStorageService.ts, useEligibilityAssessment.ts)
- **Actual:** Extensive use of `as any` to bypass TypeScript. Hides potential schema mismatches.
- **Severity:** Low

---

#### DEF-058: Console.error Without User Feedback
- **Module:** Multiple catch blocks
- **Actual:** `console.error('Related party detection error:', rpError)` at line 404 of useEligibilityAssessment.ts — error swallowed, user not notified
- **Severity:** Low

---

#### DEF-059: Missing Loading States for Tab Content
- **Module:** AssessmentCaseDetail tabs
- **Actual:** Each tab independently queries data but the main page doesn't communicate loading to tabs. Tab may show stale or empty data briefly.
- **Severity:** Low

---

#### DEF-060: `risk_flags_json` Stored as Stringified JSON
- **Module:** Fraud Detection Engine (fraudDetectionEngine.ts:301-302)
- **Actual:** `risk_flags_json: JSON.stringify(riskFlags)` — column is `jsonb`, so this double-encodes as a JSON string within JSONB. Should pass the array directly.
- **Severity:** Low → **MEDIUM** (Causes parsing issues in UI if not handled)

---

#### DEF-061: Old Turnover Calculator Uses Credits+Debits
- **Module:** TurnoverCalculator.calculateOldTurnover (turnoverCalculator.ts:223)
- **Actual:** `return totalCredits + totalDebits` — labeled as "old (incorrect) turnover" but still exists. Could be accidentally used.
- **Severity:** Low

---

#### DEF-062: VAT Period Count vs Coverage Mismatch
- **Module:** Assessment Analysis Engine
- **Actual:** `vatPeriodsCovered` counts number of VAT files, not actual quarters covered. 2 VAT files covering Q1-Q2 counts as 2, but the system treats it as 2 × 3 = 6 months for annualization.
- **Severity:** Low

---

#### DEF-063: No Timeout on PDF Parsing
- **Module:** useEligibilityAssessment.ts:54
- **Actual:** `await PDFParser.parsePDF(file)` has no timeout. Large/corrupted PDFs could hang indefinitely.
- **Severity:** Low

---

#### DEF-064: Missing Cascade Delete on Related Party
- **Module:** Related Party Service (relatedPartyService.ts:140-148)
- **Actual:** Manual cascade — deletes `related_party_transactions` then `case_related_parties`. If first succeeds and second fails, orphaned transaction records without parent.
- **Severity:** Low

---

#### DEF-065: Assessment Cases Missing user_id for RLS
- **Module:** useEligibilityAssessment.ts:223-225
- **Actual:** `user_id: user?.id || null` — if auth fails, case created with null user_id. RLS policy allows access if `user_id = auth.uid()` which wouldn't match null.
- **Severity:** Low

---

#### DEF-066: Rapid Outflow Detection — Hours Threshold Applied to Date-Only Data
- **Module:** Fraud Detection Engine (fraudDetectionEngine.ts:490-522)
- **Actual:** `rapid_outflow_hours: 48` but `txn_date` is a DATE field (no time). All same-day transactions have 0ms difference, and next-day = 86400000ms. The hours granularity is meaningless with date-only data.
- **Severity:** Low

---

#### DEF-067: Missing Index Recommendations
- **Module:** Database
- **Actual:** High-frequency queries on `assessment_bank_transactions.case_id`, `related_party_transactions.case_id`, `fraud_detection_results.case_id` would benefit from indexes. Current schema doesn't specify.
- **Severity:** Low (Performance)

---

## SECTION 2 — CROSS-MODULE RECONCILIATION FINDINGS

### Finding R-001: Three Divergent Turnover Calculations
| Module | Calculation | Location |
|--------|-------------|----------|
| TurnoverCalculator | Credits - Cash - Sister | turnoverCalculator.ts:143 |
| AssessmentAnalysisEngine | Credits / months × 12 | assessmentAnalysisEngine.ts:150 |
| RuleEngineExecutor | normalized_turnover from case | ruleEngineExecutor.ts:49 |

**Impact:** Lender decisions may use different turnover basis depending on which engine processes first.

### Finding R-002: Bank Analysis vs Combined Summary Inconsistency
- `BankingRiskAnalysisEngine` saves to `bank_analysis_results` with detailed per-account metrics
- `AssessmentAnalysisEngine` generates `CombinedFinancialSummary` independently from raw transactions
- These two analyses are never reconciled. Cash deposit ratio in bank_analysis may differ from assessment summary.

### Finding R-003: Assessment Lender Results vs Execution Results
- `assessment_lender_results` table populated by `AssessmentRuleEngine` (hardcoded rules)
- `lender_execution_results` table populated by `RuleEngineExecutor` (configurable rules)
- Both exist for the same case. UI shows one, matching engine uses the other.

### Finding R-004: Fraud Detection Uses Case-Level Data, Not Summary-Level
- Revenue mismatch in fraud engine reads from `assessment_cases.total_bank_credits` and `declared_vat_turnover`
- These are stored during initial analysis and may not reflect analyst adjustments made via the financial summary
- Result: Fraud flags may be based on stale data

### Finding R-005: Report Version vs Summary Version Tracking
- `case_reports.based_on_summary_id` exists but is optional and not always populated during export
- Cannot reliably trace which summary version a report was generated from

---

## SECTION 3 — PERMISSION TESTING RESULTS

| Action | super_admin | admin | supervisor | coordinator | user | Expected | Status |
|--------|-------------|-------|------------|-------------|------|----------|--------|
| Create assessment case | ✅ | ✅ | ✅ | ✅ | ✅ | Restricted | ❌ FAIL |
| View assessment case | ✅ | ✅ | ✅ | ✅ | ✅ (own) | ✅ | ✅ PASS |
| Edit lender rules | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ PASS |
| Access /lender-policy-admin | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ PASS |
| Delete case | ❌ | ❌ | ❌ | ❌ | ❌ | super_admin only | ⚠️ No delete UI |
| Access /eligibility-engine | ✅ | ✅ | ✅ | ✅ | ✅ | Restricted | ❌ FAIL |
| View fraud results | ✅ | ✅ | ✅ | ✅ | ✅ (own) | ✅ | ✅ PASS (RLS) |
| Modify fraud config | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ⚠️ No UI |

---

## SECTION 4 — AUDIT TRAIL COMPLETENESS

| Action | Logged? | Table | Notes |
|--------|---------|-------|-------|
| Case creation | ✅ | case_activity_log | |
| Document upload | ✅ | case_activity_log | |
| Extraction run | ✅ | case_activity_log | |
| Bank analysis | ✅ | case_activity_log | |
| Related party detection | ✅ | case_activity_log | |
| Fraud detection | ✅ | case_activity_log | |
| Lender engine run | ✅ | case_activity_log | |
| AI matching | ✅ | case_activity_log | |
| Summary creation | ✅ | case_activity_log | |
| Summary approval | ✅ | case_activity_log | |
| Analyst adjustment | ❌ | — | Not logged |
| Report generation | ✅ | case_activity_log | |
| Policy change | ✅ | lender_policy_audit_log | Separate table |
| Case status change | ✅ | case_activity_log | |
| Re-run of analysis | ❌ | — | Old data deleted, no "re-run" log |
| Manual transaction exclusion | ❌ | — | Not logged |
| VAT value correction | ❌ | — | Not logged |

---

## SECTION 5 — DATABASE INTEGRITY FINDINGS

| Check | Status | Details |
|-------|--------|---------|
| FK constraints on core tables | ⚠️ | `fraud_detection_results`, `related_party_flow_summary`, `related_party_transactions` missing FKs |
| Orphan records possible | ❌ | Delete cascades are manual in code, not DB-enforced |
| `is_active` flags consistent | ❌ | `lender_execution_results.is_active` never toggled |
| Version numbers sequential | ✅ | `combined_financial_summary.summary_version` increments correctly |
| `created_by` populated | ⚠️ | Sometimes null when auth.getUser() returns null |
| Timestamps correct | ✅ | Default `now()` works |
| 1000-row query limit | ❌ | Multiple services don't paginate |

---

## SECTION 6 — PERFORMANCE RISK AREAS

| Scenario | Risk | Module |
|----------|------|--------|
| Case with >1000 transactions | Data truncation | Fraud, RP, Rule Engine |
| 10+ lenders × 2 products | 60+ sequential queries | Matching Engine |
| Large PDF (>50 pages) | UI hang | PDF Parser (no timeout) |
| Re-running analysis | Delete + Insert instead of Update | All analysis engines |
| Multiple concurrent analyses | Race conditions | No locking mechanism |

---

## SECTION 7 — RECOMMENDATIONS

### Immediate (Pre-Production)
1. **Replace `Function()` with safe expression parser** (DEF-001)
2. **Implement soft-delete pattern** for all analysis results (DEF-002 through DEF-006)
3. **Add role guards** to eligibility engine and assessment detail routes (DEF-007, DEF-008)
4. **Fix artificial turnover detection** — module is completely non-functional (DEF-048)
5. **Add pagination** to all transaction queries (DEF-028-030)
6. **Fix revenue mismatch comparison basis** (DEF-011)
7. **Fix bank name assignment** for multi-bank summaries (DEF-010)

### Short-Term
8. Deprecate `AssessmentRuleEngine` in favor of configurable `RuleEngineExecutor`
9. Add fraud config admin UI
10. Fix `risk_flags_json` double-encoding (DEF-060)
11. Add transaction atomicity / pipeline recovery
12. Add duplicate case detection by TRN/TL/company name
13. Reduce false positives in fraud detection modules
14. Add `updated_by` tracking to key tables

### Long-Term
15. Implement proper audit trail for analyst adjustments
16. Add database-level FK constraints for all case-related tables
17. Optimize matching engine with batch queries
18. Add comprehensive integration test suite
19. Implement idempotent analysis pipeline with status tracking

---

## FINAL RELEASE READINESS ASSESSMENT

| Criterion | Status |
|-----------|--------|
| Core workflows functional | ⚠️ Partial — artificial turnover module broken |
| Rules execute correctly | ⚠️ Dual engine conflict |
| Formulas produce correct outputs | ❌ Unsafe evaluation, no validation |
| Lender decisions match policy | ⚠️ Hardcoded fallbacks |
| Reports match database | ⚠️ Missing flagged transactions |
| Stored data matches UI | ✅ Generally consistent |
| All versions traceable | ❌ Destructive deletes |
| Audit trails complete | ❌ 4 major gaps |
| Permissions correct | ❌ 2 unprotected routes |
| Cross-module reconciliation | ❌ 5 inconsistencies found |

### **VERDICT: NOT PRODUCTION-READY**

**11 critical defects must be resolved before any production deployment.**

---

*Report generated by automated deep code analysis. Manual UAT testing recommended to validate edge cases in live environment.*
