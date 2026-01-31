# PRD: Fix BIM-to-SML Converter Deployment Failures (Round 2)

## Introduction

Fix remaining bugs in the BIM-to-SML converter that cause deployment failures. Three BIM files in `/Users/dianne/Downloads/bim/fails` still fail to deploy after previous fixes. The goal is to fix pattern-based converter bugs so these files deploy successfully. Unconvertible patterns should be skipped with TODO comments rather than generating invalid MDX.

## Current Failure Analysis (Updated 2026-01-30)

| BIM File | Error | Root Cause |
|----------|-------|------------|
| Trek_bim.json | `Cannot read properties of undefined (reading 'map')` | Model/dimension structure issue - possibly empty hierarchy or missing level |
| test_bim.json | `TestInvalidCalc is not valid: end of input expected` | Invalid MDX expression generated for calculation - incomplete/malformed syntax |
| PFM_from_Daniel_bim.json | `NOT operator requires a Boolean argument, found IntType` | ISBLANK conversion produces integer (0/1) instead of boolean for NOT() |

## Goals

- Fix converter bugs causing deployment failures for Trek_bim, test_bim, and PFM_from_Daniel_bim
- Implement pattern-based fixes that help other BIM files with similar patterns
- Unconvertible patterns generate valid placeholder MDX (value 0 with TODO comment) rather than invalid syntax
- All 3 BIM files deploy successfully to AtScale after fixes

## User Stories

### US-001: Investigate Trek_bim "map undefined" error

**Description:** As a converter developer, I need to identify why Trek_bim generates invalid SML that causes "Cannot read properties of undefined (reading 'map')" during deploy.

**Acceptance Criteria:**
- [x] Examine generated SML in `/Users/dianne/Downloads/bim/fails/0-output-sml-Trek_bim`
- [x] Check dimension files for empty hierarchies or missing levels
- [x] Check model files for references to undefined objects
- [x] Identify which SML structure causes the "map undefined" error
- [x] Document root cause
- [x] Typecheck passes

**Root Cause (documented):**
- BIM file has 4 tables but NO relationships defined
- Converter requires relationships to classify tables as fact vs dimension
- All 4 tables skipped → Model with 0 datasets, 0 dimensions, only 1 calc metric
- AtScale backend fails with "map undefined" when deploying model without datasets
- **Resolution:** Requires new functionality to handle relationship-less BIM files (out of scope)

### US-002: Fix Trek_bim deployment failure

**Description:** As a converter user, I want Trek_bim.json to deploy successfully so I can use the converted model.

**Acceptance Criteria:**
- [ ] Fix identified issue in converter code (pattern-based fix)
- [ ] Re-convert Trek_bim.json
- [ ] Deploy using `pnpm pbi-deploy /Users/dianne/Downloads/bim/fails/Trek_bim.json --keep`
- [ ] Deployment succeeds (or reveals next error to fix)
- [ ] Run `npm run test-custom-calcs` - tests pass
- [ ] Typecheck passes

### US-003: Investigate test_bim "end of input expected" error

**Description:** As a converter developer, I need to identify why test_bim generates invalid MDX for TestInvalidCalc.

**Acceptance Criteria:**
- [ ] Find TestInvalidCalc in generated SML (`0-output-sml-test_bim/calculations/`)
- [ ] Examine the invalid MDX expression
- [ ] Trace back to BIM source to understand original DAX
- [ ] Document why current conversion produces invalid syntax
- [ ] Typecheck passes

### US-004: Fix test_bim invalid calculation expression

**Description:** As a converter user, I want test_bim.json to deploy with valid calculation expressions.

**Acceptance Criteria:**
- [ ] Fix converter to produce valid MDX or TODO placeholder
- [ ] Re-convert test_bim.json
- [ ] Deploy using `pnpm pbi-deploy /Users/dianne/Downloads/bim/fails/test_bim.json --keep`
- [ ] Deployment succeeds (or reveals next error to fix)
- [ ] Run `npm run test-custom-calcs` - tests pass
- [ ] Typecheck passes

### US-005: Investigate PFM_from_Daniel "NOT operator" error

**Description:** As a converter developer, I need to identify why the NOT/ISBLANK conversion produces incorrect type handling.

**Acceptance Criteria:**
- [ ] Find "ETC Pre-Discretionary Net Income" calculation in generated SML
- [ ] Examine the MDX expression containing NOT operator
- [ ] Trace back to original DAX to understand the pattern
- [ ] Document why NOT is receiving IntType instead of Boolean
- [ ] Typecheck passes

### US-006: Fix ISBLANK/NOT conversion for PFM_from_Daniel

**Description:** As a converter user, I want PFM_from_Daniel_bim.json to deploy with correct boolean handling.

**Acceptance Criteria:**
- [ ] Fix ISBLANK template to produce boolean-compatible output
- [ ] Or: skip unconvertible pattern with TODO placeholder
- [ ] Re-convert PFM_from_Daniel_bim.json
- [ ] Deploy using `pnpm pbi-deploy /Users/dianne/Downloads/bim/fails/PFM_from_Daniel_bim.json --keep`
- [ ] Deployment succeeds (or reveals next error to fix)
- [ ] Run `npm run test-custom-calcs` - tests pass
- [ ] Typecheck passes

### US-007: Iterate on remaining errors

**Description:** As a converter developer, I need to continue fixing errors until all 3 BIM files deploy successfully.

**Acceptance Criteria:**
- [ ] After each fix, re-deploy the affected BIM file
- [ ] If new error appears, investigate and fix
- [ ] Repeat until deployment succeeds
- [ ] All 3 BIM files deploy successfully
- [ ] Run `npm run test-custom-calcs` after all fixes - tests pass
- [ ] Typecheck passes

### US-008: Final verification - deploy all 3 BIM files

**Description:** As a converter user, I want to verify all 3 failing BIM files now deploy successfully.

**Acceptance Criteria:**
- [ ] Run `pnpm pbi-deploy /Users/dianne/Downloads/bim/fails --keep` from snowflake-converter directory
- [ ] All 3 deployments succeed
- [ ] Document any remaining warnings/TODOs
- [ ] Typecheck passes

## Non-Goals

- Not fixing DAX patterns that are fundamentally incompatible with MDX (use TODO placeholders)
- Not improving conversion quality for patterns that already work
- Not adding new conversion templates beyond what's needed for these failures
- Not changing the overall architecture of the converter
- Not fixing warnings (only errors that block deployment)

## Technical Considerations

- Converter code is in `src/commands/bim-to-sml/bim-converter/`
- Calculation templates are in `conversion-templates/templates/`
- ISBLANK template: `isblank-template.ts`
- Run `npm run test-custom-calcs` after each code change
- Deploy command: `pnpm pbi-deploy <file> --keep` from `/Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter`
- Invalid/unconvertible expressions should become `0 /* TODO: <original DAX> */`

## Previous Work (for reference)

Prior iteration fixed several bugs:
1. BLANK() nested in expressions not converting to NULL
2. DAX & (string concat) operator not converting to MDX + operator
3. Encoded metric unique_names not resolving
4. ROUNDUP/ROUNDDOWN DAX functions added to unconvertible list
5. COUNTROWS measures referencing unused tables
6. Self-referential cycle in calc expressions
