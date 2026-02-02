# PRD: Fix BIM-to-SML Conversion Regressions

## Introduction

Four BIM-to-SML conversion regressions need fixing. These files previously converted successfully but now fail. The fixes must not break any other conversions in the test suite.

## Goals

- Fix DataMgt_bim: Warning should not cause conversion failure
- Fix Magellan_bim: Resolve truncated metric reference `_MagellanDataset Booking Amt [$`
- Fix PFM_bim: Generate TODO stub for date arithmetic expressions
- Fix Ulta_bim: Handle "Sell Through" parsing error (end of input expected)
- Maintain backward compatibility - no regressions in other BIM files

## User Stories

### US-001: Warning should not fail conversion

**Description:** As a user, I want unique name warnings to log but not stop conversion, so that DataMgt_bim converts successfully.

**Root Cause:** The `[WARN] Unique name 'CalendarMonth' is already being used...` message is logged at `tools.ts:433` but somewhere the conversion is treating this as a failure.

**Acceptance Criteria:**

- [x] Identify where warning status is propagated as error
- [x] Ensure `handleNameExists()` in tools.ts returns valid unique_name and conversion continues
- [x] DataMgt_bim.json converts without error
- [x] Run `npm run test-custom-calcs` - no new failures
- [x] Typecheck passes

### US-002: Fix DAX bracket escaping for metric references

**Description:** As a user, I want DAX expressions with escaped brackets like `[Booking Amt [$]]]` to resolve correctly, so that Magellan_bim converts successfully.

**Root Cause:** DAX expression `SUM('_MagellanDataset'[Booking Amt [$]]])` has triple brackets. The column name is `Booking Amt [$]` (double `]]` = escaped `]`). The tokenizer parses this correctly but the metric lookup/creation in `TableColumnReference.toMdx()` is producing invalid reference `_MagellanDataset Booking Amt [$"`.

**Acceptance Criteria:**

- [x] Trace `TableColumnReference.toMdx()` logic for this specific pattern
- [x] Fix metric lookup to handle column names containing special chars like `[$]`
- [x] Add fuzzy matching fallback if exact match fails
- [x] Magellan_bim.json and Magellan_RLS_Test_-_12-11-24_bim.json convert without "non-existing metric" error
- [x] Run `npm run test-custom-calcs` - no new failures
- [x] Typecheck passes

### US-003: Generate TODO stub for date arithmetic

**Description:** As a user, I want DAX date arithmetic expressions to produce TODO stubs instead of type errors, so that PFM_bim converts successfully.

**Root Cause:** DAX `[PFM Processed On (date time)]-1` subtracts 1 from datetime (valid in DAX, subtracts 1 day). The MDX conversion produces an expression that AtScale rejects with "Function Minus requires arguments of type NumericType".

**Acceptance Criteria:**

- [x] Detect when OperatorToken `-` has a measure reference that returns DateTimeType
- [x] Generate TODO stub: `0 /* TODO: [measure]-1 - date arithmetic requires DATEADD */`
- [x] PFM_bim.json and PFM_from_Daniel_bim.json convert without "Function Minus requires NumericType" error
- [x] Run `npm run test-custom-calcs` - no new failures
- [x] Typecheck passes

### US-004: Fix "end of input expected" parsing error

**Description:** As a user, I want the "Sell Through" measure to parse correctly, so that Ulta_bim converts successfully.

**Root Cause:** The "Sell Through" measure DAX is:
```dax
DIVIDE (
    [Sales (Week Entered)],
    ( CALCULATE(SUM ( 'Daily'[WEB_STOCK_EB_UNITS] ),Daily[WEEKLY_FLAG] = TRUE()) + [Store OH Stock] + [Sales (Week Entered)] )
)
```
The "end of input expected" error suggests tokenizer issue with this specific pattern.

**Acceptance Criteria:**

- [x] Reproduce the parsing error with the specific DAX expression
- [x] Identify root cause in tokenizer (likely parenthesis/comma handling)
- [x] Fix tokenizer to handle this pattern
- [x] Add fallback: if parsing fails, generate TODO stub instead of error
- [x] Ulta_bim.json converts without "end of input expected" error
- [x] Run `npm run test-custom-calcs` - no new failures
- [x] Typecheck passes

### US-005: Run smoke tests to verify no regressions

**Description:** As a developer, I want to verify the full test suite passes after all fixes.

**Acceptance Criteria:**

- [ ] Run `npm run test-custom-calcs` - all previously passing files still pass
- [ ] Run `pnpm run test:pbi-smoke` from `/Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter/src/test-suites/pbi-smoke` - suite passes
- [ ] No new warnings or errors introduced
- [ ] Typecheck passes

## Non-Goals

- Not adding new DAX function support beyond these specific fixes
- Not changing the overall conversion architecture
- Not optimizing performance
- Not fixing warnings that don't cause failures

## Technical Considerations

**Key Files:**
- `src/commands/bim-to-sml/bim-converter/dax-converter.ts` - DAX tokenizer, `TableColumnReference.toMdx()`
- `src/commands/bim-to-sml/bim-converter/tools.ts` - `handleNameExists()`, unique name handling
- `src/commands/bim-to-sml/bim-converter/conversion-pipeline.ts` - Pipeline stages, error handling
- `src/commands/bim-to-sml/bim-converter/measure-converter.ts` - Metric creation/lookup

**Testing Commands:**
```bash
# Test single file
node bin/run.js bim-to-sml --source /Users/dianne/Downloads/bim/succeeds/DataMgt_bim.json --output ./test-output

# Run custom calcs test
npm run test-custom-calcs

# Run smoke tests (from SML repo)
cd /Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter/src/test-suites/pbi-smoke
pnpm run test:pbi-smoke
```

**Regression Prevention:**
- After each fix, run `npm run test-custom-calcs` before moving to next story
- Keep changes minimal and focused
- These files worked before, so look for recent changes that may have broken them
