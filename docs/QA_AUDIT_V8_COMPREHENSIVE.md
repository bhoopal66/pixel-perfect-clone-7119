# QA Audit Report V8 — Comprehensive Application Review

**Date:** 2026-03-14  
**Auditor:** Senior QA / UAT Specialist  
**Scope:** Full end-to-end application testing — no database changes  
**Test Environment:** Preview (Lovable Cloud)  
**Build Status:** ✅ Compiling successfully  
**Test Suite:** 10 passed / 7 failed (17 total)

---

## EXECUTIVE SUMMARY

The application is **functionally solid** across core workflows. The onboarding wizard, eligibility engine, lender matching, RBAC, and navigation all operate correctly. However, several **medium-severity defects** exist in data persistence, component testing, and one critical logic bug in the submission flow. The app is **conditionally release-ready** pending fixes for the issues below.

---

## DEFECT LOG

### QA-V8-001 — Onboarding Submit Uses Simulated Delay Instead of Real Persistence

| Field | Value |
|---|---|
| **Module** | Business Onboarding |
| **Workflow** | Step 6 → Submit |
| **Scenario** | User completes all 6 steps and clicks Submit |
| **Expected** | `submitApplication()` from OnboardingContext is called, which saves all data to database and updates case status to `in_process` |
| **Actual** | `BusinessOnboarding.tsx` line 59 uses `await new Promise(resolve => setTimeout(resolve, 2000))` — a fake 2-second delay. The actual `submitApplication` / `submitCase` from the context/persistence hook is **never called**. Data may be lost. |
| **Severity** | **Critical** |
| **Priority** | P1 |
| **File** | `src/pages/BusinessOnboarding.tsx` lines 50-66 |
| **Fix** | Replace simulated submission with `await submitApplication()` from the context. Remove `resetForm()` before confirming DB success. |

---

### QA-V8-002 — Owner Reorder (moveOwner) Does Not Actually Reorder

| Field | Value |
|---|---|
| **Module** | Owner Details (Step 2) |
| **Workflow** | Click up/down arrow on an owner card |
| **Expected** | Owners swap positions in the array |
| **Actual** | `moveOwner` in `Step2OwnerDetails.tsx` splices a local copy but then calls `updateOwner(owner.id, { ...owner })` for each entry — which only triggers field-level updates on existing IDs without changing array order. The context's `updateOwner` matches by `id` and merges, it does not reposition. |
| **Severity** | **Medium** |
| **Priority** | P2 |
| **File** | `src/components/onboarding/Step2OwnerDetails.tsx` lines 16-25 |
| **Fix** | Add a `reorderOwners(newOwners: OwnerDetails[])` method to the OnboardingContext that replaces the entire owners array. |

---

### QA-V8-003 — `(owner as any).role` Type Cast in Service Layer

| Field | Value |
|---|---|
| **Module** | Onboarding Service |
| **Workflow** | Loading saved owners from database |
| **Expected** | `role`, `address`, `is_signatory`, `is_ubo` fields read from typed response |
| **Actual** | `getOwners()` in `onboardingService.ts` uses `(owner as any).role`, `(owner as any).address`, etc. — bypassing TypeScript safety. If the auto-generated types haven't synced with the migration, these fields silently return `undefined`. |
| **Severity** | **Medium** |
| **Priority** | P2 |
| **File** | `src/services/onboardingService.ts` lines 241-253 |
| **Fix** | After the migration is confirmed applied, the auto-generated types file should include these columns. Remove `as any` casts once types are synced. |

---

### QA-V8-004 — Unit Tests Fail: Step2OwnerDetails Needs AuthProvider

| Field | Value |
|---|---|
| **Module** | Testing |
| **Workflow** | `npm test` / `vitest run` |
| **Expected** | All 17 tests pass |
| **Actual** | 5 Step2OwnerDetails tests fail with `useAuth must be used within an AuthProvider`. 2 OwnerCard tests fail (duplicate text query + delete button selector). |
| **Severity** | **Medium** |
| **Priority** | P3 |
| **File** | `src/components/onboarding/Step2OwnerDetails.test.tsx`, `OwnerCard.test.tsx` |
| **Fix** | Mock `useAuth` or wrap in `AuthProvider`. Fix `getByText("Managing Partner")` → `getAllByText`. Fix delete button selector to match actual DOM. |

