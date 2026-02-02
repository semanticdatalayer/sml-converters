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

## What This Converter Does

Converts Power BI models (`.bim` files) to AtScale SML (Semantic Modeling Language):

| BIM Object | SML Object |
|------------|------------|
| Tables (fact) | Datasets + Metrics |
| Tables (dimension) | Dimensions + Levels |
| Measures | Calculated Metrics |
| Relationships | Model Relationships |
| Hierarchies | Dimension Hierarchies |
| Perspectives | Model Perspectives |

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

| File | Purpose | Lines |
|------|---------|-------|
| `bim-to-sml-converter.ts` | Main orchestrator - start here | ~250 |
| `conversion-pipeline.ts` | 6-stage DAX→MDX pipeline | ~730 |
| `dax-converter.ts` | DAX tokenizer and token types | ~1,380 |
| `measure-converter.ts` | Measure → metric conversion + type inference | ~1,600 |
| `table-converter.ts` | Classify tables as fact vs dimension | ~390 |

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

| Issue | Cause | Solution |
|-------|-------|----------|
| `TODO: CALCULATE(...)` | DAX CALCULATE has no MDX equivalent | Manual MDX rewrite needed |
| `TODO: FILTER(...)` | Row-by-row filtering impossible in MDX | Rethink measure logic |
| Boolean type errors | Measure used in wrong context | Check type-inference.ts |
| Missing metrics | Table classified as dimension | Check table-converter.ts |

## What's NOT Supported

DAX patterns that cannot convert to MDX:
- `CALCULATE` with complex filters
- `FILTER`, `ALL`, `ALLEXCEPT`
- Row context functions (`RELATED`, `RELATEDTABLE`)
- Iterator functions (`SUMX`, `AVERAGEX` with expressions)
- Calculation groups referencing other calc groups

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

## Demo Script (30 min)

1. **Show input/output** (5 min)
   - Open a simple BIM file in VS Code
   - Run conversion, show generated SML YAML files

2. **Walk through pipeline** (10 min)
   - Open `conversion-pipeline.ts`
   - Trace a simple measure through stages 1-3
   - Show how template matching works

3. **Show one template** (5 min)
   - Open `divide-template.ts`
   - Explain `match()` and `convert()` methods

4. **Explain type inference** (5 min)
   - Open `type-inference.ts`
   - Show how boolean vs numeric context is tracked

5. **Run tests** (5 min)
   - Run `npm run test-custom-calcs`
   - Show validation output

## Contacts & Resources

- **Codebase docs:** `CLAUDE.md` in this directory
- **Calculation groups plan:** `calculation-group-conversion-plan.md`
- **SML SDK docs:** See `sml-sdk` package
