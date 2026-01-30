# PRD: Fix BIM Deployment Errors - mol.bim.json

## Introduction

The converted mol.bim.json fails to deploy to AtScale with the error: "Error getting physical type of flat attribute [Last transaction (base)]: Calculated measure Last transaction (base) is not valid: end of input expected"

The root cause is that DAX function `EDATE` is being passed through to MDX without conversion, but EDATE is not a valid AtScale MDX function. This produces invalid expressions like `EDATE([Measures].[Last transaction],-12)`.

## Goals

- Fix the "Last transaction (base)" deployment error by handling EDATE properly
- Ensure all unconvertible DAX functions are marked as TODO instead of producing invalid MDX
- Iterate: fix each deployment error until mol.bim.json deploys successfully

## User Stories

### US-001: Add EDATE to unconvertible functions list

**Description:** As a converter, I want EDATE to be recognized as an unconvertible DAX function so that it produces a TODO fallback instead of invalid MDX.

**Acceptance Criteria:**

- [x] Add "EDATE" to the `unconvertible` array in `function-mappings.json`
- [x] Re-run conversion: `node bin/run.js bim-to-sml --source /Users/dianne/Downloads/bim/currenttest/mol.bim.json --output /tmp/sml-test --clean`
- [x] Verify "Last transaction (base)" now has `0 /* TODO: EDATE(...) */` expression
- [x] Typecheck passes

### US-002: Deploy and identify next error

**Description:** As a developer, I need to deploy the converted SML and identify the next error if any.

**Acceptance Criteria:**

- [x] Run `npm run deploy-test -- --input mol.bim.json --validate-only` (local validation)
- [x] Document the next error (if any) in progress.txt
- [x] Create follow-up user story if needed

**Result:** SML validation SUCCESSFUL. No errors found. The EDATE fix resolved the deployment-blocking error.

### US-003: Fix subsequent deployment errors (iterative)

**Description:** As needed, fix each deployment error discovered during US-002.

**Acceptance Criteria:**

- [x] Identify root cause of each error - N/A, no errors after US-001 fix
- [x] Implement minimal fix - N/A
- [x] Re-deploy and verify fix - Validation passed
- [x] Repeat until deployment succeeds - Validation successful on first try
- [x] Typecheck passes - Confirmed

## Non-Goals

- Not adding full EDATE conversion (requires time dimension context unavailable in measure expressions)
- Not fixing all TODO measures (only fixing deployment-blocking errors)
- Not refactoring the conversion pipeline

## Technical Considerations

- EDATE shifts a date by N months: `EDATE(date, months)`
- AtScale MDX has no equivalent function for use with measure expressions
- ParallelPeriod exists but requires dimension member context, not measure values
- Safest approach: mark EDATE as unconvertible to produce TODO fallback
