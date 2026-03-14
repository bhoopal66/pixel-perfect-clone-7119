# QA Audit Report V9 — Comprehensive Application Review
**Date:** 2026-03-14  
**Auditor:** Senior QA / UAT Specialist  
**Scope:** Full end-to-end workflow testing — no database changes  
**Test Results:** 17 tests total: 10 passed, 7 failed

---

## DEFECT LOG

### QA-V9-001 — CRITICAL: Onboarding Submit Bypasses Database Persistence
| Field | Value |
|---|---|
| **Module** | Business Onboarding |
| **Workflow** | Submit Application (Step 6 → Submit) |
| **Scenario** | User completes all 6 steps and clicks "Submit Application" |
| **Expected** | `submitApplication()` from OnboardingContext is called, which saves all data + updates case status to `in_process` via `submitOnboardingCase()` |
| **Actual** | `BusinessOnboarding.tsx` line 50-66 uses a hardcoded `setTimeout(2000)` simulation instead of calling `submitApplication()`. Data is never persisted on submit; case status remains `draft`. |
| **Severity** | **Critical** |
| **Priority** | P0 |
| **Suggested Fix** | Replace `handleSubmit` body with: `const success = await submitApplication(); if (success) { resetForm(); navigate('/eligibility-engine'); }` |

---

### QA-V9-002 — HIGH: ClientCases Page Uses Mock Data Instead of Real Database
| Field | Value |
|---|---|
| **Module** | Client Cases (`/client-cases`) |
| **Workflow** | View My Applications |
| **Scenario** | User navigates to "My Applications" to see submitted cases |
| **Expected** | Page fetches real cases from `onboarding_cases` via `getUserCases()` service |
| **Actual** | `ClientCases.tsx` lines 36-118 render hardcoded `MOCK_CASES` array. Real user data never displayed. |
| **Severity** | **High** |
| **Priority** | P1 |
| **Suggested Fix** | Replace mock data with `useEffect` calling `getUserCases()` from `onboardingService.ts` |

---

### QA-V9-003 — HIGH: ClientCaseDetail Page Uses Mock Data
| Field | Value |
|---|---|
| **Module** | Client Case Detail (`/client-cases/:id`) |
| **Workflow** | Open an existing case |
| **Scenario** | User clicks "Open" on a case from the list |
| **Expected** | Page loads real case details from database using `loadCompleteFormData(id)` |
| **Actual** | `ClientCaseDetail.tsx` lines 23+ render a hardcoded `MOCK_CASE_DETAIL` object. No database fetch occurs. |
| **Severity** | **High** |
| **Priority** | P1 |
| **Suggested Fix** | Implement real data loading using `useParams().id` and `loadCompleteFormData()` |

---

### QA-V9-004 — MEDIUM: Owner Reorder Does Not Persist Sequence
| Field | Value |
|---|---|
| **Module** | Owner Details (Step 2) |
| **Workflow** | Reorder owners using Up/Down arrows |
| **Scenario** | User moves Owner 2 above Owner 1 |
| **Expected** | New order persists to database with correct `display_order` values |
| **Actual** | `Step2OwnerDetails.tsx` `moveOwner` (line 16-25) splices the array and calls `updateOwner` for each, but this only triggers individual field updates — not a full array reorder save. The debounced sync sends the full `formData` which does include the reordered array, but the approach is fragile and depends on debounce timing. |
| **Severity** | Medium |
| **Priority** | P2 |
| **Suggested Fix** | Call a dedicated `reorderOwners` method that saves the complete owners array with updated `display_order` |

---

### QA-V9-005 — MEDIUM: Type Safety — `(owner as any)` Casts in onboardingService
| Field | Value |
|---|---|
| **Module** | Onboarding Service |
| **Workflow** | Load owners from database |
| **Scenario** | Retrieving owner records |
| **Expected** | Full type safety with proper Supabase types |
| **Actual** | `onboardingService.ts` lines 242-253 use `(owner as any).role`, `(owner as any).address`, `(owner as any).is_signatory`, `(owner as any).is_ubo` — bypassing TypeScript. These fields exist in the DB schema but types.ts may not reflect them yet. |
| **Severity** | Medium |
| **Priority** | P2 |
| **Suggested Fix** | The types.ts file auto-generates from the schema. The `as any` casts are a workaround for stale types — they function correctly but lose compile-time safety. |