---

### QA-V8-005 — Duplicate Detection Ignores Case Sensitivity

| Field | Value |
|---|---|
| **Module** | Owner Details (Step 2) |
| **Workflow** | Enter "784-1234" for Owner 1 and "784-1234 " (trailing space) for Owner 2 |
| **Expected** | Duplicate warning shown |
| **Actual** | The `.trim()` is applied, but case comparison is exact — "GB123456" vs "gb123456" would not trigger a warning. Emirates IDs are fine (numeric), but passport numbers are case-mixed in practice. |
| **Severity** | **Low** |
| **Priority** | P3 |
| **Fix** | Normalize to uppercase before comparison: `o.passportNumber.trim().toUpperCase()` |

---

### QA-V8-006 — Onboarding Step Persisted in localStorage Only

| Field | Value |
|---|---|
| **Module** | Business Onboarding |
| **Workflow** | User is on Step 4, clears browser data, reopens app |
| **Expected** | User returns to last saved step |
| **Actual** | `currentStep` is stored in `localStorage` only (`STEP_KEY`). If user switches browsers or clears storage, they restart at Step 1 even though data is saved in the database. Form data loads correctly but step position is lost. |
| **Severity** | **Low** |
| **Priority** | P4 |
| **Fix** | Store `current_step` in the `onboarding_cases` table alongside existing case data. |

---

### QA-V8-007 — Eligibility Engine: No Guard Against Re-running Analysis on Empty Data

| Field | Value |
|---|---|
| **Module** | Eligibility Engine |
| **Workflow** | User navigates to Bank Analysis tab before uploading any files |
| **Expected** | Clear message: "Upload documents first" or tab is disabled |
| **Actual** | Tabs with `requiresAnalysis: true` are visually accessible. The tab content shows empty states, but there's no explicit block preventing a user from clicking "Run Analysis" type actions with no data. The `hasAnalysis` check (`monthlySummaries.length > 0 || caseId !== null`) may evaluate true if a caseId exists from a previous session but no files are uploaded yet. |
| **Severity** | **Low** |
| **Priority** | P3 |
| **Fix** | Disable analysis-dependent tabs when `bankFiles.length === 0`. |

---

### QA-V8-008 — `RuleEngineExecutor` and `LenderMatchingEngine` Use Untyped `from()` Wrapper

| Field | Value |
|---|---|
| **Module** | Rule Engine / Lender Matching |
| **Workflow** | All lender rule execution |
| **Expected** | Typed Supabase queries |
| **Actual** | Both files use `const from = (table: string) => (supabase as any).from(table)` — bypassing all type safety. Any table name typo or schema mismatch would fail silently at runtime. |
| **Severity** | **Medium** |
| **Priority** | P3 |
| **Fix** | Use typed `.from('table_name')` directly from the Supabase client, which provides compile-time checking via the generated types. |

---

## WORKFLOW SMOOTHNESS SUMMARY

| Workflow | Status | Notes |
|---|---|---|
| Login / Auth flow | ✅ Smooth | Email + password, role-based redirects work |
| Route protection (RBAC) | ✅ Smooth | 5-tier hierarchy enforced correctly |
| Home / Dashboard | ✅ Smooth | Role-aware cards, navigation links work |
| Onboarding Step 1 (Business) | ✅ Smooth | All validations fire correctly |
| Onboarding Step 2 (Owners) | ⚠️ Minor | Reorder doesn't persist order (QA-V8-002) |
| Onboarding Step 3 (Banking) | ✅ Smooth | Conditional fields (VAT, POS) toggle correctly |
| Onboarding Step 4 (Loan) | ✅ Smooth | All fields validated |
| Onboarding Step 5 (Documents) | ✅ Smooth | Upload to storage works, file list refreshes |
| Onboarding Step 6 (Review) | ⚠️ Critical | Submit doesn't persist (QA-V8-001) |
| Client Cases list | ✅ Smooth | Cases load with company name + status |
| Eligibility Engine Upload | ✅ Smooth | PDF parsing, duplicate detection works |
| Eligibility Extraction | ✅ Smooth | Transactions displayed with currency badges |
| Eligibility Bank Analysis | ✅ Smooth | Monthly summaries, charts render |
| Eligibility VAT Analysis | ✅ Smooth | Period extraction and comparison works |
| Eligibility Combined Summary | ✅ Smooth | Multi-currency flag displayed |
| Eligibility Lender Results | ✅ Smooth | Rule-by-rule pass/fail display |
| Lender Matching / Funding | ✅ Smooth | Scoring, ranking, recommendation |
| Manual Review | ✅ Smooth | Analyst overrides with audit trail |
| Assessment Case Detail (7 tabs) | ✅ Smooth | History, documents, timeline all load |
| Admin Dashboard | ✅ Smooth | Metrics, charts, lender performance |
| Supervisor Dashboard | ✅ Smooth | Pipeline, SLA monitoring |
| User Management | ✅ Smooth | Role assignment, user listing |
| Agent Management | ✅ Smooth | CRUD operations work |
| Lender Policy Admin | ✅ Smooth | Rule builder, formula config, decision matrix |
| Theme Toggle (Dark/Light) | ✅ Smooth | Consistent across all pages |
| Navigation (Back buttons) | ✅ Smooth | All return links work |

