# Codebase Structure

**Analysis Date:** 2026-01-26

## Directory Layout

```
sml-converters/
├── bin/                              # CLI entry points
│   ├── run.js                        # Main CLI executable
│   └── dev.js                        # Development entry point
├── src/                              # TypeScript source
│   ├── index.ts                      # Command router (COMMANDS export)
│   ├── commands/                     # Converter commands (4 pipelines)
│   │   ├── dbt-to-sml/              # DBT → SML conversion
│   │   │   ├── dbt-to-sml-command.ts       # CLI command orchestrator
│   │   │   ├── dbt-models/          # DBT schema/model definitions
│   │   │   └── dbt-converter/       # Conversion logic
│   │   │       ├── dbt-parser.ts           # YAML parser with Zod
│   │   │       ├── dbt-converter.ts        # Main converter orchestrator
│   │   │       ├── dbt-calculations.ts     # Metric/calculation conversion
│   │   │       ├── dbt-constants.ts        # DBT→SML mappings
│   │   │       └── dbt-tools.ts            # Helper utilities
│   │   ├── bim-to-sml/              # Power BI BIM → SML conversion
│   │   │   ├── bim-to-sml-command.ts       # CLI command orchestrator
│   │   │   ├── bim-file-parser.ts          # JSON parser + validation
│   │   │   ├── bim-models/          # BIM schema definitions
│   │   │   └── bim-converter/       # Complex conversion logic
│   │   │       ├── bim-to-sml-converter.ts # Main orchestrator
│   │   │       ├── dax-converter.ts        # DAX tokenizer
│   │   │       ├── conversion-pipeline.ts  # 6-stage DAX→MDX pipeline
│   │   │       ├── ai-dax-converter.ts     # LLM-powered conversion (optional)
│   │   │       ├── measure-converter.ts    # BIM measures → SML metrics
│   │   │       ├── dimension-converter.ts  # BIM tables → SML dimensions
│   │   │       ├── dataset-converter.ts    # SML dataset creation
│   │   │       ├── table-converter.ts      # Fact/dimension classification
│   │   │       ├── relationship-converter.ts # Relationship mapping
│   │   │       ├── connection-converter.ts # SML connection creation
│   │   │       ├── perspective-converter.ts # BIM perspective conversion
│   │   │       ├── measure-dependency-tracker.ts # Circular dep detection
│   │   │       ├── conversion-templates/   # Pattern-based converters
│   │   │       ├── converters/      # Specialized converters
│   │   │       └── var-analysis/    # DAX variable analysis
│   │   ├── sml-to-cortex/           # SML → Snowflake Cortex YAML
│   │   │   ├── sml-to-cortex-command.ts    # CLI command
│   │   │   ├── cortex-models/       # Cortex schema definitions
│   │   │   └── cortex-converter/    # Conversion logic
│   │   │       ├── cortex-converter.ts     # Main orchestrator
│   │   │       ├── snow-converter.ts       # SML→Cortex mapping
│   │   │       ├── cortex-analysis.ts      # Cortex analysis utilities
│   │   │       ├── cortex-sml-processor.ts # SML processing
│   │   │       ├── cortex-builder.ts       # Cortex model building
│   │   │       ├── cortex-tools.ts         # Helpers
│   │   │       └── cortex-mapper.ts        # Dimension/metric mapping
│   │   └── add-files-to-snowflake/  # Upload to Snowflake
│   │       ├── add-snowflake-files-command.ts # CLI command
│   │       ├── CortexAnalyzer.ts           # Cortex YAML analysis
│   │       └── cortex-connect/      # Snowflake SDK integration
│   │           ├── SnowflakeConnection.ts  # Connection management
│   │           ├── SnowflakeAuth.ts        # Authentication handler
│   │           └── cortex-config-validator.ts # Config validation
│   ├── shared/                       # Shared utilities & patterns
│   │   ├── sml-convert-result.ts     # SmlConvertResultBuilder (core accumulator)
│   │   ├── sml-result-writer.ts      # File persistence
│   │   ├── sml-folder-reader.ts      # Recursive SML YAML reader
│   │   ├── sml-converter-queries.ts  # Object lookup/reference resolution
│   │   ├── sml-unique-name-generator.ts # Deduplication with auto-suffixing
│   │   ├── guard.ts                  # Validation & precondition checking
│   │   ├── logger.ts                 # Logger interface
│   │   ├── command-logger.ts         # Logger factory per command
│   │   ├── file-system-util.ts       # Path/file handling
│   │   ├── yaml-parser.ts            # YAML serialization wrapper
│   │   ├── dw-types.ts               # Data warehouse enum
│   │   ├── enum-util.ts              # Enum helpers
│   │   ├── array-util.ts             # Array utilities
│   │   ├── cortex-converter-util.ts  # Cortex-specific utilities
│   │   └── composite-model-util.ts   # CompositeModel aggregation
│   └── hooks/                        # oclif lifecycle hooks
│       └── init/
│           └── init.ts               # Pre-command initialization
├── scripts/                          # Development/test scripts
│   ├── test-custom-calcs.ts          # Single file validation
│   ├── test-bim-conversion.ts        # Batch conversion + baseline compare
│   └── validate-bim-conversion.ts    # Single file detailed validation
├── dist/                             # Compiled TypeScript (generated)
├── test-files/                       # Sample BIM/DBT files for testing
├── sml_output/                       # Default output directory for conversions
├── .planning/codebase/               # GSD planning documents (this directory)
├── .claude/                          # Project-specific Claude instructions
├── .github/workflows/                # CI/CD pipelines
├── tsconfig.json                     # TypeScript compilation config
├── package.json                      # Dependencies and scripts
├── .eslintrc.json                    # ESLint config
├── .prettierrc                       # Prettier formatting config
└── .oclifrc.js                       # oclif framework config
```

