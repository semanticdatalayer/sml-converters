# BIM to SML Converter - Handoff Guide

## Quick Start (5 min)

```bash
# Build the project
npm run build

# Run conversion on a BIM file
node bin/run.js bim-to-sml --source ./path/to/model.bim --output ./sml-output

# Run with AI-powered DAX conversion (optional, improves coverage ~40%)
export OPENAI_API_KEY=your-key
node bin/run.js bim-to-sml --source ./model.bim --output ./output --llmName openai

# Validate conversion
npm run test-custom-calcs
```

## Affected Repositories

All changes have been added to a branch call bim2sml in the following repositories.

Conversion -- https://github.com/semanticdatalayer/sml-converters/tree/bim2sml/src/commands/bim-to-sml

Smoke tests -- https://github.com/AtScaleInc/SML/tree/bim2sml/tests/snowflake-converter/src/test-suites/pbi-smoke

## What This Converter Does

Converts Power BI models (`.bim` files) to AtScale SML (Semantic Modeling Language):

| BIM Object         | SML Object            |
| ------------------ | --------------------- |
| Tables (fact)      | Datasets + Metrics    |
| Tables (dimension) | Dimensions + Levels   |
| Measures           | Calculated Metrics    |
| Relationships      | Model Relationships   |
| Hierarchies        | Dimension Hierarchies |
| Perspectives       | Model Perspectives    |

**Key challenge:** DAX expressions must be converted to MDX. Many DAX patterns have no MDX equivalent.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        bim-to-sml-command.ts                        │
│                         (CLI entry point)                           │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      bim-to-sml-converter.ts                        │
│                     (Main orchestrator)                             │
│  Coordinates: TableConverter → MeasureConverter → DimensionConverter│
│               → DatasetConverter → RelationshipConverter            │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     conversion-pipeline.ts                          │
│                   (6-stage DAX → MDX pipeline)                      │
│                                                                     │
│  Stage 1: Direct      │ 1:1 function mappings (SUM→Sum)            │
│  Stage 2: Simple      │ Math expressions ([A]/[B])                 │
│  Stage 3: Template    │ Pattern-based (DIVIDE, IF, SWITCH)         │
│  Stage 4: VAR Inline  │ Inline VARs, retry stages 1-3              │
│  Stage 5: AI          │ LLM-powered (requires --llmName)           │
│  Stage 6: Fallback    │ TODO stub: 0 /* TODO: {dax} */             │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Files (read these first)

| File                      | Purpose                                      | Lines  |
| ------------------------- | -------------------------------------------- | ------ |
| `bim-to-sml-converter.ts` | Main orchestrator - start here               | ~250   |
| `conversion-pipeline.ts`  | 6-stage DAX→MDX pipeline                     | ~730   |
| `dax-converter.ts`        | DAX tokenizer and token types                | ~1,380 |
| `measure-converter.ts`    | Measure → metric conversion + type inference | ~1,600 |
| `table-converter.ts`      | Classify tables as fact vs dimension         | ~390   |

## Conversion Pipeline Deep Dive

The pipeline converts DAX to MDX through 6 stages:

```
DAX: DIVIDE([Sales], [Units])
         │
         ▼
    ┌─────────────────┐
    │  Stage 1: Direct │ ──✗ (DIVIDE needs template)
    └────────┬────────┘
             ▼
    ┌─────────────────┐
    │  Stage 2: Simple │ ──✗ (has complex function)
    └────────┬────────┘
             ▼
    ┌─────────────────┐
    │ Stage 3: Template│ ──✓ DIVIDE template matches
    └────────┬────────┘
             ▼
MDX: ([Measures].[Sales]) / ([Measures].[Units])
```

**Stage confidence thresholds:**

- Stages 1-3: confidence >= 0.95 → accept
- Stage 5 (AI): confidence >= 0.3 → accept
- Stage 6: always produces TODO stub

## Testing

```bash
# Single file test with validation summary
npm run test-custom-calcs

# Batch test multiple BIM files
npm run test-conversion -- --input ./bim-files --output results.json

# Deploy test (validates SML works in AtScale)
npm run test-deploy
```

## Common Issues

| Issue                  | Cause                                  | Solution                  |
| ---------------------- | -------------------------------------- | ------------------------- |
| `TODO: CALCULATE(...)` | DAX CALCULATE has no MDX equivalent    | Manual MDX rewrite needed |
| `TODO: FILTER(...)`    | Row-by-row filtering impossible in MDX | Rethink measure logic     |
| Boolean type errors    | Measure used in wrong context          | Check type-inference.ts   |
| Missing metrics        | Table classified as dimension          | Check table-converter.ts  |

## Deploy Errors (API Side)

When deploying converted SML to AtScale, you may hit XML parsing errors in the API:

| Error                                                 | Cause                                      | Fix Location                         |
| ----------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `data-set.map is not a function`                      | Single dataset parsed as object, not array | API: `project-xml-parser.service.ts` |
| `Cannot read properties of undefined (reading 'map')` | Missing datasets/cubes/annotations         | API: `project-xml-parser.service.ts` |

**Root cause:** Some converted BIM models have only one dataset/cube/annotation (parsed as object instead of array) or are missing these sections entirely.

**API fixes needed** (in `apps/api/src/public/catalog/project-xml-parser.service.ts`):

1. Add `'annotation'` to `arrayProps`
2. Add optional chaining (`?.`) and fallbacks (`|| []`) for `data-sets.data-set`, `cubes.cube`, `annotations.annotation`
3. Add `.filter(Boolean)` to remove undefined connection IDs

**After fixing:** Rebuild and redeploy the API:

```bash
pnpm build --filter=api
# Then restart/redeploy the API service
```

## What's NOT Supported

DAX patterns that cannot convert to MDX:

- `CALCULATE` with complex filters
- `FILTER`, `ALL`, `ALLEXCEPT`
- Row context functions (`RELATED`, `RELATEDTABLE`)
- Iterator functions (`SUMX`, `AVERAGEX` with expressions)

### Calculation Groups

Calculation groups can be defined on tables in bim files. Currently they are only seen in models from Mol and Hilcorp. This converter Currently bypasses them altogether. Here's the behavior:

1. Calculation group tables are skipped - Identified via table.calculationGroup property, added to both calcGroupTables and unusedTables sets, so they don't become dimensions or datasets
2. Measures referencing calc groups produce TODO stubs - detectCalculationGroupUsage() in measure-converter.ts
3. Transitive dependencies are tracked - MeasureDependencyTracker marks measures that depend on other measures that use calc groups, so they also get TODO stubs.

There's a plan that's been created for this functionality but it's not implemented: calculation-group-conversion-plan.md describes future support for converting simple calc group items (like TOTALYTD(SELECTEDMEASURE(), ...)) to SML templates like "Year to Date". The field (Daniel's team) is working with Mol to determine whether this functionality is needed, and if so, how they would migrate it manually to SML.

## Directory Structure

```
bim-to-sml/
├── bim-converter/                 # Main conversion logic
│   ├── conversion-templates/      # Pattern-based converters
│   │   └── templates/             # 19 conversion templates
│   ├── var-analysis/              # VAR inlining subsystem
│   ├── converters/                # Direct function converter
│   ├── conversion-pipeline.ts     # 6-stage pipeline
│   ├── dax-converter.ts           # DAX tokenizer
│   ├── measure-converter.ts       # Measure conversion
│   ├── type-inference.ts          # MDX type system
│   └── [other converters]
├── bim-models/                    # BIM data structures
├── bim-file-parser.ts             # BIM JSON parser
└── bim-to-sml-command.ts          # CLI command
```
