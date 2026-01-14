## BIM Conversion Specifics

**Testing BIM Conversions:**

```bash
# Test directory of BIM files and generate report
npm run test-conversion -- --input /path/to/bim/files --output results.json

# Compare against baseline to detect regressions
npm run test-conversion -- --input ./test-bim --baseline baseline.json --diff changes.json

# Test with LLM conversion enabled
npm run test-conversion -- --input ./test-bim --llm openai --output results.json
```

See `scripts/README.md` for full testing documentation.

**AI-Powered DAX Conversion:**

- Optional LLM-based DAX → MDX expression conversion
- Located: `src/commands/bim-to-sml/bim-converter/ai-dax-converter.ts`
- Requires: `--llmName` flag (e.g., "openai", "anthropic")
- Environment variables: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- Uses: `@ax-llm/ax` library for LLM integration

**Direct DAX Conversion:**

- BIM DAX expressions are converted to AtScale MDX when there is confidence the resulting MDX will execute and return the same results as the original dax
- SML metric_calc expressions use AtScale MDX, based on Microsoft's MDX standard, but with differences
- Only the following supported AtScale MDX functions should be used. Others are considered unsupported: Abs, Aggregate, ALL, ALLMEMBER, ALLMEMBEREXCEPT, Ancestor, Arithmetic Operators (MDX), Avg (MDX), CASE, CBOOL, CDBL, CDEC, Ceiling, Children, CINT, CLONG, Comparison Operators (MDX), Count (Set), Crossjoin, CSTR, CURRENTMEMBER.NAME, DatesMTD, DatesPeriodsToDate, DatesQTD, DatesWTD, DatesYTD, Day, Descendants, DIMENSION_UNIQUE_NAME, DIVIDE, E, Except, Exp, ExtractMember, FirstChild, FirstSibling, Floor, Head, HIERARCHY_UNIQUE_NAME, Hour, IIF, INSTR, Intersect, ISEMPTY, KEY, Lag, LastChild, LastSibling, Lead, Left, Len, LEVEL_NUMBER, LEVEL_UNIQUE_NAME, Level, Log, Log10, Log2, Logical Operators (MDX), Max (MDX), MEMBER_CAPTION, MEMBER_KEY, MEMBER_LEVEL_NUMBER, MEMBER_NAME, Members, Mid, Min (MDX), Minute, Month, NextMember, NonEmpty, Not, Now, NULLEXCEPT, ParallelPeriod, PARENT_COUNT, PARENT_LEVEL, Parent, PeriodsToDate, Pi, POW, PrevMember, Properties, Rand, Right, Round, Second, Set Operators (MDX), Siblings, Sign, SQLSUM, Sum (MDX), Tail, Trigonometric Functions, TRIM | LTRIM | RTRIM, Truncate, Tuple Expressions, UCASE | LCASE, Union, VBA Date Functions, XIRR, Year
- Converted MDX should never use functions not supported by AtScale (AVERAGEX, FILTER, RELATED, &&, IF...)

**Example Valid SML MDX Expressions:**

- Avg([Sold Date Dimensions].[Sold Date Dimensions].[Sold Calendar Quarter].&[1998-02-01]:[Sold Date Dimensions].[Sold Date Dimensions].[Sold Calendar Quarter].&[1999-02-01], [Measures].[Total Store Sales])
- [Measures].[Purchased Amount] / (ParallelPeriod([Date Dimensions].[Date Week Hierarchy].[Calendar Year Week], 1, [Date Dimensions].[Date Week Hierarchy].CurrentMember), [Measures].[Purchased Amount])
- CASE WHEN ISEMPTY([Measures].[Ext Sales Price]) THEN NULL ELSE ([Date Dimensions].[Date Dimensions].CurrentMember, [Measures].[Ext Sales Price]) / ([Date Dimensions].[Date Dimensions].CurrentMember.PrevMember, [Measures].[Ext Sales Price]) END
- Sum(YTD([Date Custom].[StandardMonth].CurrentMember), [Measures].[Internet Order Count])
- Avg([Date Custom].[StandardMonth].CurrentMember.Lag(1): [Date Custom].[StandardMonth].CurrentMember, [Measures].[Internet Order Count])
- Aggregate(PeriodsToDate([Date Custom].[StandardMonth].[Quarter], [Date Custom].[StandardMonth].CurrentMember), [Measures].[Internet Sales Amount Local])

**Table Usage Analysis:**

- `TableConverter` analyzes how tables are used (fact vs dimension)
- Determines table roles based on measures and relationships

**Conversion Flow:**

1. `BimFileParser` → Parse JSON BIM file
2. `BimToYamlConverter` → Orchestrate conversion
3. Specialized converters → Convert each object type
4. AI converter (optional) → Transform DAX expressions
5. `SmlResultWriter` → Persist to YAML files

## Power BI vs AtScale: Architectural Differences

**Execution Model:**

| Aspect | Power BI | AtScale |
|--------|----------|---------|
| Engine | In-memory Vertipaq | SQL generation to DW |
| Language | DAX | MDX → SQL |
| Context | Filter context + row context | MDX tuple/cell context |
| Evaluation | Client-side, full query knowledge | Semantic layer generates SQL |

**Key Implication:** DAX operates on in-memory data with implicit context propagation. AtScale translates MDX to SQL queries against physical tables. Many DAX patterns have no SQL equivalent.

## Calculation Groups: BIM vs SML