## Directory Purposes

**bin/**
- Purpose: Executable entry points
- Contains: run.js (production), dev.js (development)
- Key files: `bin/run.js` - Loads oclif and routes to src/index.ts

**src/commands/**
- Purpose: CLI command implementations (one per converter)
- Contains: 4 command subdirectories, each with complete parse→convert→write pipeline
- Each command folder is self-contained with its own models, parsers, and converters

**src/commands/dbt-to-sml/**
- Purpose: DBT semantic model → SML conversion
- Key files:
  - `dbt-to-sml-command.ts` - Orchestrates pipeline
  - `dbt-converter/dbt-parser.ts` - Reads dbt_project.yml, packages.yml, models YAML
  - `dbt-converter/dbt-converter.ts` - Transforms to SML
  - `dbt-models/schemas/` - Zod schemas for validation

**src/commands/bim-to-sml/**
- Purpose: Power BI JSON model → SML conversion
- Key files:
  - `bim-to-sml-command.ts` - CLI orchestrator with LLM flag handling
  - `bim-file-parser.ts` - Parses JSON BIM file
  - `bim-converter/bim-to-sml-converter.ts` - Main orchestrator
  - `bim-converter/measure-converter.ts` - Converts measures with DAX→MDX
  - `bim-converter/dax-converter.ts` - DAX expression tokenizer
  - `bim-converter/conversion-pipeline.ts` - 6-stage conversion pipeline
  - `bim-models/` - TypeScript interfaces for BIM schema

**src/commands/sml-to-cortex/**
- Purpose: SML → Snowflake Cortex Analyst YAML
- Key files:
  - `sml-to-cortex-command.ts` - CLI entry
  - `cortex-converter/cortex-converter.ts` - Reads SML, transforms to Cortex
  - `cortex-converter/snow-converter.ts` - SML model → Cortex mapping

**src/commands/add-files-to-snowflake/**
- Purpose: Upload converted Cortex YAML to Snowflake
- Key files:
  - `add-snowflake-files-command.ts` - CLI with Snowflake config flags
  - `cortex-connect/SnowflakeConnection.ts` - SDK wrapper

**src/shared/**
- Purpose: Shared utilities and patterns across all converters
- Contains: 15+ utility files for logging, validation, file I/O, SML object management
- Critical files:
  - `sml-convert-result.ts` - SmlConvertResultBuilder (central accumulator)
  - `guard.ts` - Validation helper
  - `sml-result-writer.ts` - Writes YAML to disk with type-based routing
  - `logger.ts` / `command-logger.ts` - Logging infrastructure

**scripts/**
- Purpose: Development and testing scripts
- Contains: Validation, testing, and comparison scripts
- Run with: `npm run test-custom-calcs`, `npm run test-conversion`, etc.

## Key File Locations

**Entry Points:**
- `bin/run.js` - CLI executable, loads oclif
- `src/index.ts` - Command router, exports COMMANDS record
- `src/hooks/init/init.ts` - Pre-command initialization

**Configuration:**
- `tsconfig.json` - TypeScript compilation settings
- `package.json` - Dependencies and npm scripts
- `.eslintrc.json` - Linting rules
- `.oclifrc.js` - oclif framework configuration
- `.env.example` - Environment variable template

**Core Logic:**
- `src/shared/sml-convert-result.ts` - SmlConvertResultBuilder pattern
- `src/shared/guard.ts` - Validation framework
- `src/shared/file-system-util.ts` - Path/file operations
- `src/commands/*/dbt-converter/dbt-converter.ts` - DBT main converter
- `src/commands/*/bim-converter/bim-to-sml-converter.ts` - BIM main converter
- `src/commands/*/cortex-converter/cortex-converter.ts` - Cortex main converter

**Persistence:**
- `src/shared/sml-result-writer.ts` - File writing with type-based routing
- `src/shared/sml-folder-reader.ts` - Recursive SML YAML reading

## Naming Conventions

**Files:**
- Commands: `*-command.ts` (e.g., dbt-to-sml-command.ts)
- Parsers: `*-parser.ts` (e.g., dbt-parser.ts)
- Converters: `*-converter.ts` (e.g., dbt-converter.ts)
- Models/Types: `*.model.ts` or `*.ts` in models folders
- Utilities: `*-util.ts` or `*-utilities.ts`
- Shared: snake_case filenames in src/shared/

**Directories:**
- Command folders: kebab-case (dbt-to-sml, bim-to-sml)
- Subdirectories: kebab-case (dbt-converter, cortex-converter)
- Model folders: always named `*-models/` (dbt-models, bim-models)

**Classes:**
- Commands: PascalCase with "Command" suffix (DbtToSmlCommand)
- Converters: PascalCase with "Converter" suffix (DbtConverter)
- Parsers: PascalCase with "Parser" suffix (DbtParser)
- Builders: PascalCase with "Builder" suffix (SmlConvertResultBuilder)
- Utilities: PascalCase (Guard, Logger, FileSystemUtil)

**Functions:**
- camelCase (parseInput, encodeFileName, makeUniqueName)

**Constants:**
- UPPER_SNAKE_CASE (DWType enum values)

## Where to Add New Code

**New Converter (e.g., XYZ → SML):**
1. Create folder: `src/commands/xyz-to-sml/`
2. Create command: `src/commands/xyz-to-sml/xyz-to-sml-command.ts` extending Command
3. Create parser: `src/commands/xyz-to-sml/xyz-converter/xyz-parser.ts`
4. Create converter: `src/commands/xyz-to-sml/xyz-converter/xyz-converter.ts`
5. Add to router: Export command in `src/index.ts` COMMANDS record
6. Implement pipeline: parse → convert → write using SmlConvertResultBuilder
7. Tests: Add to `scripts/` if needed

**New Utility:**
- Core pattern: `src/shared/<utility>-util.ts`
- Export as named function or class
- Use Guard for validation
- Accept Logger as dependency

**New BIM Converter (measure, dimension, etc.):**
- Location: `src/commands/bim-to-sml/bim-converter/<object>-converter.ts`
- Extends: Converter class with (logger, builder, query, result) constructor
- Pattern: Iterate BIM objects, add converted SML objects to builder
- Call from: `bim-to-sml-converter.ts` convert() method

**New Conversion Template (DAX pattern):**
- Location: `src/commands/bim-to-sml/bim-converter/conversion-templates/<pattern>-template.ts`
- Extends: Template base class
- Registers: In `conversion-pipeline.ts` template registry
- Pattern: Override canConvert() and convert() methods

**New Test Script:**
- Location: `scripts/<test-name>.ts`
- Run: `tsx scripts/<test-name>.ts`
- Pattern: Import converters, run through pipeline, validate output

## Special Directories

**dist/:**
- Purpose: Compiled TypeScript output
- Generated: By `npm run build` (tsc compilation)
- Committed: Yes (needed for npm package)
- Structure: Mirrors src/ structure in compiled JS

**node_modules/:**
- Purpose: Installed dependencies
- Generated: By npm/yarn
- Committed: No (.gitignore)

**test-files/:**
- Purpose: Sample input files for testing
- Contains: Example BIM, DBT, SML YAML files
- Committed: Yes (for regression testing)

**sml_output/ / cortex_output/:**
- Purpose: Default output directories for conversions
- Generated: By commands if they don't exist
- Committed: No (generated output)

**.planning/codebase/:**
- Purpose: GSD planning and architecture documents
- Committed: Yes
- Contains: ARCHITECTURE.md, STRUCTURE.md, and other mapping docs

**.git/ / .github/workflows/:**
- Purpose: Git repository and CI/CD pipelines
- Committed: Yes
- Workflows: Linting, testing, publishing

---

*Structure analysis: 2026-01-26*
