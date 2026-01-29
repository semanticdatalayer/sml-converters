# PRD: Time Intelligence DAX to MDX Conversion

## Introduction

The BIM-to-SML converter achieves ~44% conversion rate for DAX measures. Many fail due to dimension column reference handling in time intelligence functions. This PRD adds support for time intelligence functions to reach 50%+ conversion rate.

Each function is implemented separately for easy rollback, with dedicated tests in pbi-smoke to verify results against Power BI.

## Goals

- Increase conversion rate from 44% to 50%+
- Maintain 0.9+ confidence on all new conversions
- Each function separately implemented and rollback-able
- Create pbi-smoke tests for each function to verify against Power BI

## User Stories

### US-001: Fix Dimension Column Reference Resolution

**Description:** As a converter, I need to resolve dimension column references to SML dimension hierarchies so time intelligence functions can reference the correct dimension.

**Acceptance Criteria:**
- [x] Add `resolveDimensionHierarchy(tableName, columnName, result)` utility function
- [x] Lookup: search `result.dimensions` for matching dataset/table name
- [x] Fallback: use convention `[dimension.{TableName}].[{TableName}]`
- [x] Only apply in time intelligence contexts (not general CALCULATE)
- [x] Typecheck passes
- [x] `npm run test-custom-calcs` passes

---

### US-002: Add TOTALYTD Template

**Description:** As a user, I want TOTALYTD expressions converted to MDX.

**DAX:** `TOTALYTD([Total Sales], DATE_DIM[D_DATE])`
**MDX:** `Sum(YTD([dimension.DATE_DIM].[DATE_DIM].CurrentMember), [Measures].[Total Sales])`

**Acceptance Criteria:**
- [x] Create `totalytd-template.ts`
- [x] Register in `template-registry.ts`
- [x] Add to `complex_patterns` in `function-mappings.json`
- [x] Confidence: 0.95
- [x] Typecheck passes
- [x] `npm run test-custom-calcs` passes

**Test:** Create `dw-test-model/expr-totalytd/`
- [x] Add measure to `dw-test-model/model.bim`: `"YTD Sales": "TOTALYTD([Total Sales], DATE_DIM[D_DATE])"`
- [x] `pbi.dax` with TOTALYTD query
- [x] `engine.sql` with equivalent AtScale query
- [x] Empty `expected.csv` (populate manually)
- [x] Add test case to `pbi-smoke.test.ts`

---

### US-003: Add TOTALMTD Template

**Description:** As a user, I want TOTALMTD expressions converted to MDX.

**DAX:** `TOTALMTD([Total Sales], DATE_DIM[D_DATE])`
**MDX:** `Sum(MTD([dimension.DATE_DIM].[DATE_DIM].CurrentMember), [Measures].[Total Sales])`

**Acceptance Criteria:**
- [x] Create `totalmtd-template.ts`
- [x] Register in `template-registry.ts`
- [x] Add to `complex_patterns` in `function-mappings.json`
- [x] Confidence: 0.95
- [x] Typecheck passes
- [x] `npm run test-custom-calcs` passes

**Test:** Create `dw-test-model/expr-totalmtd/`
- [x] Add measure to `dw-test-model/model.bim`: `"MTD Sales": "TOTALMTD([Total Sales], DATE_DIM[D_DATE])"` (already exists)
- [x] `pbi.dax` with TOTALMTD query
- [x] `engine.sql` with equivalent AtScale query
- [x] Empty `expected.csv`
- [x] Add test case to `pbi-smoke.test.ts`

---

### US-004: Add TOTALQTD Template

**Description:** As a user, I want TOTALQTD expressions converted to MDX.

**DAX:** `TOTALQTD([Total Sales], DATE_DIM[D_DATE])`
**MDX:** `Sum(QTD([dimension.DATE_DIM].[DATE_DIM].CurrentMember), [Measures].[Total Sales])`

**Acceptance Criteria:**
- [x] Create `totalqtd-template.ts`
- [x] Register in `template-registry.ts`
- [x] Add to `complex_patterns` in `function-mappings.json`
- [x] Confidence: 0.95
- [x] Typecheck passes
- [x] `npm run test-custom-calcs` passes

**Test:** Create `dw-test-model/expr-totalqtd/`
- [x] Add measure to `dw-test-model/model.bim`: `"QTD Sales": "TOTALQTD([Total Sales], DATE_DIM[D_DATE])"` (already exists)
- [x] `pbi.dax` with TOTALQTD query
- [x] `engine.sql` with equivalent AtScale query
- [x] Empty `expected.csv`
- [x] Add test case to `pbi-smoke.test.ts`