**Power BI Calculation Groups:**
- Special table type with `calculationGroup` property containing `calculationItems`
- `SELECTEDMEASURE()` is a runtime placeholder that dynamically captures any measure being evaluated
- Applied via slicer selection or explicit filter: `'CG - Time'[Calc] = "YTD"`
- Can reference other calc groups, use `SELECTEDVALUE()` for conditional logic
- Supports `precedence` for evaluation order when multiple groups apply

**AtScale SML Calculation Groups:**
- Dimension component: `dimension.calculation_groups[].calculated_members[]`
- Use `template` (e.g., "Year to Date") or custom MDX `expression`
- Applied via dimension member selection in queries
- Cannot reference other calc groups or branch on slicer state
- Same `precedence` concept

**What Converts Directly:**

| DAX Pattern | SML Template |
|-------------|--------------|
| `SELECTEDMEASURE()` | `Current` |
| `TOTALYTD(SELECTEDMEASURE(), ...)` | `Year to Date` |
| `TOTALMTD(SELECTEDMEASURE(), ...)` | `Month to Date` |
| `TOTALQTD(SELECTEDMEASURE(), ...)` | `Quarter to Date` |
| `CALCULATE(SELECTEDMEASURE(), SAMEPERIODLASTYEAR(...))` | `Previous` |
| `CALCULATE(SELECTEDMEASURE(), DATEADD(..., -7, DAY))` | `Previous` |

**What Cannot Convert:**
- Cross-calc-group references: `CALCULATE(SELECTEDMEASURE(), 'CG'[col] = "item")`
- Slicer-dependent logic: `SWITCH(SELECTEDVALUE(...), ...)`
- Context functions: `ALLSELECTED()`, `CROSSFILTER()`
- Calc items that reference specific measures instead of `SELECTEDMEASURE()`

**Measures Referencing Calc Groups:**

Power BI allows measures to invoke calc groups:
```dax
[Sales YTD] = CALCULATE([Sales], 'Time Calc'[Type] = "YTD")
```

This pattern has no SML equivalent. In AtScale, users select calc group members in queries; measures don't "call" calc groups. These must become standalone calculated metrics with inlined logic.

See `calculation-group-conversion-plan.md` for implementation details.

## Code Architecture Summary

### Key Files & Responsibilities

| File | Purpose |
|------|---------|
| `bim-to-sml-converter.ts` | Main orchestrator - coordinates all converters |
| `measure-converter.ts` | Converts BIM measures → SML metrics/calculations |
| `dax-converter.ts` | DAX tokenizer + token types (FunctionToken, ColumnReference, BraceToken, etc.) |
| `conversion-pipeline.ts` | 6-stage DAX→MDX conversion orchestration |
| `table-converter.ts` | Classifies tables as fact vs dimension |
| `dimension-converter.ts` | Creates SML dimensions from BIM tables |
| `dataset-converter.ts` | Creates SML datasets |
| `relationship-converter.ts` | Maps BIM relationships to SML |

### Conversion Pipeline Stages (conversion-pipeline.ts)

```
Stage 1: Direct Conversion     → 1:1 function mappings (SUM→Sum, MAX→Max)
Stage 2: Simple Expression     → Math expressions ([A]/[B], [X]+[Y])
Stage 3: Template Conversion   → Pattern-based (DIVIDE, IF, SWITCH, CALCULATE)
Stage 4: VAR Inline + Retry    → Inline VARs, retry stages 1-3
Stage 5: AI Conversion         → LLM-powered (requires --llmName)
Stage 6: Fallback TODO         → `0 /* TODO: {dax} */`
```

### Template Registry (conversion-templates/)

Registered templates (sorted by confidence):
- `DivideTemplate` - DIVIDE(num, denom) → (num)/(denom)
- `IfTemplate` - IF(cond, true, false) → CASE WHEN...
- `IsBlankTemplate` - ISBLANK([col]) → ISEMPTY([col])
- `IfErrorTemplate` - IFERROR(expr, fallback)
- `SwitchTemplate` - SWITCH(expr, val1, res1, ...)
- `CalculateTemplate` - CALCULATE patterns
- `LogicalTemplate` - && → AND, || → OR
- `IteratorAggregateTemplate` - SUMX, AVERAGEX patterns

### Token Types (dax-converter.ts)

- `FunctionToken` - DAX function with args
- `TableColumnReference` - `'Table'[Column]` syntax
- `ColumnReference` - `[Column]` syntax
- `BraceToken` - `{ val1, val2 }` for IN operator
- `VarToken` / `ReturnToken` - VAR/RETURN declarations
- `ParenToken` - Parenthesized expressions

### Key Data Structures

**AttributeMaps** (types-and-interfaces.ts):
- `attrNameMap`: Maps friendly names → [type, table] and old names → new names
- `metricLookup`: Maps `aggFn + tableName[colName]` → MetricProps
- `metricLabels`: Tracks label uniqueness

**TableLists** (types-and-interfaces.ts):
- `factTables` / `dimTables`: Table classification
- `leftTables` / `rightTables`: Relationship sides
- `unusedTables`: Tables with no measures or relationships

### TODO Comment Generation

Unconverted measures get: `0 /* TODO: {original_dax} */`

Location: `measure-converter.ts:convertCalculatedMeasure()` (fallback method)

### Table Classification Logic (table-converter.ts)

- **Fact tables**: LEFT side of relationships OR have measures
- **Dimension tables**: RIGHT side of relationships, no measures
- `isDimensionOnlyTable()`: In dimTables but NOT in factTables

### Test Scripts (scripts/)

- `test-custom-calcs.ts` - Single file conversion + validation + summary
- `test-bim-conversion.ts` - Batch testing with baseline comparison
- `validate-bim-conversion.ts` - Single file with detailed validation
