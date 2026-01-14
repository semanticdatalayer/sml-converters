# PRD: Calculation Group Exclusion & IN Operator Conversion

## Introduction

Enhance BIM-to-SML conversion to properly handle calculation groups and the DAX IN operator. Calculation groups in Power BI have no direct SML equivalent, so they and any measures depending on them must be excluded from conversion with clear TODO markers. Additionally, the DAX IN operator needs conversion to MDX IIF/OR chains for proper execution.

## Goals

- Skip conversion of BIM calculation group tables entirely
- Mark measures using calculation groups as `TODO uses calculationgroup:` instead of attempting conversion
- Build transitive dependency tracking so measures referencing calc-group-dependent measures are also marked
- Convert DAX `IN {val1, val2}` patterns to MDX `IIF(col = "a" OR col = "b", ...)`
- Convert DAX `NOT IN` patterns to MDX `IIF(col <> "a" AND col <> "b", ...)`
- Fix all validation errors in both test files (MOL_bim_from_xmla.json and dw_test_model.bim)
- Update test script to report `calculationgroup` as a distinct TODO category

## User Stories

### US-001: Detect calculation group tables in BIM

**Description:** As a converter, I need to identify which BIM tables are calculation groups so I can exclude them from conversion.

**Acceptance Criteria:**
- [x] Add `isCalculationGroupTable(table)` utility function in `table-converter.ts`
- [x] Function returns true if table has `calculationGroup` property
- [x] Collect calculation group table names into a Set during table classification
- [x] Store calc group table names in `TableLists` structure
- [x] Typecheck passes

### US-002: Skip calculation group table conversion

**Description:** As a converter, I want to skip creating dimensions/datasets for calculation group tables since they have no SML equivalent.

**Acceptance Criteria:**
- [x] `DimensionConverter` skips tables in calc group Set
- [x] `DatasetConverter` skips tables in calc group Set
- [x] No SML output generated for calc group tables
- [x] Log info message when skipping calc group table
- [x] Typecheck passes

### US-003: Mark direct calc group references as TODO

**Description:** As a converter, I want measures that directly reference calculation groups to be marked with a specific TODO comment.

**Acceptance Criteria:**
- [x] Detect calc group table names (from `calculationGroup` property) in DAX expressions
- [x] Detect `SELECTEDMEASURE()` function usage in any measure (not just calc groups)
- [x] Return early from conversion with `TODO uses calculationgroup: {reason}` comment
- [x] Format: `0 /* TODO uses calculationgroup: references 'CG - Time Intelligence' */`
- [x] Typecheck passes

### US-004: Build measure dependency graph

**Description:** As a converter, I need to track which measures reference other measures so I can find transitive calc group dependencies.

**Acceptance Criteria:**
- [ ] Create `MeasureDependencyTracker` class in new file `measure-dependency-tracker.ts`
- [ ] Parse measure expressions to extract `[MeasureName]` references
- [ ] Build Map of measure name → Set of referenced measure names
- [ ] Provide `getDependencies(measureName)` method
- [ ] Typecheck passes

### US-005: Mark transitive calc group dependencies as TODO

**Description:** As a converter, I want measures that indirectly reference calc-group-dependent measures to also be marked as TODO.

**Acceptance Criteria:**
- [ ] `MeasureDependencyTracker` has `usesCalculationGroup(measureName)` method
- [ ] Method recursively checks if any dependency uses calc groups
- [ ] Use visited Set to prevent infinite loops on circular references
- [ ] Log warning if circular reference detected
- [ ] Cache results to avoid recomputation
- [ ] Mark with `TODO uses calculationgroup: references [DependentMeasure] which uses calculationgroup` (immediate ref only)
- [ ] Typecheck passes

### US-006: Integrate dependency tracking into measure conversion

**Description:** As a converter, I want the dependency tracker integrated into the conversion flow.

**Acceptance Criteria:**
- [ ] Initialize `MeasureDependencyTracker` in `BimToYamlConverter.convert()`
- [ ] First pass: scan all measures to build dependency graph
- [ ] Second pass: mark calc-group-dependent measures before conversion
- [ ] Pass tracker to `MeasureConverter`
- [ ] Check tracker before attempting DAX conversion
- [ ] Typecheck passes

### US-007: Create IN operator template

**Description:** As a converter, I want to convert DAX IN operator to MDX IIF/OR chains.

**Acceptance Criteria:**
- [ ] Create `InOperatorTemplate` class in `conversion-templates/templates/in-operator-template.ts`
- [ ] Match pattern: `column IN { val1, val2, ... }`
- [ ] Single-value `col IN {"a"}` simplifies to `col = "a"`
- [ ] Multi-value converts to: `IIF(col = "val1" OR col = "val2" OR ..., 1, 0)` when standalone
- [ ] Empty sets `col IN {}` → leave as TODO
- [ ] Non-literal values in set (e.g., `[OtherCol]`) → leave as TODO
- [ ] Handle string and numeric literal values
- [ ] Confidence level: 0.95
- [ ] Typecheck passes

### US-008: Handle IN operator in CALCULATE context

**Description:** As a converter, I want IN operators inside CALCULATE to convert to filter expressions.