---

## MODULES WORKING WELL

1. **Authentication & RBAC** — 5-tier role hierarchy with RPC-based checks is robust and correctly implemented
2. **Eligibility Assessment Engine** — 10-tab workflow processes bank statements and VAT returns accurately
3. **Lender Rule Engine** — Database-driven rules with 17+ operators, decision matrix, formula configs
4. **Auto Lender Matching** — Weighted scoring with configurable parameters
5. **Multi-currency Support** — Account-level currency with manual FX conversion
6. **Document Upload** — Storage integration with file management
7. **Debounced Auto-save** — Form data persists via 1-second debounce to database
8. **Banking Risk Analysis** — Comprehensive metrics (EMI, salary, cash, FX, related party)

---

## MODULES WITH FRICTION

1. **Onboarding Submission** — Simulated, not real (QA-V8-001)
2. **Owner Reordering** — Visual only, doesn't persist order (QA-V8-002)
3. **Test Suite** — 41% failure rate due to missing provider wrappers (QA-V8-004)

---

## BROKEN TRANSITIONS

- **None critical.** All page-to-page navigation works. The only "broken" transition is the submission flow not actually persisting (QA-V8-001).

---

## DATA DISPLAY / SAVE ISSUES

- Debounced auto-save works correctly for all form fields
- Loaded data from database displays correctly on reopen
- Owner `role`/`address`/`isSignatory`/`isUbo` use `as any` cast (QA-V8-003) — works if migration is applied but unsafe
- `declarationConfirmed` and `authorizationConfirmed` are NOT persisted to database — they reset on page reload

---

## RULE EXECUTION ISSUES

- Rule engine executes correctly against all configured lenders
- Decision matrix produces correct 4-tier outcomes
- Formula-based limit calculations work
- No issues found with rule operator evaluation
- Only concern: untyped `from()` wrapper (QA-V8-008)

---

## REPORT ISSUES

- Report generation works for bank analysis and combined summaries
- Excel export service functional
- Case export service functional
- No issues with report retrieval from `case-reports` storage bucket

---

## UX IMPROVEMENT OBSERVATIONS

1. **Step indicator** should highlight completed steps vs just current step
2. **Owner card** could benefit from collapse/expand for long forms with many partners
3. **Shareholding validation** (100% total) shows warning but doesn't prevent advancement — the `isStepValid` check blocks Next, which is correct, but user might not understand why Next is disabled
4. **Currency conversion** panel could show a preview of converted totals before applying
5. **Loading states** are consistent (spinner) but lack skeleton screens for content areas

---

## RELEASE READINESS OPINION

| Criteria | Status |
|---|---|
| Core workflows functional | ✅ Yes |
| Data integrity | ⚠️ Conditional (QA-V8-001 must be fixed) |
| Security (RBAC/RLS) | ✅ Yes |
| Error handling | ✅ Adequate |
| Test coverage | ⚠️ Low (needs AuthProvider mocks) |
| Performance | ✅ Smooth |
| UI consistency | ✅ Good |

### Verdict: **CONDITIONALLY READY**

**Must fix before release:**
- QA-V8-001 (submission not persisting — Critical)

**Should fix:**
- QA-V8-002 (owner reorder)
- QA-V8-003 (type safety)

**Can defer:**
- QA-V8-004 through QA-V8-008

---

*End of QA Audit Report V8*
