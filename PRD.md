# PRD: Fix BIM Converter Calculation Expression Errors via AtScale Deployment

## Introduction

When deploying BIM-converted SML output to AtScale, calculation expression errors occur. This PRD covers creating a deployment test loop: deploy → capture errors → fix converter → repeat until zero errors.

## Goals

- Create script to deploy converted SML to AtScale via SML CLI
- Capture and parse deployment errors from AtScale API response
- Fix calculation expression conversion bugs in the BIM converter
- Achieve zero deployment errors for test model

## Configuration

- **AtScale Instance:** Local development (localhost)
- **Branch:** ai-experiments (continue on current branch)
- **TODO Handling:** Deploy as-is (`0 /* TODO: ... */`) - should pass validation
- **Success Criteria:** Model deploys without schema errors (queryability not required)

## User Stories

### US-001: Copy test BIM file locally

**Description:** As a developer, I need the test BIM file in the local repo so I can use it for iterative testing.

**Acceptance Criteria:**
- [x] Copy `/Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter/src/test-suites/pbi-smoke/dw-test-model/model.bim` to `test-files/pbi_dw_test_model.bim` (new name to preserve existing file)
- [x] Verify file exists and is valid JSON
- [x] Typecheck passes

### US-002: Research SML CLI deploy command

**Description:** As a developer, I need to understand the SML CLI deploy/push command syntax and requirements.

**Acceptance Criteria:**
- [ ] Document SML CLI deploy command syntax
- [ ] Identify required connection parameters (host, credentials, org, project)
- [ ] Document how AtScale returns errors in API response
- [ ] Update this PRD with findings

### US-003: Create deploy-and-test script

**Description:** As a developer, I need a script that converts BIM → SML and deploys to AtScale, capturing any errors.

**Acceptance Criteria:**
- [ ] Create `scripts/deploy-test.ts` script
- [ ] Script accepts AtScale connection parameters (host, token, org, project)
- [ ] Script converts BIM to SML using existing converter
- [ ] Script deploys SML using SML CLI push command
- [ ] Script parses AtScale API response for errors
- [ ] Script outputs structured error list (metric name, error message, original DAX)
- [ ] Add pnpm script: `pnpm run deploy-test`
- [ ] Typecheck passes

### US-004: Run initial deployment and capture errors

**Description:** As a developer, I need to run the first deployment to identify all calculation expression errors.

**Acceptance Criteria:**
- [ ] Run `pnpm run deploy-test` against local AtScale instance
- [ ] Capture full error output to `test-files/deployment-errors.json`
- [ ] Document error categories found (syntax, reference, function)
- [ ] Update this PRD with specific error patterns to fix

### US-005: Fix calculation expression errors - Round 1

**Description:** As a developer, I need to fix the first batch of converter bugs based on deployment errors.

**Acceptance Criteria:**
- [ ] Analyze errors from US-004
- [ ] Fix converter code for identified patterns
- [ ] Run `pnpm run test-custom-calcs` - passes
- [ ] Typecheck passes

### US-006: Verify fixes via deployment - Round 1

**Description:** As a developer, I need to verify fixes by redeploying to AtScale.

**Acceptance Criteria:**
- [ ] Run `pnpm run deploy-test`
- [ ] Compare error count to previous run
- [ ] Document remaining errors
- [ ] If errors remain, create US-007 for next fix round

### US-007: Fix calculation expression errors - Round 2 (if needed)

**Description:** As a developer, I need to fix remaining converter bugs from round 1.

**Acceptance Criteria:**
- [ ] Analyze remaining errors
- [ ] Fix converter code
- [ ] Run `pnpm run test-custom-calcs` - passes
- [ ] Typecheck passes

### US-008: Verify fixes via deployment - Round 2 (if needed)

**Description:** As a developer, I need to verify round 2 fixes.

**Acceptance Criteria:**
- [ ] Run `pnpm run deploy-test`
- [ ] If zero errors: DONE
- [ ] If errors remain: create additional fix rounds

### US-009: Final validation and cleanup

**Description:** As a developer, I need to confirm zero deployment errors and document the fixes.

**Acceptance Criteria:**
- [ ] Run `pnpm run deploy-test` - zero errors
- [ ] Update `scripts/README.md` with deploy-test documentation
- [ ] Run `pnpm run test-custom-calcs` - passes
- [ ] Typecheck passes

## Non-Goals

- Adding new DAX functions that aren't already partially supported
- Fixing unconvertible functions (SUMX, CALCULATE with complex filters, etc.) that produce TODOs
- Handling Power BI-specific features not relevant to AtScale
- Performance optimization of the converter
- Verifying metrics are queryable (only schema validation)

## Technical Considerations

- SML CLI is at `/usr/local/bin/sml-cli` or dev version at `/Users/dianne/go/src/github.com/AtScaleInc/SML/apps/cli/bin/dev.js`
- Existing test infrastructure in `scripts/test-custom-calcs.ts` can be leveraged
- AtScale API errors typically include metric name and error description
- Fix patterns should be applied to `src/commands/bim-to-sml/bim-converter/` files
- Existing `test-files/dw_test_model.bim` preserved; new file named `pbi_dw_test_model.bim`

## Dependencies

- US-002 must complete before US-003 (need to understand SML CLI deploy)
- US-003 must complete before US-004 (need script to capture errors)
- US-004 must complete before US-005 (need errors to fix)
- Fix/verify rounds alternate: US-005 → US-006 → US-007 → US-008 → ...
