# PRD: High-Impact Code Simplifications for BIM Converter

## Introduction

Simplify the BIM-to-SML converter codebase by consolidating related files, merging similar templates, and extracting concerns from oversized files. Goal: reduce cognitive load and file count without changing functionality.

## Goals

- Reduce time template files from 6 → 2 via parameterization
- Split measure-converter.ts (1,613 lines) into focused modules (~800 lines core)
- Consolidate VAR analysis files from 4 → 2 while preserving separation of concerns
- Inline small utility files into their consumers
- Zero functional changes (all tests must pass identically)

## Testing Protocol

**Every story must:**
1. Run `npm run test-custom-calcs` after changes
2. Compare output against baseline captured in US-001
3. Verify no conversion/validation/deployment differences

---

## User Stories

### US-001: Capture baseline test results

**Description:** As a developer, I need a baseline snapshot of all test outputs before refactoring so I can verify no functionality changes.

**Acceptance Criteria:**
- [x] Run `npm run test-custom-calcs` and capture full output to `test-output/baseline.txt`
- [x] Record pass/fail counts and any error messages
- [x] Document the baseline in progress.txt for reference
- [x] Typecheck passes (`npm run build`)

---

### US-002: Create parameterized TotalPeriodTemplate (YTD/MTD/QTD)

**Description:** As a developer, I want to merge totalytd, totalmtd, totalqtd templates into one parameterized template so we reduce duplication.

**Acceptance Criteria:**
- [x] Create `total-period-template.ts` with period type parameter ('year' | 'month' | 'quarter')
- [x] Template handles all three functions: TOTALYTD, TOTALMTD, TOTALQTD
- [x] Register template in template-registry.ts replacing the three individual templates
- [x] Delete totalytd-template.ts, totalmtd-template.ts, totalqtd-template.ts
- [x] Run `npm run test-custom-calcs` - output matches baseline
- [x] Typecheck passes

---

### US-003: Create parameterized PeriodShiftTemplate (ParallelPeriod family)

**Description:** As a developer, I want to merge parallelperiod, sameperiodlastyear, previousmonth templates into one parameterized template.

**Acceptance Criteria:**
- [x] Create `period-shift-template.ts` handling PARALLELPERIOD, SAMEPERIODLASTYEAR, PREVIOUSMONTH patterns
- [x] Use shared logic for CALCULATE wrapping and ParallelPeriod MDX generation
- [x] Register template in template-registry.ts replacing the three individual templates
- [x] Delete parallelperiod-template.ts, sameperiodlastyear-template.ts, previousmonth-template.ts
- [x] Run `npm run test-custom-calcs` - output matches baseline
- [x] Typecheck passes

---

### US-004: Extract type inference from measure-converter.ts

**Description:** As a developer, I want type inference logic in a dedicated file so measure-converter.ts is more focused.

**Acceptance Criteria:**
- [x] Create `measure-type-inference.ts` with type inference logic
- [x] Move `usageContext` management, `getMeasureUsageTypes()`, `isDualContextMeasure()` to new file
- [x] Export `MeasureTypeInference` class or functions
- [x] Update measure-converter.ts to import and use the extracted module
- [x] Run `npm run test-custom-calcs` - output matches baseline
- [x] Typecheck passes

---

### US-005: Extract reference resolution from measure-converter.ts

**Description:** As a developer, I want reference resolution logic in a dedicated file so measure-converter.ts handles only core conversion.

**Acceptance Criteria:**
- [ ] Create `measure-reference-resolver.ts` with reference resolution logic
- [ ] Move `resolveUnresolvedReferences()`, `buildMeasureTableMap()`, `getMeasureTable()` to new file
- [ ] Move `splitMeasureRegistry` handling for reference rewriting
- [ ] Export `MeasureReferenceResolver` class
- [ ] Update measure-converter.ts to import and use the extracted module
- [ ] measure-converter.ts now ~800 lines or less
- [ ] Run `npm run test-custom-calcs` - output matches baseline
- [ ] Typecheck passes

---

### US-006: Consolidate var-scope-tracker + var-analyzer → var-analysis.ts

**Description:** As a developer, I want to merge scope tracking and dependency analysis into one file since they're tightly coupled.

