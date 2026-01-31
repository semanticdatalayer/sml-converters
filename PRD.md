# PRD: Handle BIM Files with No Relationships

## Introduction

When a Power BI BIM file has NO relationships defined between tables, the current converter marks all tables as "unused" and excludes them. This PRD addresses the scenario where standalone tables should instead be treated as fact tables, with aggregatable columns becoming metrics and non-aggregatable columns becoming degenerate dimensions.

**Context:** This follows from previous PRD where Trek_bim.json was identified as needing new functionality because it has 4 tables but no relationships.

## Goals

- Detect when a BIM model has no relationships (empty or missing `relationships` array)
- Convert standalone tables as fact tables instead of excluding them
- Create implicit metrics from columns with `summarizeBy` aggregation hints
- Create degenerate dimensions from non-aggregatable columns
- Validate generated SML and deploy Trek_bim.json successfully

## User Stories

### US-001: Detect No-Relationships Scenario

**Description:** As a converter, I need to detect when a BIM model has no relationships so I can apply standalone table handling.

**Acceptance Criteria:**
- [x] Add `hasNoRelationships(bim: BimRoot): boolean` method to TableConverter
- [x] Returns true when `relationships` array is missing, undefined, or empty
- [x] When no relationships exist, skip the `listUnusedNoRelationships()` logic that marks tables as unused
- [x] Tables excluded via `isPrivate: true` or `isHidden: true` (DateTableTemplate) remain excluded
- [x] Add info log: "No relationships found in model - treating tables as standalone facts"
- [x] Typecheck passes
- [x] Run `npm run test-custom-calcs` passes

---

### US-002: Classify Standalone Tables as Facts

**Description:** As a converter, I need to classify all non-excluded tables as fact tables when no relationships exist.

**Acceptance Criteria:**
- [x] Modify `populateTableLists()` to check for no-relationships scenario
- [x] When no relationships, add all non-excluded tables to `factTables` array
- [x] Leave `dimTables` empty when no relationships (dimensions come from degenerate dims later)
- [x] Existing table exclusion logic (calcGroupTables, isPrivate, isHidden, variationsOnly) still applies
- [x] Typecheck passes
- [x] Run `npm run test-custom-calcs` passes

---

### US-003: Create Implicit Metrics from Aggregatable Columns

**Description:** As a converter, I need to create metrics from columns that have `summarizeBy` aggregation hints.

**Acceptance Criteria:**
- [x] In MeasureConverter, add method to create metrics from columns with `summarizeBy` in ["sum", "count", "average", "min", "max", "distinctcount"]
- [x] Call this method for standalone fact tables after dataset creation
- [x] Metric `unique_name` uses existing naming conventions (e.g., `m_<table>.<column>`)
- [x] Metric uses appropriate SML `calculation_method` based on `summarizeBy` value
- [x] Skip columns with `summarizeBy: "none"` - these become degenerate dimension attributes
- [x] Typecheck passes
- [x] Run `npm run test-custom-calcs` passes

---

### US-004: Create Degenerate Dimensions from Non-Aggregatable Columns

**Description:** As a converter, I need to create degenerate dimensions from columns that don't have aggregation hints.

**Acceptance Criteria:**
- [x] In standalone fact scenario, identify columns with `summarizeBy: "none"` or missing summarizeBy
- [x] For each standalone fact table with such columns, create a degenerate dimension
- [x] Degenerate dimension contains level attributes from non-aggregatable columns
- [x] Add to `tableLists.degenDims` set so existing `createDegenDimensions()` flow handles them
- [x] Link degenerate dimension to fact dataset via `is_degenerate: true` (level_attribute references same dataset)
- [x] Typecheck passes
- [x] Run `npm run test-custom-calcs` passes

---

### US-005: Test Trek_bim.json Conversion and Deploy

**Description:** As a developer, I need to validate Trek_bim.json conversion produces valid SML and deploys.

**Acceptance Criteria:**
- [x] Run bim-to-sml conversion on `/Users/dianne/Downloads/bim/testfiles/Trek_bim.json`
- [x] Conversion completes without errors
- [x] Output contains datasets for: SSRS, "Cubes & Users", "Total Number Cube Users"
- [x] DateTableTemplate is excluded (isPrivate: true)
- [x] Deploy using `pnpm pbi-deploy /Users/dianne/Downloads/bim/testfiles/Trek_bim.json` from `/Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter`
- [x] Deployment successful: Trek_bim_30becb81
- [x] Typecheck passes

## Non-Goals

- Do not change behavior for BIM files that HAVE relationships (existing logic unchanged)
- Do not convert hidden/private DateTableTemplate tables
- Do not create relationships between standalone tables (they remain independent facts)
- Do not handle partial relationship scenarios (some tables with relationships, some without) - this is all-or-nothing

## Technical Considerations

**Key Files to Modify:**
- `src/commands/bim-to-sml/bim-converter/table-converter.ts` - Detection and classification
- `src/commands/bim-to-sml/bim-converter/measure-converter.ts` - Implicit metrics from columns
- `src/commands/bim-to-sml/bim-converter/dimension-converter.ts` - Degenerate dimensions
- `src/commands/bim-to-sml/bim-converter/bim-to-sml-converter.ts` - Orchestration

**Existing Patterns to Reuse:**
- `createDegenDimensions()` in DimensionConverter for degenerate dimension creation
- `tableLists.degenDims` set tracks which tables need degenerate dimensions
- `SmlConvertResultBuilder` for adding new objects
- `makeUniqueName()` for unique name generation

**Trek_bim.json Structure:**
- 4 tables total, 1 excluded (DateTableTemplate via isPrivate/isHidden)
- 3 convertible tables: SSRS, "Cubes & Users", "Total Number Cube Users"
- "Cubes & Users" has one explicit measure (`Today = NOW()`)
- Columns have `summarizeBy: "sum"` (aggregatable) or `summarizeBy: "none"` (degenerate dim)

**summarizeBy Mapping:**
| BIM summarizeBy | SML Aggregation |
|-----------------|-----------------|
| sum | Sum |
| count | Count |
| average | Avg |
| min | Min |
| max | Max |
| distinctcount | DistinctCount |
| none | (degenerate dimension attribute) |