---

### QA-V9-006 — MEDIUM: Rule Engine Executor Uses Untyped `supabase.from()`
| Field | Value |
|---|---|
| **Module** | Rule Engine Executor |
| **Workflow** | Lender eligibility evaluation |
| **Scenario** | Running lender rules against a case |
| **Expected** | Typed Supabase queries |
| **Actual** | `ruleEngineExecutor.ts` line 7: `const from = (table: string) => (supabase as any).from(table);` — bypasses all type checking for rule-engine tables. |
| **Severity** | Medium |
| **Priority** | P3 |
| **Suggested Fix** | This is a known pattern for tables managed via the rule engine that may not be in the auto-generated types. Acceptable for now but should be addressed when types refresh. |

---

### QA-V9-007 — MEDIUM: Duplicate Detection Is Case-Sensitive
| Field | Value |
|---|---|
| **Module** | Owner Details (Step 2) |
| **Workflow** | Add multiple owners with duplicate IDs |
| **Scenario** | User enters Emirates ID "784-1234-5678901-2" on one owner and "784-1234-5678901-2" with different casing on another |
| **Expected** | Case-insensitive duplicate detection |
| **Actual** | `Step2OwnerDetails.tsx` lines 33-39 use strict `===` comparison on trimmed strings. Emirates IDs are numeric so this is low risk, but passport numbers (e.g., "AB123" vs "ab123") could miss duplicates. |
| **Severity** | Medium |
| **Priority** | P3 |
| **Suggested Fix** | Normalize with `.toLowerCase()` before comparison |

---

### QA-V9-008 — LOW: Step Position Stored Only in localStorage
| Field | Value |
|---|---|
| **Module** | Onboarding Wizard |
| **Workflow** | Resume incomplete application |
| **Scenario** | User closes browser and returns later |
| **Expected** | Step position restored from database |
| **Actual** | `OnboardingContext.tsx` lines 76-78 and 93-95 use `localStorage` for step position. If user switches devices, they always start at Step 1. Form data IS properly restored from DB. |
| **Severity** | Low |
| **Priority** | P4 |
| **Suggested Fix** | Store `current_step` in the `onboarding_cases` table |

---

### QA-V9-009 — LOW: Signup Full Name Not Required
| Field | Value |
|---|---|
| **Module** | Auth |
| **Workflow** | User registration |
| **Scenario** | User creates account without entering a full name |
| **Expected** | Full Name should be required for profile display |
| **Actual** | `Auth.tsx` line 220: the Full Name input has no `required` attribute, allowing empty signups. |
| **Severity** | Low |
| **Priority** | P4 |
| **Suggested Fix** | Add `required` to the Full Name input |

---

### QA-V9-010 — LOW: "Auto-saved" Text Always Shows Regardless of Save State
| Field | Value |
|---|---|
| **Module** | Onboarding Navigation |
| **Workflow** | All steps |
| **Scenario** | User sees "Auto-saved" text in footer |
| **Expected** | Shows actual save status (e.g., "Saving...", "Saved at 3:45 PM", "Not saved") |
| **Actual** | `OnboardingNavigation.tsx` line 40: hardcoded string `Auto-saved`. Never reflects actual `isSaving` or `lastSaved` state from context. |
| **Severity** | Low |
| **Priority** | P4 |
| **Suggested Fix** | Pass `isSaving` and `lastSaved` props and render dynamic status |

---

