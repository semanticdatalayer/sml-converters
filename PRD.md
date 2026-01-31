# PRD: Type-Aware TODO Stub Generation

## Introduction

The BIM-to-SML converter generates TODO stubs for unsupported DAX functions. Currently, boolean-returning functions like `HASONEVALUE` use `1` as the stub value. This works in numeric contexts (`2088 * [HasOneCurrency]`) but fails in boolean contexts (`[HasOneCurrency] AND [Other]`) because MDX requires `BooleanType` for AND/OR operators, not `IntType`.

This feature adds expression tree type inference to detect usage context and generate appropriate stubs. When a measure appears in both contexts, it creates duplicate measures with type-specific stubs.

## Goals

- Eliminate "AndOperator requires arguments of type BooleanType" errors from TODO stubs
- Detect usage context (numeric vs boolean) for each measure reference
- Generate type-appropriate stubs: `1` for numeric, `(1 = 1)` for boolean
- When dual-context usage detected, duplicate measure with `_num` and `_bool` suffixes
- Provide clear warning messages when duplication occurs

## User Stories

### US-001: Create type system foundation

**Description:** As a developer, I need a type system module so that type inference can be built on solid foundations.

**Acceptance Criteria:**
- [x] Create `src/commands/bim-to-sml/bim-converter/type-inference.ts`
- [x] Define `MdxType` enum with values: `BOOLEAN`, `NUMERIC`, `UNKNOWN`
- [x] Define `UsageContext` interface to track measure → types mapping
- [x] Export utility functions: `createUsageContext()`, `recordUsage()`, `getUsageTypes()`
- [x] Typecheck passes

---

### US-002: Implement operator type rules

**Description:** As a developer, I need type rules for MDX operators so the system knows what types each operator expects and returns.

**Acceptance Criteria:**
- [x] Create `getOperatorExpectedType(op: string): MdxType` function
- [x] Create `getOperatorReturnType(op: string): MdxType` function
- [x] AND, OR, NOT → expect BOOLEAN, return BOOLEAN
- [x] Arithmetic (+,-,*,/,^) → expect NUMERIC, return NUMERIC
- [x] Comparisons (>,<,=,<>,>=,<=) → expect NUMERIC, return BOOLEAN
- [x] Typecheck passes

---

### US-003: Add type inference to expression tree traversal

**Description:** As a developer, I need to propagate type expectations through the expression tree so each node knows its expected type.

**Acceptance Criteria:**
- [x] Create `inferTypes(expression: string, context: UsageContext): void` function
- [x] Parse expression and walk the tree, passing expected types downward
- [x] When measure reference encountered, record its expected type in context
- [x] Handle nested expressions (e.g., `IF(A AND B, X * Y, Z)`)
- [x] Typecheck passes

---

### US-004: Integrate type context into conversion pipeline

**Description:** As a developer, I need the conversion pipeline to track measure usage across all expressions so dual-context measures can be identified.

**Acceptance Criteria:**
- [x] Modify `ConversionPipeline` to accept and pass `UsageContext`
- [x] First pass: collect all measure usages with their expected types
- [x] Store context in `MeasureConverter` for use during stub generation
- [x] Typecheck passes

---

### US-005: Generate type-appropriate TODO stubs

**Description:** As a developer, I need stub generation to use the correct value based on usage context so MDX type checking passes.

**Acceptance Criteria:**
- [x] Modify `getFallbackValue()` to accept optional `MdxType` parameter
- [x] Return `1` for NUMERIC or UNKNOWN context
- [x] Return `(1 = 1)` for BOOLEAN-only context
- [x] Update `createFallback()` in pipeline to use type-aware generation
- [x] Typecheck passes

---

### US-006: Implement measure duplication for dual-context usage

**Description:** As a user, I want measures used in both numeric and boolean contexts to be automatically split so both usages work correctly.

**Acceptance Criteria:**
- [x] Detect when a measure has both NUMERIC and BOOLEAN usages
- [x] Create `[OriginalName_num]` measure with `1` stub
- [x] Create `[OriginalName_bool]` measure with `(1 = 1)` stub
- [x] Add comment to both explaining they were split from original
- [x] Log warning message listing split measures
- [x] Typecheck passes

---

### US-007: Rewrite references to use split measures

**Description:** As a developer, I need references to split measures updated to use the appropriate version so the generated MDX is valid.

**Acceptance Criteria:**
- [x] After identifying dual-context measures, do second pass over expressions
- [x] Replace `[MeasureName]` with `[MeasureName_num]` in numeric contexts
- [x] Replace `[MeasureName]` with `[MeasureName_bool]` in boolean contexts
- [x] Preserve original expression in TODO comment for user reference
- [x] Typecheck passes

---

### US-008: Verify with PFM_from_Daniel_bim.json

**Description:** As a developer, I need to verify the fix works with the known problematic file.

**Acceptance Criteria:**
- [x] Run conversion on PFM_from_Daniel_bim.json
- [x] No "AndOperator requires BooleanType" errors in output
- [x] Split measures are correctly generated for dual-context cases
- [x] Numeric contexts still evaluate correctly (stub * value = value)
- [x] Run `npm run test-custom-calcs` - all tests pass
- [x] Typecheck passes

## Non-Goals

- Retroactive repair of existing converted files
- Full DAX-to-MDX type system (only what's needed for stubs)
- Handling types beyond BOOLEAN/NUMERIC (e.g., STRING, DATE)
- Automatic resolution of TODO stubs (still requires user intervention)

## Technical Considerations

- Expression parsing already exists in `dax-converter.ts` token classes
- Type inference should be a separate module to avoid cluttering existing code
- Two-pass approach: first collect usages, then generate with context
- Keep existing `isBooleanReturningExpression()` as fallback for simple cases
- `(1 = 1)` is valid MDX boolean TRUE that works in all boolean contexts

**Key Files to Modify:**
- `src/commands/bim-to-sml/bim-converter/tools.ts` - Boolean detection, fallback values
- `src/commands/bim-to-sml/bim-converter/conversion-pipeline.ts` - Stage 6 fallback
- `src/commands/bim-to-sml/bim-converter/measure-converter.ts` - Measure generation
- `src/commands/bim-to-sml/bim-converter/dax-converter.ts` - Token type inference
- New: `src/commands/bim-to-sml/bim-converter/type-inference.ts` - Type system