---

### US-005: Add SAMEPERIODLASTYEAR Template

**Description:** As a user, I want SAMEPERIODLASTYEAR expressions converted to MDX.

**DAX:** `CALCULATE([Total Sales], SAMEPERIODLASTYEAR(DATE_DIM[D_DATE]))`
**MDX:** `(ParallelPeriod([dimension.DATE_DIM].[DATE_DIM].[Year], 1, [dimension.DATE_DIM].[DATE_DIM].CurrentMember), [Measures].[Total Sales])`

**Acceptance Criteria:**
- [x] Create `sameperiodlastyear-template.ts`
- [x] Handle standalone and CALCULATE-wrapped usage
- [x] Register in `template-registry.ts`
- [x] Add to `complex_patterns` in `function-mappings.json`
- [x] Confidence: 0.9
- [x] Typecheck passes
- [x] `npm run test-custom-calcs` passes

**Test:** Create `dw-test-model/expr-sameperiodly/`
- [x] Add measure to `dw-test-model/model.bim`: `"Sales Same Period Last Year": "CALCULATE([Total Sales], SAMEPERIODLASTYEAR(DATE_DIM[D_DATE]))"` (already exists)
- [x] `pbi.dax` with SAMEPERIODLASTYEAR query
- [x] `engine.sql` with equivalent AtScale query
- [x] Empty `expected.csv`
- [x] Add test case to `pbi-smoke.test.ts`

---

### US-006: Add PREVIOUSMONTH Template

**Description:** As a user, I want PREVIOUSMONTH expressions converted to MDX.

**DAX:** `CALCULATE([Total Sales], PREVIOUSMONTH(DATE_DIM[D_DATE]))`
**MDX:** `([dimension.DATE_DIM].[DATE_DIM].CurrentMember.Lag(1), [Measures].[Total Sales])`

**Acceptance Criteria:**
- [x] Create `previousmonth-template.ts`
- [x] Use `Lag(1)` or `PrevMember` at month level
- [x] Register in `template-registry.ts`
- [x] Add to `complex_patterns` in `function-mappings.json`
- [x] Confidence: 0.9
- [x] Typecheck passes
- [x] `npm run test-custom-calcs` passes

**Test:** Create `dw-test-model/expr-previousmonth/`
- [x] Add measure to `dw-test-model/model.bim`: `"Sales Previous Month": "CALCULATE([Total Sales], PREVIOUSMONTH(DATE_DIM[D_DATE]))"` (already exists)
- [x] `pbi.dax` with PREVIOUSMONTH query
- [x] `engine.sql` with equivalent AtScale query
- [x] Empty `expected.csv`
- [x] Add test case to `pbi-smoke.test.ts`

---

### US-007: Add PARALLELPERIOD Template

**Description:** As a user, I want PARALLELPERIOD expressions converted to MDX.

**DAX:** `CALCULATE([Total Sales], PARALLELPERIOD(DATE_DIM[D_DATE], -1, YEAR))`
**MDX:** `(ParallelPeriod([dimension.DATE_DIM].[DATE_DIM].[Year], 1, [dimension.DATE_DIM].[DATE_DIM].CurrentMember), [Measures].[Total Sales])`

**Acceptance Criteria:**
- [x] Create `parallelperiod-template.ts`
- [x] Map DAX intervals (YEAR, QUARTER, MONTH, DAY) to MDX hierarchy levels
- [x] Handle negative offsets (DAX -1 = MDX 1)
- [x] Register in `template-registry.ts`
- [x] Add to `complex_patterns` in `function-mappings.json`
- [x] Confidence: 0.9
- [x] Typecheck passes
- [x] `npm run test-custom-calcs` passes

**Test:** Create `dw-test-model/expr-parallelperiod/`
- [x] Add measure to `dw-test-model/model.bim`: `"Sales Parallel Period LY": "CALCULATE([Total Sales], PARALLELPERIOD(DATE_DIM[D_DATE], -1, YEAR))"` (already exists)
- [x] `pbi.dax` with PARALLELPERIOD query
- [x] `engine.sql` with equivalent AtScale query
- [x] Empty `expected.csv`
- [x] Add test case to `pbi-smoke.test.ts`

---

### US-008: Add CLOSINGBALANCEMONTH Template

**Description:** As a user, I want CLOSINGBALANCEMONTH expressions converted to MDX for semi-additive measures.

**DAX:** `CLOSINGBALANCEMONTH(SUM(STORE_SALES[SS_NET_PAID]), DATE_DIM[D_DATE])`
**MDX:** `(ClosingPeriod([dimension.DATE_DIM].[DATE_DIM].[Month]), [Measures].[SS_NET_PAID])`

