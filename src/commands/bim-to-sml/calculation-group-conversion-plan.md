# Plan: Convert Power BI Calculation Groups to SML

## Scope

Convert **only** Power BI calculation group items that have direct SML template equivalents. Complex items requiring custom MDX or having disqualifying patterns (cross-calc-group references, SELECTEDVALUE, ALLSELECTED) are out of scope.

## Convertible Patterns

| DAX Pattern | SML Template | Notes |
|-------------|--------------|-------|
| `SELECTEDMEASURE()` | `Current` | Pass-through |
| `TOTALYTD(SELECTEDMEASURE(), 'Date'[Date])` | `Year to Date` | |
| `TOTALMTD(SELECTEDMEASURE(), 'Date'[Date])` | `Month to Date` | |
| `TOTALQTD(SELECTEDMEASURE(), 'Date'[Date])` | `Quarter to Date` | |
| `CALCULATE(SELECTEDMEASURE(), SAMEPERIODLASTYEAR(...))` | `Previous` | |
| `CALCULATE(SELECTEDMEASURE(), DATEADD(..., -1, YEAR))` | `Previous` | |
| `CALCULATE(SELECTEDMEASURE(), DATEADD(..., -7, DAY))` | `Previous` | Weekly |

### Disqualifying Patterns (skip these items)

- References other calc groups: `'CG - Time Intelligence'[...]`
- Uses `SELECTEDVALUE()` for conditional logic
- Uses `ALLSELECTED()` or `CROSSFILTER()`
- Complex `SWITCH()` with multiple branches
- References specific measures instead of `SELECTEDMEASURE()`

## Implementation Steps

### 1. Extend BIM Model Types

**File:** `src/commands/bim-to-sml/bim-models/bim-model.ts`

Add interfaces for calculation groups:

```typescript
export interface BimCalculationItem {
  name: string;
  expression: string | string[];
  ordinal?: number;
  formatStringDefinition?: { expression: string };
}

export interface BimCalculationGroup {
  precedence: number;
  calculationItems: BimCalculationItem[];
}

// Update BimTable interface
export interface BimTable {
  // ... existing fields
  calculationGroup?: BimCalculationGroup;  // Add this
}
```

### 2. Create Calculation Group Converter

**File:** `src/commands/bim-to-sml/bim-converter/calculation-group-converter.ts`

```typescript
import {
  SMLDimensionCalculationGroup,
  SMLDimensionCalculationMember,
  SMLCalculationMembersTemplatesIds,
} from "sml-sdk";
import { BimTable, BimCalculationItem } from "../bim-models/bim-model";
import { Logger } from "../../../shared/logger";
import { makeUniqueName } from "./tools";

interface TemplatePattern {
  template: SMLCalculationMembersTemplatesIds;
  pattern: RegExp;
}

const TEMPLATE_PATTERNS: TemplatePattern[] = [
  { template: SMLCalculationMembersTemplatesIds.Current,
    pattern: /^\s*SELECTEDMEASURE\s*\(\s*\)\s*$/i },
  { template: SMLCalculationMembersTemplatesIds.YearToDate,
    pattern: /TOTALYTD\s*\(\s*SELECTEDMEASURE\s*\(\s*\)/i },
  { template: SMLCalculationMembersTemplatesIds.MonthToDate,
    pattern: /TOTALMTD\s*\(\s*SELECTEDMEASURE\s*\(\s*\)/i },
  { template: SMLCalculationMembersTemplatesIds.QuarterToDate,
    pattern: /TOTALQTD\s*\(\s*SELECTEDMEASURE\s*\(\s*\)/i },
  { template: SMLCalculationMembersTemplatesIds.Previous,
    pattern: /CALCULATE\s*\(\s*SELECTEDMEASURE\s*\(\s*\)\s*,\s*SAMEPERIODLASTYEAR/i },
  { template: SMLCalculationMembersTemplatesIds.Previous,
    pattern: /CALCULATE\s*\(\s*SELECTEDMEASURE\s*\(\s*\)\s*,\s*DATEADD\s*\([^,]+,\s*-1\s*,\s*YEAR/i },
  { template: SMLCalculationMembersTemplatesIds.Previous,
    pattern: /CALCULATE\s*\(\s*SELECTEDMEASURE\s*\(\s*\)\s*,\s*DATEADD\s*\([^,]+,\s*-7\s*,\s*DAY/i },
];

const DISQUALIFYING_PATTERNS = [
  /['"]CG\s*-/i,           // References other calc groups
  /SELECTEDVALUE/i,        // Dynamic slicer-based logic
  /ALLSELECTED/i,          // Power BI-specific context
  /CROSSFILTER/i,          // Dynamic relationship control
];

export class CalculationGroupConverter {
  constructor(private logger: Logger) {}

  isCalculationGroupTable(table: BimTable): boolean {
    return !!table.calculationGroup;
  }

  convert(table: BimTable): SMLDimensionCalculationGroup | null {
    if (!table.calculationGroup) return null;

    const convertedMembers: SMLDimensionCalculationMember[] = [];
    const items = table.calculationGroup.calculationItems || [];

    for (const item of items) {
      const member = this.convertItem(item, table.name);
      if (member) {
        convertedMembers.push(member);
      }
    }

    if (convertedMembers.length === 0) {
      this.logger.warn(
        `Calculation group '${table.name}' has no convertible items, skipping`
      );
      return null;
    }

    return {
      unique_name: makeUniqueName(`calc_group.${table.name}`),
      label: table.name,
      calculated_members: convertedMembers,
      precedence: table.calculationGroup.precedence,
    };
  }

  private convertItem(
    item: BimCalculationItem,
    groupName: string
  ): SMLDimensionCalculationMember | null {
    const expr = Array.isArray(item.expression)
      ? item.expression.join("\n")
      : item.expression || "";
    const normalized = expr.replace(/\s+/g, " ").trim();

    // Check for disqualifying patterns
    for (const pattern of DISQUALIFYING_PATTERNS) {
      if (pattern.test(expr)) {
        this.logger.info(
          `Skipping '${item.name}' in '${groupName}': contains unsupported pattern`
        );
        return null;
      }
    }

    // Check for template match
    for (const { template, pattern } of TEMPLATE_PATTERNS) {
      if (pattern.test(normalized)) {
        return {
          unique_name: makeUniqueName(`${groupName}.${item.name}`),
          template,
        };
      }
    }

    this.logger.info(
      `Skipping '${item.name}' in '${groupName}': no matching SML template`
    );
    return null;
  }
}
```

