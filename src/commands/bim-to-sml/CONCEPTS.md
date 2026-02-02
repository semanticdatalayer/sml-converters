# BIM to SML Converter - Key Concepts

This document explains the core abstractions you need to understand the codebase.

## 1. DAX vs MDX: The Fundamental Problem

**DAX** (Power BI) and **MDX** (AtScale) are fundamentally different:

| Aspect    | DAX                          | MDX                  |
| --------- | ---------------------------- | -------------------- |
| Engine    | In-memory Vertipaq           | SQL generation to DW |
| Context   | Filter context + row context | Tuple/cell context   |
| Iteration | Row-by-row (SUMX, FILTER)    | Set-based operations |

**Key insight:** DAX can iterate row-by-row. MDX generates SQL that runs on databases. Many DAX patterns simply have no SQL equivalent.

### What Converts

```dax
// DAX
SUM('Sales'[Amount])
// → MDX
[Measures].[sum_sales_amount]  // Base metric with SUM aggregation
```

```dax
// DAX
DIVIDE([Sales], [Units])
// → MDX
([Measures].[Sales]) / ([Measures].[Units])
```

### What Cannot Convert

```dax
// DAX - iterates rows, no MDX equivalent
SUMX('Sales', 'Sales'[Qty] * RELATED('Product'[Price]))

// DAX - modifies filter context, no MDX equivalent
CALCULATE([Sales], FILTER('Date', 'Date'[Year] = 2023))
```

---

## 2. Tokens: How DAX is Parsed

The `DaxTokenizer` breaks DAX expressions into typed tokens:

```
DAX: DIVIDE([Sales], [Units])
         │
         ▼
┌────────────────────────────────────────┐
│ FunctionToken("DIVIDE")                │
│   args: [                              │
│     ColumnReference("Sales"),          │
│     CommaToken,                        │
│     ColumnReference("Units")           │
│   ]                                    │
└────────────────────────────────────────┘
```

### Token Types

| Token                  | DAX Syntax      | Example               |
| ---------------------- | --------------- | --------------------- | --- | --- |
| `FunctionToken`        | `FUNC(args)`    | `SUM(...)`, `IF(...)` |
| `ColumnReference`      | `[Name]`        | `[Sales]`             |
| `TableColumnReference` | `'Table'[Col]`  | `'Sales'[Amount]`     |
| `LiteralToken`         | numbers/strings | `100`, `"text"`       |
| `OperatorToken`        | math/logic ops  | `+`, `-`, `&&`, `     |     | `   |
| `VarToken`             | `VAR x = expr`  | Variable declarations |
| `ReturnToken`          | `RETURN expr`   | Return statements     |
| `BraceToken`           | `{val1, val2}`  | Set literals for IN   |
| `ParenToken`           | `(expr)`        | Grouped expressions   |

### Token Methods

Each token implements:

- `toMdx(info)` - Convert to MDX string
- `toString()` - Original DAX representation

---

## 3. Templates: Pattern-Based Conversion

Templates handle complex DAX patterns that need special logic.

### Template Structure

```typescript
abstract class ConversionTemplate {
  // Check if this template handles the expression
  abstract match(tokens: DaxToken[]): boolean;

  // Convert to MDX (only called if match() returns true)
  abstract convert(
    tokens: DaxToken[],
    context: ConversionContext,
  ): ConversionResult;

  // Priority (higher = tried first)
  abstract get priority(): number;

  // Confidence score (0.0-1.0)
  abstract get confidence(): number;
}
```

### Available Templates

| Template             | DAX Pattern           | MDX Output                         |
| -------------------- | --------------------- | ---------------------------------- |
| `DivideTemplate`     | `DIVIDE(a, b)`        | `(a) / (b)`                        |
| `IfTemplate`         | `IF(cond, t, f)`      | `CASE WHEN cond THEN t ELSE f END` |
| `SwitchTemplate`     | `SWITCH(expr, ...)`   | Nested `CASE WHEN`                 |
| `IsBlankTemplate`    | `ISBLANK([X])`        | `ISEMPTY([X])`                     |
| `TotalYtdTemplate`   | `TOTALYTD([M], date)` | `Sum(YTD(...), [M])`               |
| `CalculateTemplate`  | `CALCULATE([M], ...)` | Context-dependent                  |
| `InOperatorTemplate` | `col IN {vals}`       | `col = v1 OR col = v2`             |

