# BIM to SML Dimension Conversion

## Overview

BIM dimension tables (right side of relationships) become SML Dimensions with hierarchies, levels, and secondary attributes.

```
BIM Table (right of relationship)       →  SML Dimension
BIM Column                              →  Level or Secondary Attribute
BIM Column (on fact, non-aggregatable)  →  Degenerate Dimension
```

## Hierarchies

### When BIM Defines Hierarchies

BIM hierarchies map directly to SML hierarchies:

```yaml
# BIM hierarchy: Year → Quarter → Month
hierarchies:
  - unique_name: date_hierarchy
    levels:
      - unique_name: Year
      - unique_name: Quarter
      - unique_name: Month # leaf level
```

**Join level handling:** If the relationship join column isn't in the hierarchy, a hidden level is added at the leaf position.

**Composite keys:** For multi-level hierarchies, parent key columns are added to child levels for proper roll-up:

- Year: `[year]`
- Quarter: `[year, quarter]`
- Month: `[year, quarter, month]`

### When BIM Has No Hierarchies

A default hierarchy is created using the relationship join column(s):

```yaml
hierarchies:
  - unique_name: product_hierarchy
    label: "Product Hierarchy"
    levels:
      - unique_name: ProductKey # from join column
```

## Levels vs Secondary Attributes

| Type                    | Source                                           | Purpose                                          |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------ |
| **Level**               | Columns in BIM hierarchy OR join columns         | Defines hierarchy structure, used for drill-down |
| **Secondary Attribute** | Other visible columns with `summarizeBy: "none"` | Additional attributes attached to leaf level     |

**Secondary attribute rule:** Columns with aggregation (`summarizeBy: sum/avg/etc.`) become metrics, not secondary attributes.

```typescript
// Column becomes secondary attribute if:
!levelCols.has(column.name) && // not already a level
  !isHidden(column) && // visible
  column.summarizeBy === "none"; // non-aggregatable
```

Secondary attributes attach to the **first join column's level** (or leaf level if none specified).

## Time Dimensions

Tables with `dataCategory: "Time"` become time dimensions with `time_unit` on levels:

| Column Name Pattern           | time_unit |
| ----------------------------- | --------- |
| `*day*`, `*date*`             | Day       |
| `*week*`                      | Week      |
| `*month*`, `*mth*`, `*moy*`   | Month     |
| `*quarter*`, `*qtr*`, `*qoy*` | Quarter   |
| `*year*`                      | Year      |

Time dimensions enable time intelligence functions (YTD, MTD, etc.) in AtScale.

## Degenerate Dimensions

Degenerate dimensions are created from **fact table columns** that aren't aggregatable - they provide grouping/filtering without a separate dimension table. They are created in the following situations.

1. **Standalone facts (no relationships):** Columns with `summarizeBy: "none"` or missing `summarizeBy`
2. **Columns used in measures:** Table columns referenced in DAX that aren't in existing dimensions

When the same degenerate dimension column exists in multiple fact tables with matching data types, they share a single dimension using `shared_degenerate_columns`.

## Key Files

| File                     | Responsibility                                            |
| ------------------------ | --------------------------------------------------------- |
| `dimension-converter.ts` | Main dimension conversion logic                           |
| `table-converter.ts`     | Identifies dimension tables, populates `degenDims`        |
| `converter-utils.ts`     | Helper functions (`dimLevels`, `listRelationshipColumns`) |