**Acceptance Criteria:**
- [ ] Detect IN operator as CALCULATE filter argument
- [ ] Convert `CALCULATE([Measure], col IN {a, b})` appropriately
- [ ] Output uses OR chain in filter context
- [ ] Works with existing CalculateTemplate
- [ ] Typecheck passes

### US-009: Handle NOT IN operator conversion

**Description:** As a converter, I want NOT IN patterns to convert to AND chains with not-equals.

**Acceptance Criteria:**
- [ ] Detect `NOT ( col IN { ... } )` pattern
- [ ] Convert to `IIF(col <> "val1" AND col <> "val2" AND ..., 1, 0)`
- [ ] Handle in both standalone and CALCULATE contexts
- [ ] Typecheck passes

### US-010: Register IN operator template

**Description:** As a converter, I want the IN operator template registered in the pipeline.

**Acceptance Criteria:**
- [ ] Register `InOperatorTemplate` in `TemplateRegistry`
- [ ] Template is tried during Stage 3 (template conversion)
- [ ] Order correctly relative to other templates
- [ ] Typecheck passes

### US-011: Add calculationgroup category to test script

**Description:** As a developer, I want the test script to report calculation group TODOs as a separate category so I can track calc-group-dependent measures distinctly.

**Acceptance Criteria:**
- [ ] Add `calculationgroup` to `TodoBreakdown` interface in `scripts/test-custom-calcs.ts`
- [ ] Update `categorizeTodoFunctionMulti()` to detect `TODO uses calculationgroup:` prefix
- [ ] Category triggers on expressions containing "TODO uses calculationgroup"
- [ ] Add calculationgroup line to summary output in `printSummary()`
- [ ] Typecheck passes

### US-012: Run test-custom-calcs on MOL file and capture errors

**Description:** As a developer, I need to identify all validation errors in the MOL test file.

**Acceptance Criteria:**
- [ ] Run `npm run test-custom-calcs -- --input test-files/MOL_bim_from_xmla.json`
- [ ] Document all validation errors found
- [ ] Categorize errors by type (schema, reference, syntax)
- [ ] Typecheck passes

### US-013: Run test-custom-calcs on dw_test_model and capture errors

**Description:** As a developer, I need to identify all validation errors in the dw_test_model file.

**Acceptance Criteria:**
- [ ] Run `npm run test-custom-calcs -- --input test-files/dw_test_model.bim`
- [ ] Document all validation errors found
- [ ] Categorize errors by type
- [ ] Typecheck passes

### US-014: Fix validation errors in MOL conversion

**Description:** As a developer, I want to fix all validation errors found in MOL file conversion.

**Acceptance Criteria:**
- [ ] Fix each documented error from US-012
- [ ] Re-run validation to confirm fixes
- [ ] No validation errors remain
- [ ] Typecheck passes

### US-015: Fix validation errors in dw_test_model conversion

**Description:** As a developer, I want to fix all validation errors found in dw_test_model conversion.

**Acceptance Criteria:**
- [ ] Fix each documented error from US-013
- [ ] Re-run validation to confirm fixes
- [ ] No validation errors remain
- [ ] Typecheck passes

### US-016: Final validation of both test files

**Description:** As a developer, I want to confirm both test files convert and validate successfully.

**Acceptance Criteria:**
- [ ] `npm run test-custom-calcs -- --input test-files/MOL_bim_from_xmla.json` passes
- [ ] `npm run test-custom-calcs -- --input test-files/dw_test_model.bim` passes
- [ ] Calc group measures show `TODO uses calculationgroup:` prefix
- [ ] IN operator patterns convert to IIF/OR chains
- [ ] Typecheck passes

## Non-Goals

- Converting calculation group items to SML calculation groups (architectural mismatch)
- Converting SELECTEDMEASURE() to any MDX equivalent
- Handling nested IN operators (e.g., `col1 IN {a} AND col2 IN {b}`) - each converts independently
- Performance optimization of dependency tracking
- AI/LLM conversion of calc group patterns

## Technical Considerations

- `TableLists` struct needs new `calcGroupTables: Set<string>` field
- Dependency tracker should be initialized early, before any measure conversion
- IN operator template needs access to BraceToken parsing (already exists in dax-converter.ts)
- TODO comment format change: `TODO uses calculationgroup:` vs existing `TODO:`
- Must preserve existing conversion behavior for non-calc-group measures
- Test script `categorizeTodoFunctionMulti()` needs new category detection for `TODO uses calculationgroup:`

## Design Decisions

**IN Operator Edge Cases:**
1. **Empty sets `col IN {}`** → Leave as TODO (rare edge case)
2. **Single-value sets `col IN {"a"}`** → Simplify to `col = "a"`
3. **Non-literal values `col IN {[OtherCol], "a"}`** → Leave as TODO (too complex)

**Calculation Group Detection:**
4. **SELECTEDMEASURE() in regular measures** → Mark as TODO (no MDX equivalent regardless of location)
5. **Detection method** → Use `calculationGroup` property only (no string matching)

**Dependency Tracking:**
6. **Circular references** → Add visited Set to prevent infinite loops, log warning if detected
7. **Transitive message detail** → Show immediate reference only: `references [B] which uses calculationgroup`

**Scope:**
8. **Major refactoring for validation errors** → Document as separate issue if >50 lines changed
9. **Success metrics** → No specific conversion rate target; verify calc group TODOs and IN operator conversion work