**Acceptance Criteria:**
- [ ] Create `closingbalancemonth-template.ts`
- [ ] Handle the measure expression as first argument
- [ ] Register in `template-registry.ts`
- [ ] Add to `complex_patterns` in `function-mappings.json`
- [ ] Confidence: 0.9
- [ ] Typecheck passes
- [ ] `npm run test-custom-calcs` passes

**Test:** Create `dw-test-model/expr-closingbalance/`
- [ ] Add measure to `dw-test-model/model.bim`: `"Closing Balance Sales": "CLOSINGBALANCEMONTH(SUM(STORE_SALES[SS_NET_PAID]), DATE_DIM[D_DATE])"`
- [ ] `pbi.dax` with CLOSINGBALANCEMONTH query
- [ ] `engine.sql` with equivalent AtScale query
- [ ] Empty `expected.csv`
- [ ] Add test case to `pbi-smoke.test.ts`

---

### US-009: Add DATEADD Template

**Description:** As a user, I want DATEADD expressions converted to MDX for date offset calculations.

**DAX:** `CALCULATE([Total Sales], DATEADD(DATE_DIM[D_DATE], -7, DAY))`
**MDX:** `([dimension.DATE_DIM].[DATE_DIM].CurrentMember.Lag(7), [Measures].[Total Sales])`

**Acceptance Criteria:**
- [ ] Create `dateadd-template.ts`
- [ ] Map DAX intervals (DAY, MONTH, QUARTER, YEAR) to appropriate MDX Lag/Lead
- [ ] Handle negative offsets
- [ ] Register in `template-registry.ts`
- [ ] Add to `complex_patterns` in `function-mappings.json`
- [ ] Confidence: 0.9
- [ ] Typecheck passes
- [ ] `npm run test-custom-calcs` passes

**Test:** Create `dw-test-model/expr-dateadd/`
- [ ] Add measure to `dw-test-model/model.bim`: `"Sales 7 Days Ago": "CALCULATE([Total Sales], DATEADD(DATE_DIM[D_DATE], -7, DAY))"`
- [ ] `pbi.dax` with DATEADD query
- [ ] `engine.sql` with equivalent AtScale query
- [ ] Empty `expected.csv`
- [ ] Add test case to `pbi-smoke.test.ts`

---

### US-010: Add LASTNONBLANK Template

**Description:** As a user, I want LASTNONBLANK expressions converted to MDX for semi-additive snapshot measures.

**DAX:** `LASTNONBLANK('Table'[Column], 0)`
**MDX:** `Tail(NonEmpty([dimension.Table].[Table].Members, [Measures].[Column]), 1)`

**Acceptance Criteria:**
- [ ] Create `lastnonblank-template.ts`
- [ ] Handle column reference as first argument
- [ ] Register in `template-registry.ts`
- [ ] Add to `complex_patterns` in `function-mappings.json`
- [ ] Confidence: 0.85 (semi-additive semantics may differ)
- [ ] Typecheck passes
- [ ] `npm run test-custom-calcs` passes

**Test:** Create `dw-test-model/expr-lastnonblank/`
- [ ] Add measure to `dw-test-model/model.bim` with LASTNONBLANK pattern
- [ ] `pbi.dax` with LASTNONBLANK query
- [ ] `engine.sql` with equivalent AtScale query
- [ ] Empty `expected.csv`
- [ ] Add test case to `pbi-smoke.test.ts`

---

### US-011: Fix IFERROR Template

**Description:** As a user, I want IFERROR expressions to convert properly.

**DAX:** `IFERROR([Profit Margin], 0)`
**MDX:** `IIF(ISEMPTY([Measures].[Profit Margin]), 0, [Measures].[Profit Margin])`

**Acceptance Criteria:**
- [ ] Investigate why `iferror-template.ts` fails for `IFERROR([Profit Margin], 0)`
- [ ] Fix template to handle measure references correctly
- [ ] Confidence: 0.95
- [ ] Typecheck passes
- [ ] `npm run test-custom-calcs` passes

**Test:** Update existing `dw-test-model/expr-iferror/`
- [ ] Verify `pbi.dax` tests IFERROR
- [ ] Update `engine.sql` if needed
- [ ] Unskip test in `pbi-smoke.test.ts`

---

### US-012: Investigate Additional Easy Wins

**Description:** As a developer, I want to identify and fix other low-hanging fruit.

