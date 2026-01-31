# PRD: Fix BIM Conversion Deployment Errors (tests1 Directory)

## Introduction

Fix BIM-to-SML conversion and deployment errors identified in `/Users/dianne/Downloads/bim/tests1/` files. This PRD addresses systematic fixes for errors grouped by type from `errors_to_address.txt`. Each fix must pass validation and deploy successfully.

## Goals

- Fix "expression contains a non-existing metric" errors by creating base metrics for referenced measures
- Fix "Cannot read properties of undefined (reading 'map')" errors that re-appeared on tests1 files
- Fix "Comma expected but OpenParen" and similar parsing errors in calculation expressions
- Fix data type mismatches (NumericType vs StringType, IIF branch type mismatches)
- Fix "end of input expected" parsing errors
- Add automated test-deploy script for validation + deployment workflow
- All fixes validated via deployment to AtScale

## User Stories

### US-001: Create base metrics for BIM measures referenced by other measures

**Description:** As a converter, I want to detect when a calculated measure references another BIM measure (like `SUM([Policy Estimated Monthly Commission])`), and create a base metric for the referenced measure first, so that "expression contains a non-existing metric" errors are eliminated.

**Acceptance Criteria:**

- [x] Scan all BIM measures to build a dependency map of which measures reference which other measures
- [x] Identify BIM measures that have no DAX expression but ARE referenced by other measures
- [x] Create base SML metrics for these referenced measures BEFORE converting calculated measures
- [x] Add these base metrics to metricLookup so references resolve correctly
- [x] Test FactPolicyLine_bim.json - "Total Policy Estimated Monthly Commission" resolves "Policy Estimated Monthly Commission"
- [x] Test Marketing_-_Advertising_bim.json - "Total Spend Vs. PY" resolves "Total Spend PY"
- [x] Test RetailPolicyLine_bim.json - same pattern resolves correctly
- [x] Run `npm run test-custom-calcs` - no regressions
- [x] Typecheck passes
- [x] Deploy all three files via `pnpm pbi-deploy` - fix errors until successful

### US-002: Re-verify and fix array handling for tests1 files

**Description:** As a converter, I want to ensure the null-coalescing fixes for `.map()` on undefined arrays work correctly on the tests1 directory files, so that "Cannot read properties of undefined (reading 'map')" errors don't occur.

**Acceptance Criteria:**

- [x] Test Assembly_KPI_bim.json conversion and deployment
- [x] Test Assembly_KPIs_Model_bim.json conversion and deployment
- [x] Test EU_Safety_Model_bim.json conversion and deployment
- [x] Test epm_mtd_bim.json conversion and deployment
- [x] If errors occur, identify which arrays need additional null checks
- [x] Run `npm run test-custom-calcs` - no regressions
- [x] Typecheck passes
- [x] Deploy all affected files or document specific blockers

**Deployment Blockers (AtScale Server-Side Issues):**
- **Assembly_KPI_bim.json** and **Assembly_KPIs_Model_bim.json**: Models have no dimensions/datasets because all relationships point to excluded LocalDateTable tables. AtScale returns: "Invalid xml format. Error: Cannot read properties of undefined (reading 'map')" - this is a server-side error for dimension-less models.
- **EU_Safety_Model_bim.json** and **epm_mtd_bim.json**: Single dataset models trigger AtScale server error: "parsedXml.schema.data-sets.data-set.map is not a function" - appears to be a server-side bug with single-element arrays.

**Note:** All four files convert successfully without "Cannot read properties of undefined" errors in our converter. The deployment errors are AtScale server-side issues, not converter bugs.

### US-003: Fix special character parsing errors in MDX expressions

**Description:** As a converter, I want to handle special characters in measure/column names when generating MDX expressions, so that parsing errors like "Comma expected but OpenParen found" don't occur during deployment.

**Acceptance Criteria:**

- [ ] Analyze the specific DAX expressions causing parsing errors
- [ ] For Dealer_Performance_Dashboard "Average Unit Value of Ette" - identify and fix the parsing issue
- [ ] For Global_Report_-_Assembly_KPIs "K54_YTD_Var" - identify and fix the parsing issue
- [ ] For HDNA_Magellan_Report "Bookings Change"/"Bookings Prior Year" - fix CloseParen/Div error
- [ ] For Most_Loved "Plants_KPIs_K1toK19" - fix CloseBrace/StringLiteral error
- [ ] Create TODO stubs for expressions that can't be safely converted
- [ ] Run `npm run test-custom-calcs` - no regressions
- [ ] Typecheck passes
- [ ] Deploy affected files - fix errors until successful