**Acceptance Criteria:**
- [ ] Create `var-analysis.ts` combining VarScopeTracker and VarAnalyzer classes
- [ ] Keep both classes distinct within the file (same APIs)
- [ ] Update imports in var-inliner.ts, var-safety-checker.ts, dax-expression.ts
- [ ] Delete var-scope-tracker.ts and var-analyzer.ts
- [ ] Run `npm run test-custom-calcs` - output matches baseline
- [ ] Typecheck passes

---

### US-007: Consolidate var-safety-checker + var-inliner → var-inliner.ts

**Description:** As a developer, I want to merge safety checking into the inliner since they're sequential steps in the same operation.

**Acceptance Criteria:**
- [ ] Move VarSafetyChecker class into var-inliner.ts
- [ ] Keep VarSafetyChecker as distinct class (same API)
- [ ] Update imports in conversion-pipeline.ts and any other consumers
- [ ] Delete var-safety-checker.ts
- [ ] var-analysis/ now has 2 files: var-analysis.ts, var-inliner.ts
- [ ] Run `npm run test-custom-calcs` - output matches baseline
- [ ] Typecheck passes

---

### US-008: Inline conversion-result.ts into conversion-pipeline.ts

**Description:** As a developer, I want conversion result types colocated with the pipeline that uses them.

**Acceptance Criteria:**
- [ ] Move `ConversionResult`, `ConversionCategory`, `failedConversion()`, `successfulConversion()` into conversion-pipeline.ts
- [ ] Update all imports (templates, AI converter, etc.) to import from conversion-pipeline.ts
- [ ] Delete conversion-result.ts
- [ ] Run `npm run test-custom-calcs` - output matches baseline
- [ ] Typecheck passes

---

### US-009: Inline connection-converter.ts into bim-to-sml-converter.ts

**Description:** As a developer, I want connection conversion logic in the main orchestrator since it's only 94 lines and used in one place.

**Acceptance Criteria:**
- [ ] Move `createConnections()`, `listUsedConnections()`, `parseConnectionString()` into bim-to-sml-converter.ts
- [ ] Functions can remain standalone or become private methods
- [ ] Delete connection-converter.ts
- [ ] Run `npm run test-custom-calcs` - output matches baseline
- [ ] Typecheck passes

---

### US-010: Final verification and cleanup

**Description:** As a developer, I want to verify all refactoring preserved functionality and update documentation.

**Acceptance Criteria:**
- [ ] Run full `npm run test-custom-calcs` and compare against baseline
- [ ] All outputs identical to baseline (no functional changes)
- [ ] Update any imports in files outside bim-converter/ if needed
- [ ] Verify file count reduction: ~8 fewer files total
- [ ] Typecheck passes
- [ ] Build succeeds (`npm run build`)

---

## Non-Goals

- No changes to conversion logic or output
- No new features or capabilities
- No changes to public APIs consumed by other commands
- No refactoring of dax-converter.ts (tokenizer) - it's large but cohesive
- No inlining of dax-expression.ts - it provides useful abstraction layer

## Technical Considerations

- VAR analysis files have clean sequential dependencies - preserve this in merged files
- Time templates share `resolveDimensionHierarchy()` from converter-utils.ts - continue using it
- measure-converter.ts uses `SplitMeasureRegistry` for dual-context - keep registry accessible to extracted modules
- Template registration order may matter - maintain same registration order in template-registry.ts

## File Change Summary

| Before | After | Change |
|--------|-------|--------|
| totalytd-template.ts | total-period-template.ts | Merged 3 → 1 |
| totalmtd-template.ts | (deleted) | |
| totalqtd-template.ts | (deleted) | |
| parallelperiod-template.ts | period-shift-template.ts | Merged 3 → 1 |
| sameperiodlastyear-template.ts | (deleted) | |
| previousmonth-template.ts | (deleted) | |
| measure-converter.ts | measure-converter.ts (~800 lines) | Split |
| (new) | measure-type-inference.ts | Extracted |
| (new) | measure-reference-resolver.ts | Extracted |
| var-scope-tracker.ts | var-analysis.ts | Merged 2 → 1 |
| var-analyzer.ts | (deleted) | |
| var-safety-checker.ts | var-inliner.ts | Merged 2 → 1 |
| conversion-result.ts | (inlined to conversion-pipeline.ts) | Deleted |
| connection-converter.ts | (inlined to bim-to-sml-converter.ts) | Deleted |

**Net change:** -8 files (from ~20 to ~12 in bim-converter/)