### 3. Update Table Converter to Identify Calc Group Tables

**File:** `src/commands/bim-to-sml/bim-converter/table-converter.ts`

Add check in table classification to exclude calculation group tables from normal processing:

```typescript
// In table classification logic
if (table.calculationGroup) {
  // Mark as calculation group table, not a regular dimension/fact
  tableLists.calcGroupTables.push(table);
  continue;
}
```

### 4. Integrate into Main Converter

**File:** `src/commands/bim-to-sml/bim-converter/bim-to-sml-converter.ts`

Add calculation group conversion step:

```typescript
import { CalculationGroupConverter } from "./calculation-group-converter";

// In convert method, after dimension conversion:
const cgConverter = new CalculationGroupConverter(this.logger);
const calcGroups: SMLDimensionCalculationGroup[] = [];

for (const table of bim.model.tables) {
  if (cgConverter.isCalculationGroupTable(table)) {
    const cg = cgConverter.convert(table);
    if (cg) calcGroups.push(cg);
  }
}

// Attach to time dimension (or create dedicated calc group dimension)
if (calcGroups.length > 0) {
  const timeDim = result.dimensions.find(d => d.type === SMLDimensionType.Time);
  if (timeDim) {
    timeDim.calculation_groups = calcGroups;
  }
}
```

### 5. Update TableLists Interface

**File:** `src/commands/bim-to-sml/bim-models/types-and-interfaces.ts`

```typescript
export interface TableLists {
  // ... existing fields
  calcGroupTables: BimTable[];  // Add this
}
```

## Testing

After implementation, run:
```bash
npm run test-custom-calcs
```

## Expected Output

For the sample model, this would convert:

**Input (Power BI):**
- CG - Timescale / Breakdown → `SELECTEDMEASURE()`
- CG - Timescale / Cumulated → `TOTALYTD(SELECTEDMEASURE(), ...)`
- CG - Timescale / MTD → `TOTALMTD(SELECTEDMEASURE(), ...)`
- CG - Time Intelligence / Actual → `SELECTEDMEASURE()`
- CG - Time Intelligence / Last week → `CALCULATE(SELECTEDMEASURE(), DATEADD(..., -7, DAY))`

**Output (SML):**
```yaml
calculation_groups:
  - unique_name: calc_group.CG_-_Timescale
    label: CG - Timescale
    precedence: 4
    calculated_members:
      - unique_name: CG_-_Timescale.Breakdown
        template: Current
      - unique_name: CG_-_Timescale.Cumulated
        template: Year to Date
      - unique_name: CG_-_Timescale.MTD
        template: Month to Date

  - unique_name: calc_group.CG_-_Time_Intelligence
    label: CG - Time Intelligence
    precedence: 10
    calculated_members:
      - unique_name: CG_-_Time_Intelligence.Actual
        template: Current
      - unique_name: CG_-_Time_Intelligence.Last_week
        template: Previous
```

## Limitations

1. Only 5 of 56 calculation items (9%) are directly convertible
2. Complex time intelligence (Selectable Base, Calendar Base) requires manual modeling
3. Cross-calc-group references cannot be converted
4. "CG - Measure selection" is a different pattern (measure picker, not calc group) - out of scope
5. "CG - Average values" and "CG - Customer Category" use measure references, not templates - out of scope

## Future Enhancements

1. Add custom MDX conversion for simple `CALCULATE(SELECTEDMEASURE(), <filter>)` patterns
2. Generate stub calculated metrics for non-convertible items with TODO comments
3. Report on conversion coverage in output