**Acceptance Criteria:**
- [ ] Review templates for silent failures
- [ ] Check measure reference resolution order issues
- [ ] Document and fix issues with confidence >= 0.9
- [ ] Typecheck passes
- [ ] `npm run test-custom-calcs` passes
- [ ] Final conversion rate >= 50%

---

## Test Specifications

### Test Model Location

All tests use the shared BIM file at:
```
/Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter/src/test-suites/pbi-smoke/dw-test-model/model.bim
```

New measures must be added to this `model.bim` file. The pbi-smoke test suite converts this BIM to SML and deploys it to AtScale for query validation.

### Test Directory Structure

Each test folder is created under the same `dw-test-model/` directory:

```
expr-{function}/
├── pbi.dax         # DAX query for Power BI
├── engine.sql      # SQL query for AtScale
├── expected.csv    # Expected results (populate manually)
└── engine.csv      # Actual results (generated by test)
```

### US-002 Test: expr-totalytd

**pbi.dax:**
```dax
// TOTALYTD - Year to date sales by year
EVALUATE
SUMMARIZECOLUMNS(
    DATE_DIM[D_YEAR],
    "YTD Sales", [YTD Sales]
)
ORDER BY DATE_DIM[D_YEAR]
```

**engine.sql:**
```sql
SELECT "D_YEAR", "YTD Sales"
FROM {{catalog}}."model_model"
ORDER BY "D_YEAR"
```

### US-003 Test: expr-totalmtd

**pbi.dax:**
```dax
// TOTALMTD - Month to date sales by year and month
EVALUATE
SUMMARIZECOLUMNS(
    DATE_DIM[D_YEAR],
    DATE_DIM[D_MOY],
    "MTD Sales", [MTD Sales]
)
ORDER BY DATE_DIM[D_YEAR], DATE_DIM[D_MOY]
```

**engine.sql:**
```sql
SELECT "D_YEAR", "D_MOY", "MTD Sales"
FROM {{catalog}}."model_model"
ORDER BY "D_YEAR", "D_MOY"
```

### US-004 Test: expr-totalqtd

**pbi.dax:**
```dax
// TOTALQTD - Quarter to date sales by year and quarter
EVALUATE
SUMMARIZECOLUMNS(
    DATE_DIM[D_YEAR],
    DATE_DIM[D_QOY],
    "QTD Sales", [QTD Sales]
)
ORDER BY DATE_DIM[D_YEAR], DATE_DIM[D_QOY]
```

**engine.sql:**
```sql
SELECT "D_YEAR", "D_QOY", "QTD Sales"
FROM {{catalog}}."model_model"
ORDER BY "D_YEAR", "D_QOY"
```

### US-005 Test: expr-sameperiodly

**pbi.dax:**
```dax
// SAMEPERIODLASTYEAR - Sales vs same period last year by year
EVALUATE
SUMMARIZECOLUMNS(
    DATE_DIM[D_YEAR],
    "Sales SPLY", [Sales Same Period Last Year]
)
ORDER BY DATE_DIM[D_YEAR]
```

**engine.sql:**
```sql
SELECT "D_YEAR", "Sales Same Period Last Year"
FROM {{catalog}}."model_model"
ORDER BY "D_YEAR"
```

### US-006 Test: expr-previousmonth

**pbi.dax:**
```dax
// PREVIOUSMONTH - Sales vs previous month by year and month
EVALUATE
SUMMARIZECOLUMNS(
    DATE_DIM[D_YEAR],
    DATE_DIM[D_MOY],
    "Sales Prev Month", [Sales Previous Month]
)
ORDER BY DATE_DIM[D_YEAR], DATE_DIM[D_MOY]
```

**engine.sql:**
```sql
SELECT "D_YEAR", "D_MOY", "Sales Previous Month"
FROM {{catalog}}."model_model"
ORDER BY "D_YEAR", "D_MOY"
```

### US-007 Test: expr-parallelperiod

**pbi.dax:**
```dax
// PARALLELPERIOD - Sales parallel period last year by year
EVALUATE
SUMMARIZECOLUMNS(
    DATE_DIM[D_YEAR],
    "Sales Parallel LY", [Sales Parallel Period LY]
)
ORDER BY DATE_DIM[D_YEAR]
```

**engine.sql:**
```sql
SELECT "D_YEAR", "Sales Parallel Period LY"
FROM {{catalog}}."model_model"
ORDER BY "D_YEAR"
```

### US-009 Test: expr-closingbalance

**pbi.dax:**
```dax
// CLOSINGBALANCEMONTH - Closing balance by year and month
EVALUATE
SUMMARIZECOLUMNS(
    DATE_DIM[D_YEAR],
    DATE_DIM[D_MOY],
    "Closing Balance Sales", [Closing Balance Month Sales]
)
ORDER BY DATE_DIM[D_YEAR], DATE_DIM[D_MOY]
```

