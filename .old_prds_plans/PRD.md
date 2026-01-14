# PRD: BIM Calculation Group Support & Metric Name Resolution

## Introduction

The BIM-to-SML converter fails validation when processing BIM files containing Power BI Calculation Groups. The MOL_bim_from_xmla.json file produces 442 validation errors:
- **367 errors**: Missing "Time calculation name" metric (from CG - Time Intelligence calculation group)
- **75 errors**: Metric name mismatches due to whitespace differences (e.g., "Number of  fresh sandwiches" vs "Number of fresh sandwiches")

This PRD adds support for Power BI Calculation Groups by converting them to SML Dimension Calculation Groups, and fixes metric name resolution by normalizing whitespace.

## Goals

- Convert MOL_bim_from_xmla.json with zero validation errors
- Add support for Power BI Calculation Groups (BIM `calculationGroup` property)
- Normalize whitespace in metric name lookups and references
- Maintain backwards compatibility with existing BIM files without calculation groups

## User Stories

### US-001: Parse BIM Calculation Group tables

**Description:** As a developer, I need to identify and parse BIM tables that contain calculation groups so their structure can be used during conversion.

**Acceptance Criteria:**

- [ ] BimFileParser extracts tables with `calculationGroup` property
- [ ] Calculation group data includes: name, precedence, columns (especially the "name" column), and calculationItems
- [ ] Each calculationItem has: name, expression (DAX), ordinal
- [ ] Tables with `calculationGroup` are flagged as calculation group tables (not fact/dimension)
- [ ] Typecheck passes

### US-002: Skip calculation group tables from standard dimension/fact conversion

**Description:** As a developer, I need calculation group tables excluded from normal table conversion since they're handled specially.

**Acceptance Criteria:**

- [ ] TableConverter identifies calculation group tables via `calculationGroup` property
- [ ] Calculation group tables are NOT converted as dimensions or fact datasets
- [ ] Calculation group tables are NOT included in relationship analysis
- [ ] Warning logged: "Calculation group table 'X' will be converted to SML calculation group"
- [ ] Typecheck passes

### US-003: Create Calculation Group Converter

**Description:** As a developer, I need a new converter that transforms BIM calculation groups into SML dimension calculation groups.

**Acceptance Criteria:**

- [ ] New file: `src/commands/bim-to-sml/bim-converter/calculation-group-converter.ts`
- [ ] Converter maps BIM calculationGroup to SMLDimensionCalculationGroup structure
- [ ] Maps BIM `precedence` to SML `precedence`
- [ ] Maps BIM calculationItems to SML `calculated_members`
- [ ] Uses existing DAX converter for item expressions (where possible)
- [ ] Unconvertible expressions marked with TODO placeholder
- [ ] Typecheck passes

### US-004: Map calculation group items to SML templates where applicable

**Description:** As a developer, I want calculation items that match known patterns to use SML templates instead of raw MDX expressions.

**Acceptance Criteria:**

- [ ] `SELECTEDMEASURE()` alone maps to template: `Current`
- [ ] `TOTALYTD(SELECTEDMEASURE(), ...)` maps to template: `YearToDate`
- [ ] `TOTALMTD(SELECTEDMEASURE(), ...)` maps to template: `MonthToDate`
- [ ] `TOTALQTD(SELECTEDMEASURE(), ...)` maps to template: `QuarterToDate`
- [ ] Items referencing `SAMEPERIODLASTYEAR` map to template: `LastYear`
- [ ] Items with `PrevMember` or `Lag(1)` map to template: `Previous`
- [ ] Unrecognized patterns convert expression or use TODO placeholder
- [ ] Typecheck passes

### US-005: Attach calculation groups to appropriate dimension

**Description:** As a developer, I need calculation groups attached to the appropriate dimension in SML output.

**Acceptance Criteria:**

- [ ] Calculation groups attached to dimension based on relationships or date column references
- [ ] CG tables referencing Calendar dimension attach to the Calendar dimension
- [ ] If no clear dimension match, create standalone calculation group dimension
- [ ] Multiple calculation groups can attach to same dimension
- [ ] SML output includes `calculation_groups` property on dimension
- [ ] Typecheck passes

### US-006: Create dimension attribute for calculation group name column

**Description:** As a developer, I need the calculation group's "name" column (e.g., "Time calculation name") to be a queryable dimension attribute.

**Acceptance Criteria:**

- [ ] Each calculation group creates a hierarchy level from its name column
- [ ] Level name matches BIM column name (e.g., "Time calculation name")
- [ ] Level members are the calculation item names (Actual, Base, Plan, etc.)
- [ ] Attribute is queryable in inbound queries
- [ ] References like `[CG - Time Intelligence].[Time calculation name]` resolve correctly
- [ ] Typecheck passes

### US-007: Normalize whitespace in metric name storage

**Description:** As a developer, I need metric names normalized when stored in the lookup map to handle whitespace variations.

**Acceptance Criteria:**

- [ ] New utility function: `normalizeMetricName(name: string): string`
- [ ] Function: lowercases, trims, and collapses multiple spaces to single space
- [ ] Metric lookup keys use normalized names
- [ ] Example: "Number of  fresh sandwiches" and "Number of fresh sandwiches" produce same key
- [ ] Typecheck passes

### US-008: Normalize whitespace in metric reference lookups

**Description:** As a developer, I need metric references in DAX expressions to use normalized names for lookup.

**Acceptance Criteria:**

- [ ] dax-converter.ts normalizes metric names when looking up references
- [ ] ColumnReference.toMdx() normalizes before lookup
- [ ] TableColumnReference.toMdx() normalizes before lookup
- [ ] Expression references resolve even with whitespace differences
- [ ] Typecheck passes

### US-009: Handle CALCULATE filters referencing calculation group columns

**Description:** As a developer, I need CALCULATE expressions that filter on calculation group columns to convert correctly.

**Acceptance Criteria:**

- [ ] Pattern: `CALCULATE([measure], 'CG - X'[Column] = "Value")` recognized
- [ ] Converts to tuple expression or IIF with dimension member reference
- [ ] Example: `CALCULATE([Sales], 'CG - Time Intelligence'[Time calculation name] = "Base")`
- [ ] Converts to: `([CG - Time Intelligence].[Time calculation name].&[Base], [Measures].[Sales])`
- [ ] Fallback to TODO if pattern not recognized
- [ ] Typecheck passes

### US-010: Add tests for calculation group conversion

**Description:** As a developer, I need tests validating calculation group conversion works correctly.

**Acceptance Criteria:**

- [ ] Test file with sample BIM calculation group converts without errors
- [ ] Calculation groups appear in SML dimension output
- [ ] Calculation items have correct expressions or templates
- [ ] Run `npm run test-custom-calcs` on MOL_bim_from_xmla.json passes validation
- [ ] Typecheck passes

## Non-Goals

- Full DAX-to-MDX conversion for all calculation item expressions (complex expressions get TODO)
- Converting calculation groups that don't reference Calendar/Date dimensions to time-based templates
- Automatic detection of semantic meaning of calculation groups
- Supporting SELECTEDMEASURENAME() or other advanced calculation group functions

## Technical Considerations

- SML SDK already has `SMLDimensionCalculationGroup` and `SMLDimensionCalculationMember` types
- SML templates in `SMLCalculationMembersTemplatesIds` map to common time intelligence patterns
- Calculation group "precedence" determines evaluation order when multiple groups apply
- The "name" column in calculation groups must become a queryable dimension attribute for filters to work
- BIM calculation groups reference `SELECTEDMEASURE()` which has no direct MDX equivalent - use templates where possible
