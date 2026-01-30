# PRD: Fix N/A String-as-Null Pattern in DAX→MDX Conversion

## Introduction

DAX commonly uses strings like `"N/A"` as semantic null indicators in numeric contexts. When converted to MDX, these patterns cause type mismatches because MDX IIF requires both branches to have the same type. The converter needs to:
1. Convert string placeholders (`"N/A"`) to `NULL` in return values (already done)
2. Convert conditions comparing to `"N/A"` into `ISEMPTY()` checks (missing)

Error from deployment:
```
IfFunction requires both results to be of the same type:
[ConstantValue[StringType](N/A): StringType] ,
[SwitchConditional(...): IntType]
```

## Goals

- Fix type mismatch errors when deploying converted BIM files to AtScale
- Handle the pattern `IF([Measure] = "N/A", "N/A", ...)` → `IIF(ISEMPTY([Measures].[Measure]), NULL, ...)`
- Apply consistently across IF, SWITCH, and related templates
- Preserve semantic equivalence between DAX and converted MDX

## User Stories

### US-001: Detect N/A equality comparisons in IF conditions

**Description:** As a converter, I need to detect when an IF condition compares a measure/expression to a null placeholder string so I can transform it appropriately.

**Acceptance Criteria:**
- [x] Add helper method `transformNullPlaceholderComparison(conditionMdx: string)` to IfTemplate
- [x] Method returns transformed condition when it matches pattern `<expr> = "N/A"` (or other placeholders)
- [x] Transforms `[Measures].[X] = "N/A"` → `ISEMPTY([Measures].[X])`
- [x] Method handles both `<expr> = "N/A"` and `"N/A" = <expr>` orderings
- [x] Typecheck passes
- [x] Run `npm run test-custom-calcs` passes

### US-002: Transform N/A comparisons to ISEMPTY in IfTemplate

**Description:** As a converter, I need to transform conditions like `[Measure] = "N/A"` into `ISEMPTY([Measures].[Measure])` so the MDX is semantically correct.

**Acceptance Criteria:**
- [x] In `convert()`, after converting condition, call `transformNullPlaceholderComparison()`
- [x] If pattern detected, use transformed condition
- [x] Existing null-placeholder-to-NULL conversion for result branches continues to work
- [x] Typecheck passes
- [x] Run `npm run test-custom-calcs` passes

### US-003: Validate mol.bim.json conversion and deploy

**Description:** As a user, I need the `Total margin with SC - change compared to plan (%)` calculation to convert and deploy without errors.

**Acceptance Criteria:**
- [x] Run conversion on `/Users/dianne/Downloads/bim/currenttest/mol.bim.json`
- [x] Verify calculation uses `ISEMPTY()` instead of `= "N/A"` comparison
- [x] Run `pnpm pbi-deploy /Users/dianne/Downloads/bim/currenttest/mol.bim.json` from `/Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter`
- [x] If new error occurs, create follow-up story and repeat
- [ ] Continue until deploy succeeds or 20 iterations reached
- [x] Typecheck passes

**Result:** Deploy failed with NEW error - see US-004 for follow-up.

### US-004: Handle mixed-type SWITCH with UI label strings

**Description:** As a converter, I need to handle DAX SWITCH statements that return both string labels (e.g., "CAPEX UTILISATION") and numeric measures in different cases.

**Background:**
DAX pattern found: `SWITCH([Selector], 1, "CAPEX UTILISATION", 2, [NumericMeasure], 3, "N/A", ...)`
- Case 1 returns a UI label string for display headers
- Case 2 returns a numeric measure
- Cases 3+ return "N/A" (null placeholders) - these correctly convert to NULL

Error from deployment:
```
IfFunction requires both results to be of the same type:
[ConstantValue[StringType](CAPEX UTILISATION): StringType] ,
[SwitchConditional(...): DoubleType]
```

**Acceptance Criteria:**
- [ ] Detect when SWITCH has mixed string label + numeric results
- [ ] Convert non-null-placeholder strings (like "CAPEX UTILISATION") to NULL in numeric contexts
- [ ] Typecheck passes
- [ ] Run `npm run test-custom-calcs` passes
- [ ] Run `pnpm pbi-deploy` on mol.bim.json and verify error is resolved

## Non-Goals

- Not handling arbitrary DAX string comparisons - only null placeholder patterns
- Not modifying IFERROR template (already handles fallback values correctly)
- Not adding new null placeholder strings beyond existing set

## Technical Considerations

- Existing `NULL_PLACEHOLDER_STRINGS` set: `["N/A", "n/a", "NA", "na", "-", ""]`
- MDX string literals use double quotes: `"N/A"`
- Pattern to detect: `<expr> = "placeholder"` or `"placeholder" = <expr>`
- `ISEMPTY()` is the MDX function for null checking (AtScale supported)
- Condition comes through `convertSubExpression()` - transform at string level