### Template Registry

Templates register with priority. Pipeline tries highest priority first:

```typescript
TemplateRegistry.getInstance()
  .register(new DivideTemplate()) // priority: 100
  .register(new IfTemplate()) // priority: 90
  .register(new SwitchTemplate()); // priority: 80
// ...
```

---

## 4. Type Inference: Boolean vs Numeric

MDX is strictly typed. A measure stub must match its usage context.

### The Problem

```dax
// DAX measure: IsHighValue
HASONEVALUE('Product'[Category])

// Used in another measure
IF([IsHighValue], [Sales], 0)
//   ↑ boolean context

// Also used here
[Sales] * [IsHighValue]
//          ↑ numeric context (multiplied)
```

If `IsHighValue` can't convert, what stub do we use?

- Boolean stub: `(1 = 1)` - valid for IF condition
- Numeric stub: `0` - valid for multiplication

### Type Tracking

`UsageContext` tracks how each measure is used:

```typescript
interface UsageContext {
  measureTypes: Map<string, Set<MdxType>>; // measure → {BOOLEAN, NUMERIC}
}
```

### Dual-Context Measures

When a measure is used in BOTH contexts, we create TWO calculated metrics:

1. Original name → numeric stub
2. `{name}_bool` → boolean stub

The converter rewrites references based on context.

---

## 5. VAR Inlining: Handling Variables

MDX has no variables. DAX VARs must be inlined at usage sites.

### Safe Inlining

```dax
// Original
VAR x = [Sales] * 2
RETURN x + x

// After inlining
([Sales] * 2) + ([Sales] * 2)
```

### Unsafe Patterns (cannot inline)

```dax
// VAR used in unconvertible function
VAR x = [Sales]
RETURN CALCULATE(x, FILTER(...))  // FILTER is unconvertible
```

### VAR Analysis Components

| Component          | Purpose                 |
| ------------------ | ----------------------- |
| `VarAnalyzer`      | Detect VAR patterns     |
| `VarScopeTracker`  | Track variable scope    |
| `VarSafetyChecker` | Check if safe to inline |
| `VarInliner`       | Perform substitution    |

---

## 6. Table Classification: Fact vs Dimension

The converter must know which tables are facts (have metrics) vs dimensions (have levels).

### Classification Rules

```
Fact Table:
  - LEFT side of any relationship, OR
  - Has BIM measures defined

Dimension Table:
  - RIGHT side of relationships
  - No measures
  - Gets converted to SML Dimension with Levels
```

### Classification Order Matters

The order of operations is critical:

1. **First:** `prePopulateMeasTables()` marks tables with BIM measures
2. **Then:** `populateTableLists()` classifies based on relationships

This ensures tables with measures are **always** fact tables, even if on the right side of relationships.

### TableLists Structure

```typescript
interface TableLists {
  factTables: BimTable[]; // → Datasets + Metrics
  dimTables: BimTable[]; // → Dimensions
  measTables: Set<string>; // Tables with measures (populated FIRST)
  unusedTables: Set<string>; // No relationships, no measures
  calcGroupTables: Set<string>; // Calculation group tables
  leftTables: Set<string>; // Left side of relationships
  rightTables: Set<string>; // Right side of relationships
}
```

### Tables That Are BOTH Fact and Dimension

A table can appear in BOTH `factTables` and `dimTables` simultaneously when it is on the right side of relationships AND has measures (e.g., `Product` table with a `Product Count` measure). In this case a single dataset is used for both purposes and a relationship is created between them:

```yaml
# In model.yml relationships section
- unique_name: dataset.product.dimension.product
  from:
    dataset: dataset.product
    join_columns: [ProductKey] # Key column
  to:
    dimension: dimension.product
    level: dimension.product.attr.ProductKey
```

This self-referential relationship allows the dataset's metrics to be filtered by the dimension's attributes.

---

## 7. AttributeMaps: Name Resolution

Maps track how BIM names translate to SML unique_names.

### attrNameMap

Two mappings in one:

```typescript
// Type 1: friendly name → [type, table]
"sales" → ["metric", "FactSales"]

// Type 2: old name → [new unique_name]
"calculation.factsales.totalsales" → ["total_sales_calc"]
```

### metricLookup

Maps aggregation patterns to created metrics:

```typescript
// Key: aggFn + tableName[colName]
"sumfactsales[amount]" → {
  uniqueName: "sum_factsales_amount",
  table: "FactSales",
  colName: "amount"
}
```

---

## 8. Conversion Result: What Gets Created

### SmlConverterResult Structure

```typescript
interface SmlConverterResult {
  catalog: SMLCatalog; // Root catalog file
  connections: SMLConnection[]; // DB connections
  datasets: SMLDataset[]; // Fact table datasets
  dimensions: SMLDimension[]; // Dimension definitions
  measures: SMLMetric[]; // Base metrics (SUM, COUNT, etc.)
  measuresCalculated: SMLMetricCalculated[]; // Calculated metrics
  models: SMLModel[]; // Model tying it all together
  rowSecurity: SMLRowSecurity[]; // Security rules
  compositeModels: SMLCompositeModel[];
}
```

### Output Files

```
output/
├── catalog.yml              # Root catalog
├── models/
│   └── model_name.yml       # Model definition
├── dimensions/
│   └── dim_name.yml         # Each dimension
├── datasets/
│   └── dataset_name.yml     # Each dataset
├── metrics/
│   └── metric_name.yml      # Base metrics
└── calculations/
    └── calc_name.yml        # Calculated metrics
```

---

## 9. Pipeline Stages: The Full Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DAX Expression Input                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│ Stage 1: DIRECT CONVERSION                                    │
│ • Single function calls with 1:1 MDX mapping                  │
│ • Example: SUM([X]) → [Measures].[X]                          │
│ • Confidence: 1.0                                             │
└───────────────────────────┬───────────────────────────────────┘
                            │ (if failed)
                            ▼
┌───────────────────────────────────────────────────────────────┐
│ Stage 2: SIMPLE EXPRESSION                                    │
│ • Math with no unconvertible functions                        │
│ • Example: [A] / [B] → [Measures].[A] / [Measures].[B]        │
│ • Confidence: 1.0                                             │
└───────────────────────────┬───────────────────────────────────┘
                            │ (if failed)
                            ▼
┌───────────────────────────────────────────────────────────────┐
│ Stage 3: TEMPLATE CONVERSION                                  │
│ • Pattern matching via template registry                      │
│ • Example: DIVIDE([A], [B]) → template handles division       │
│ • Confidence: 0.9-1.0                                         │
└───────────────────────────┬───────────────────────────────────┘
                            │ (if failed)
                            ▼
┌───────────────────────────────────────────────────────────────┐
│ Stage 4: VAR INLINE + RETRY                                   │
│ • Inline safe VARs, retry stages 1-3                          │
│ • Confidence: varies                                          │
└───────────────────────────┬───────────────────────────────────┘
                            │ (if failed)
                            ▼
┌───────────────────────────────────────────────────────────────┐
│ Stage 5: AI CONVERSION (optional)                             │
│ • LLM-powered DAX→MDX                                         │
│ • Requires --llmName flag                                     │
│ • Confidence: 0.3-0.7                                         │
└───────────────────────────┬───────────────────────────────────┘
                            │ (if failed or disabled)
                            ▼
┌───────────────────────────────────────────────────────────────┐
│ Stage 6: FALLBACK TODO                                        │
│ • Produces: 0 /* TODO: {original_dax} */                      │
│ • Or boolean: (1 = 1) /* TODO: ... */                         │
│ • Confidence: 0.0                                             │
└───────────────────────────────────────────────────────────────┘
```

---

## 10. Glossary

| Term                | Definition                                            |
| ------------------- | ----------------------------------------------------- |
| **BIM**             | Power BI model file (JSON format)                     |
| **SML**             | Semantic Modeling Language (AtScale)                  |
| **DAX**             | Data Analysis Expressions (Power BI formula language) |
| **MDX**             | Multidimensional Expressions (OLAP query language)    |
| **Token**           | Parsed unit of a DAX expression                       |
| **Template**        | Pattern matcher for complex DAX patterns              |
| **Pipeline**        | 6-stage conversion flow                               |
| **Confidence**      | 0.0-1.0 score of conversion correctness               |
| **TODO stub**       | Placeholder when conversion fails                     |
| **Dual-context**    | Measure used in both boolean and numeric contexts     |
| **VAR inlining**    | Substituting variable values at usage sites           |
| **Fact table**      | Table with measures (→ Dataset)                       |
| **Dimension table** | Table for filtering/grouping (→ Dimension)            |