### US-004: Fix data type mismatches in function arguments

**Description:** As a converter, I want to detect and handle type mismatches in function arguments, so that errors like "Function Minus requires NumericType, has StringType" produce valid TODO stubs instead of invalid MDX.

**Acceptance Criteria:**

- [ ] For FactCoverage_Pivot "Data Date" - ensure NOW()/CURRENT_TIMESTAMP converts correctly or produces TODO stub
- [ ] For FactProduction "YTDSumOfPremium" - time dimension requirement - create clear TODO stub
- [ ] For Machining_Performance "OEE Text" - IIF branch type mismatch - detect and create TODO stub
- [ ] Add validation to detect common type mismatches before generating MDX
- [ ] Run `npm run test-custom-calcs` - no regressions
- [ ] Typecheck passes
- [ ] Deploy affected files - fix errors until successful

### US-005: Fix "end of input expected" parsing errors

**Description:** As a converter, I want to handle DAX expressions with unusual syntax that cause "end of input expected" errors during deployment, so that these produce valid TODO stubs.

**Acceptance Criteria:**

- [ ] Analyze Magellan_-_Usage_Metrics_Report "P-90" DAX expression (PERCENTILE.INC)
- [ ] Analyze Planogram_Integration_DataModel "Item Count" DAX expression
- [ ] Ensure PERCENTILE.INC and similar unsupported functions produce TODO stubs
- [ ] Strip trailing content that causes parsing issues
- [ ] Run `npm run test-custom-calcs` - no regressions
- [ ] Typecheck passes
- [ ] Deploy both files - fix errors until successful

### US-006: Add automated test-deploy script

**Description:** As a converter user, I want an npm script that converts a BIM file, validates the output, and deploys it, so that I can easily verify end-to-end conversion success.

**Acceptance Criteria:**

- [ ] Create `scripts/test-deploy.ts` that:
  - Takes input BIM file path as argument
  - Runs conversion via existing bim-to-sml command
  - Validates SML output using sml-sdk validation (if available) or file checks
  - Runs `pnpm pbi-deploy <file>` from correct directory
  - Reports clear pass/fail status with error details
- [ ] Add npm script: `"test-deploy": "npx ts-node scripts/test-deploy.ts"`
- [ ] Script handles errors gracefully and reports deployment failures
- [ ] Document usage in script header comments
- [ ] Typecheck passes

### US-007: Run test-deploy on all error files and document results

**Description:** As a converter user, I want all files from errors_to_address.txt tested and either passing or documented with specific blockers.

**Acceptance Criteria:**

- [ ] Run test-deploy on FactPolicyLine_bim.json - document result
- [ ] Run test-deploy on Marketing_-_Advertising_bim.json - document result
- [ ] Run test-deploy on RetailPolicyLine_bim.json - document result
- [ ] Run test-deploy on Assembly files - document results
- [ ] Run test-deploy on files with parsing errors - document results
- [ ] Run test-deploy on files with type errors - document results
- [ ] Create summary table of pass/fail status for all files
- [ ] Document any files requiring manual intervention or separate PRD

## Non-Goals

- "Measure X is not a measure" errors where dimension keys are used as fact measures (requires separate PRD for architectural changes)
- Converting all DAX functions to MDX (some remain as TODO stubs by design)
- AI-powered DAX conversion improvements
- Calculation group conversion
- Performance optimization

## Technical Considerations

### Base Metric Creation for Referenced Measures (US-001)

The core issue: BIM measures like "Policy Estimated Monthly Commission" exist as measures with a sourceColumn but no DAX expression. When "Total Policy Estimated Monthly Commission" has `SUM([Policy Estimated Monthly Commission])`, the reference fails because no metric was created.

**Implementation approach:**
1. In `buildMeasureTableMap()`, also identify measures that:
   - Have a `sourceColumn` but no `expression`
   - Are referenced by other measures (detected via DAX parsing)
2. Create base SML metrics for these before processing calculated measures
3. Add to `metricLookup` with key `agg + tableName[measureName]`

### Array Handling (US-002)

Previous fixes applied null-coalescing (`|| []`) to iterations. If errors recur:
1. Check if the tests1 files have different structure than previous test files
2. Look for new array access patterns not covered before
3. Ensure `ensureArray()` helper is applied where needed

### Deployment Command

From `/Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter`:
```bash
pnpm pbi-deploy /Users/dianne/Downloads/bim/tests1/<filename>_bim.json
```

### Test Script Location

Create at `scripts/test-deploy.ts` following existing patterns in `scripts/` directory.