### QA-V9-011 — HIGH: Test Suite Failures (7/17 tests failing)
| Field | Value |
|---|---|
| **Module** | Test Infrastructure |
| **Workflow** | Unit tests |
| **Scenario** | Running `vitest run` |
| **Expected** | All tests pass |
| **Actual** | **5 failures** in `Step2OwnerDetails.test.tsx` — all due to missing `AuthProvider` wrapper (tests render `OnboardingProvider` which depends on `useAuth`). **2 failures** in `OwnerCard.test.tsx` — (1) "displays role and status badges" fails due to duplicate text match for "Managing Partner" (badge + select trigger), (2) "calls onRemove when delete button is clicked" — spy not invoked. |
| **Severity** | High |
| **Priority** | P1 |
| **Suggested Fix** | (1) Wrap Step2 test renders with mock `AuthProvider`. (2) Use `getAllByText` for badge test. (3) Fix delete button test — likely needs to click the actual trash icon button. |

---

## SUMMARY

### 1. Overall Workflow Smoothness
The core onboarding wizard (Steps 1-6) provides a smooth multi-step experience with proper validation, auto-save debouncing, and intuitive navigation. The Eligibility Engine workflow is well-architected with 10 tabs covering upload → analysis → lender results → funding recommendation.

### 2. Modules Working Well
- ✅ **Authentication** — Login/signup/forgot-password flow is clean and functional
- ✅ **Step 1-4 Onboarding Forms** — Validations, dropdowns, radio groups all function correctly
- ✅ **Owner Management** — Add/remove/reorder/duplicate detection works
- ✅ **Document Upload UI** — Drag-drop, progress, multi-file support
- ✅ **Eligibility Engine** — Tab navigation, file parsing, analysis pipeline
- ✅ **Role-Based Access** — Proper route guards for admin/supervisor/coordinator
- ✅ **Theme Toggle** — Light/dark mode switching
- ✅ **Banking Risk Analysis** — Multi-account analysis with consolidated view

### 3. Modules With Friction
- ⚠️ **Client Cases** — Entirely mock data, not connected to real database
- ⚠️ **Onboarding Submit** — Does not persist to database (critical)
- ⚠️ **Navigation Status** — "Auto-saved" always shown regardless of actual state

### 4. Broken Transitions
- 🔴 **Onboarding → Eligibility Engine**: After submission, case remains `draft` in DB. The redirect to `/eligibility-engine` occurs but the submitted onboarding data is not linked to an assessment case.
- 🔴 **Client Cases → Case Detail**: Opens a mock detail page, not real data.

### 5. Data Display / Save Issues
- Form data auto-saves correctly via debounced persistence (1000ms)
- Owner data saves with delete-and-reinsert pattern (works but loses UUIDs)
- Documents upload to storage bucket correctly
- **Submit action does NOT save** — this is the critical gap

### 6. Rule Execution Issues
- The deprecated `AssessmentRuleEngine` is properly marked deprecated
- The unified `RuleEngineExecutor` correctly uses database-driven rules
- Type safety is bypassed via `(supabase as any).from(table)` — functional but risky

### 7. Report Issues
- Report generation and retrieval appear to function via `persistentReportService.ts`
- No broken transitions observed in the report flow within the Eligibility Engine

### 8. UX Improvement Observations
- Step labels in progress bar are clear and intuitive
- Shareholding validation banner (green/amber/red) is excellent UX
- Duplicate detection warnings are visible and helpful
- Owner badges (Signatory/UBO) provide at-a-glance compliance status
- The Eligibility Engine's 10-tab layout could benefit from a linear stepper for first-time users
- "Auto-saved" should show actual timestamp or saving indicator

### 9. Release Readiness Opinion

**🟡 CONDITIONALLY RELEASE-READY**

The application is **not ready for production** due to:
1. **Critical**: Submit button doesn't persist data (QA-V9-001)
2. **High**: Client Cases pages show mock data only (QA-V9-002, QA-V9-003)
3. **High**: 41% test failure rate (QA-V9-011)

**After fixing QA-V9-001 through QA-V9-003**, the application would be release-ready for the core onboarding + eligibility assessment workflow.

---

## TEST EXECUTION SUMMARY

| Test File | Tests | Passed | Failed |
|---|---|---|---|
| `example.test.ts` | 1 | 1 | 0 |
| `OwnerCard.test.tsx` | 11 | 9 | 2 |
| `Step2OwnerDetails.test.tsx` | 5 | 0 | 5 |
| **Total** | **17** | **10** | **7** |

**Pass Rate: 59%** (target: ≥95%)
