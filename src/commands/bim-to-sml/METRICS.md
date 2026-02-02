# BIM to SML Metric Conversion

## BIM Structure: Measures vs Columns

In BIM files, there are two sources of metrics:

### BIM Measures (table.measures[])

Explicit DAX calculations defined on tables:

```json
{
  "name": "Total Sales",
  "expression": "SUM('Sales'[Amount])",
  "formatString": "$#,##0",
  "isHidden": false,
  "displayFolder": "Revenue",
  "description": "Sum of all sales"
}
```

### BIM Columns (table.columns[])

Table columns with `summarizeBy` property indicating default aggregation:

```json
{
  "name": "Amount",
  "dataType": "double",
  "summarizeBy": "sum",
  "isHidden": false,
  "displayFolder": "Facts"
}
```

**summarizeBy values:** `sum`, `avg`, `min`, `max`, `count`, `distinctcount`, `none`

Columns with `summarizeBy: "none"` or missing become dimension attributes, not metrics.

## SML Output Types

Base metrics (SML metric) are created from BIM columns with aggregation: Simple column + aggregation method

Calculated metrics (SML metric_calc) are created from BIM measures. The DAX expression is converted to MDX in SML.

## Conversion Flow

```
BIM Column (summarizeBy: sum)     →  SML metric (calculation_method: Sum)
BIM Column (summarizeBy: none)    →  Secondary Attribute or Degenerate Dim
BIM Measure (simple SUM/AVG)      →  SML metric_calc referencing SML metric
BIM Measure (complex DAX)         →  SML metric_calc with MDX expression or TODO stub
```

## When Base Metrics Are Created

Base metrics (`SML metric`) are created in two scenarios:

1. From Columns (measuresFromColumns): For fact table columns with `summarizeBy` aggregation that aren't already used
2. On-Demand During DAX Conversion: When DAX references a table column like `SUM('Sales'[Amount])`, a base metric is created automatically if it doesn't exist.

## Metric Naming

**Base metrics:** `metric.<table>.<column>.<aggfn>`

- Example: `metric.sales.amount.sum`

**Calculated metrics:** `calculation.<table>.<measure_name>`

- Example: `calculation.sales.total_sales`

Duplicate names get numeric suffixes: `amount`, `amount_1`, `amount_2`

## Special Cases

### COUNTROWS

BIM `COUNTROWS(Table)` becomes:

1. A calculated column `__row_count__` with value `1` added to dataset
2. A base metric with `calculation_method: Sum` on that column

### Dual-Context Measures

Measures used in both boolean AND numeric contexts get split:

- `measure_name_num` - numeric stub (`0` or `1`)
- `measure_name_bool` - boolean stub (`(1 = 1)`)

See CONCEPTS.md section 4 for details.

### Hidden Measures

`isHidden: true` in BIM → `is_hidden: true` in SML

Hidden measures are converted but marked hidden in the output.

## Key Files

| File                            | Responsibility                                     |
| ------------------------------- | -------------------------------------------------- |
| `measure-converter.ts`          | Main conversion logic, base metric + calc creation |
| `conversion-pipeline.ts`        | DAX → MDX expression conversion                    |
| `type-inference.ts`             | Boolean vs numeric context detection               |
| `measure-dependency-tracker.ts` | Transitive dependency tracking                     |