**engine.sql:**
```sql
SELECT "D_YEAR", "D_MOY", "Closing Balance Month Sales"
FROM {{catalog}}."model_model"
ORDER BY "D_YEAR", "D_MOY"
```

### US-010 Test: expr-dateadd

**pbi.dax:**
```dax
// DATEADD - Sales with date offset by year
EVALUATE
SUMMARIZECOLUMNS(
    DATE_DIM[D_YEAR],
    "Sales 7 Days Ago", [Sales 7 Days Ago]
)
ORDER BY DATE_DIM[D_YEAR]
```

**engine.sql:**
```sql
SELECT "D_YEAR", "Sales 7 Days Ago"
FROM {{catalog}}."model_model"
ORDER BY "D_YEAR"
```

---

## Patterns Analyzed (from MOL_bim_from_xmla.json)

Analysis of production BIM file revealed these patterns:

| Pattern | Count | Status |
|---------|-------|--------|
| CALCULATE with filters | 95 | Partial (ALL only) |
| DIVIDE | 66 | ✓ Already supported |
| BLANK | 16 | ✓ Already supported |
| SUM/AVERAGE/MIN/MAX | 32 | ✓ Already supported |
| SWITCH | 10 | ✓ Template exists |
| ABS | 6 | ✓ Direct mapping |
| CONCATENATE | 5 | ✓ Just added |
| LASTNONBLANK | 4 | US-011 (new) |
| SELECTEDMEASURE | 4 | Non-goal (calc groups) |
| DATATABLE | 4 | Non-goal (table creation) |
| TOTALYTD/MTD | 2 | US-002, US-003 |
| DATEADD | 1 | US-010 (new) |
| EDATE | 1 | Deferred (date math) |
| FORMAT | 1 | Deferred (string format) |

### Common CALCULATE Filter Patterns

From MOL file, most CALCULATE uses simple equality filters:
- `CALCULATE([Measure], 'Table'[Column] = "value")` - 60+ occurrences
- `CALCULATE([Measure], 'Table'[Column] IN {"v1", "v2"})` - 10+ occurrences

These are deferred as they require complex filter context handling.

---

## Non-Goals

- CALCULATE with dimension equality filters (`Table[Col] = "value"`) - complex filter context
- CALCULATE with IN filters (`Table[Col] IN {values}`) - complex filter context
- Iterator functions (SUMX, AVERAGEX, MAXX) - require row context
- Filter introspection (HASONEVALUE, ISFILTERED, ISCROSSFILTERED) - no MDX equivalent
- Table functions (VALUES, DISTINCT) - return tables, not scalars
- Calculation groups (SELECTEDMEASURE) - different architecture in AtScale
- DATATABLE - table creation not applicable
- FORMAT - string formatting complexity
- EDATE - date arithmetic (lower priority)

## Technical Considerations

### Dimension Reference Resolution

```typescript
function resolveDimensionHierarchy(
  tableName: string,
  columnName: string,
  result: SmlConverterResult
): string | undefined {
  // Lookup: search dimensions for matching dataset
  for (const dim of result.dimensions) {
    if (dim.dataset?.includes(tableName) || dim.label === tableName) {
      const hierarchyName = dim.hierarchies?.[0]?.name || dim.unique_name;
      return `[${dim.unique_name}].[${hierarchyName}]`;
    }
  }
  // Fallback: convention-based
  return `[dimension.${tableName}].[${tableName}]`;
}
```

### AtScale MDX Time Intelligence

Supported per CLAUDE.md:
- `DatesMTD`, `DatesQTD`, `DatesYTD`, `DatesWTD`
- `ParallelPeriod`, `PeriodsToDate`
- `Lag`, `Lead`, `PrevMember`, `NextMember`

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Conversion Rate | 44% | 50%+ |
| Time Intelligence (YTD/MTD/QTD) | 0/3 | 3/3 |
| Period Comparison (SPLY/PrevMonth/Parallel) | 0/3 | 3/3 |
| Semi-additive (ClosingBalance/LastNonBlank) | 0/2 | 2/2 |
| Date Offset (DATEADD) | 0/1 | 1/1 |
| Error Handling (IFERROR) | 0/1 | 1/1 |
| Confidence | - | 0.85+ all |

## Rollback Strategy

Each template in separate file. To rollback:
1. Remove import from `template-registry.ts`
2. Move function to `unconvertible` in `function-mappings.json`
3. Re-skip test in `pbi-smoke.test.ts`
