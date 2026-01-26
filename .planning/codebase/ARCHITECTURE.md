# Architecture

**Analysis Date:** 2026-01-26

## Pattern Overview

**Overall:** CLI Tool with Pluggable Converter Pipeline Pattern

**Key Characteristics:**
- Command-driven converter orchestration (4 standalone converter pipelines)
- Builder pattern for accumulating SML objects across conversion stages
- Strategy pattern for format-specific converters
- Guard-based validation and error handling
- Centralized SML object registry to prevent duplicates and resolve references

## Layers

**CLI Layer (Entry Point):**
- Purpose: Parse command flags, validate inputs, coordinate command execution
- Location: `src/commands/*/` (dbt-to-sml-command.ts, bim-to-sml-command.ts, etc.)
- Contains: Command classes extending oclif Command
- Depends on: Parsers, Converters, Writers, Logger
- Used by: bin/run.js via oclif router

**Parser Layer:**
- Purpose: Read and validate source format into intermediate models
- Location: `src/commands/*/` (*-parser.ts, *-file-parser.ts)
- Contains: Format-specific parsers (DbtParser, BimFileParser, SmlFolderReader)
- Examples:
  - `src/commands/dbt-to-sml/dbt-converter/dbt-parser.ts` - Parses dbt yaml files with Zod validation
  - `src/commands/bim-to-sml/bim-file-parser.ts` - Parses Power BI JSON model
  - `src/shared/sml-folder-reader.ts` - Reads SML YAML folder structure recursively
- Depends on: Guard, Logger, Yaml parser, Zod schemas

**Converter Layer:**
- Purpose: Transform intermediate format to SML target format
- Location: `src/commands/*/[*-converter/]` subdirectories
- Contains: Core orchestrator + specialized converters
- Orchestrators:
  - `src/commands/dbt-to-sml/dbt-converter/dbt-converter.ts` - Converts DBT metadata to SML
  - `src/commands/bim-to-sml/bim-converter/bim-to-sml-converter.ts` - Orchestrates BIM→SML conversion
  - `src/commands/sml-to-cortex/cortex-converter/cortex-converter.ts` - SML to Cortex Analyst YAML
- Specialized Converters (BIM):
  - `measure-converter.ts` - BIM measures → SML metrics/calculations
  - `dimension-converter.ts` - BIM tables → SML dimensions
  - `table-converter.ts` - Classifies tables (fact vs dimension)
  - `dataset-converter.ts` - Creates SML datasets
  - `relationship-converter.ts` - Maps BIM relationships
  - `connection-converter.ts` - Creates SML connections
  - `perspective-converter.ts` - Converts BIM perspectives
- Specialized Converters (DAX):
  - `dax-converter.ts` - DAX tokenizer and expression parser
  - `conversion-pipeline.ts` - 6-stage DAX→MDX conversion orchestration
  - `ai-dax-converter.ts` - Optional LLM-powered DAX conversion
  - `conversion-templates/` - Pattern-based conversion templates
- Depends on: SmlConvertResultBuilder, Guard, Logger, SML SDK

**Writer Layer:**
- Purpose: Persist SML objects to YAML files in standardized directory structure
- Location: `src/shared/sml-result-writer.ts`
- Contains: SmlResultWriter class with file type routing
- Maps SML object types to output directories (models/, dimensions/, metrics/, etc.)
- Encodes invalid filename characters
- Depends on: Logger, SML SDK serializer

**Shared Utilities Layer:**
- Purpose: Provide cross-cutting functionality used by all converters
- Location: `src/shared/`
- Key utilities:
  - `sml-convert-result.ts` - SmlConvertResultBuilder (accumulator) + result interface
  - `guard.ts` - Validation and precondition checking
  - `sml-converter-queries.ts` - Query interface for finding existing SML objects
  - `sml-unique-name-generator.ts` - Auto-suffix duplicates (name, name(1), name(2))
  - `logger.ts` - Logging interface
  - `command-logger.ts` - Creates logger instances per command
  - `file-system-util.ts` - Path validation, folder cleanup, file enumeration
  - `yaml-parser.ts` - Wraps js-yaml
  - `dw-types.ts` - Enum of supported data warehouse types (BigQuery, Snowflake, etc.)
  - `cortex-converter-util.ts` - Cortex-specific utilities
  - `composite-model-util.ts` - CompositeModel aggregation logic
- Depends on: Zod, Logger

## Data Flow

**Converter Pipeline (Generic 3-Stage):**

1. **Parse Stage** → Read source format
   - File/folder validation (parseInput)
   - Format-specific parser instantiation
   - Schema validation (Zod for DBT, JSON parsing for BIM)
   - Result: Intermediate model representation

2. **Convert Stage** → Transform to SML
   - Initialize SmlConvertResultBuilder (accumulator)
   - Create specialized converter for each object type
   - Use SmlConverterQuery to resolve cross-references
   - Use SmlUniqueNameGenerator to deduplicate object names
   - Populate builder with SML objects
   - Result: SmlConverterResult

3. **Persist Stage** → Write to disk
   - SmlResultWriter.persist() routes objects to typed folders
   - Each object type gets its own subdirectory
   - Filenames encoded to remove invalid characters
   - Catalog written to root as catalog.yml
   - Result: YAML files on disk

**BIM-Specific DAX Conversion (6-Stage Pipeline):**

1. **Direct Conversion** → 1:1 function mappings (SUM→Sum, MAX→Max)
2. **Simple Expression** → Math operators ([A]/[B], [X]+[Y])
3. **Template Conversion** → Pattern-based (DIVIDE, IF, SWITCH, CALCULATE)
4. **VAR Inline + Retry** → Inline variable declarations, retry stages 1-3
5. **AI Conversion** → LLM-powered (if --llmName flag provided)
6. **Fallback TODO** → `0 /* TODO: {original_dax} */`

Each stage feeds unconverted expressions to the next stage.

**State Management:**

- **SmlConvertResultBuilder:** Central accumulator for all SML objects
  - Methods: addModel(), addDimension(), addMetric(), etc.
  - Validates unique_name uniqueness globally
  - Prevents duplicate object registration
  - Returns final SmlConverterResult

- **SmlConverterQuery:** Lookup service for previously converted objects
  - findByUniqueName(name)
  - Used to resolve cross-references during conversion

- **SmlUniqueNameGenerator:** Auto-suffix generator for duplicate names
  - Maintains count map
  - Generates: name → name(1) → name(2) on conflict

## Key Abstractions

**SmlConvertResultBuilder (Builder Pattern):**
- Purpose: Accumulate and validate SML objects during conversion
- Location: `src/shared/sml-convert-result.ts`
- Methods: addModel(), addDimension(), addMetric(), addDataset(), etc.
- Guarantees: unique_name uniqueness across ALL SML objects
- Example usage: In DbtConverter and BimToYamlConverter constructors

**Command Classes (oclif.Command subclass):**
- Purpose: CLI entry points with flag parsing
- Location: `src/commands/*/` (*-command.ts)
- Responsibilities:
  1. Parse CLI flags via static flags property
  2. Instantiate logger
  3. Validate input paths
  4. Orchestrate parse → convert → write flow
  5. Handle cleanup (--clean flag)
- Example: `src/commands/bim-to-sml/bim-to-sml-command.ts`

**Specialized Converters (Strategy Pattern):**
- Purpose: Convert single object type with format-specific logic
- Examples (BIM):
  - `MeasureConverter` - Converts BIM measures with DAX expression handling
  - `DimensionConverter` - Converts BIM tables to dimensions with hierarchy logic
  - `TableConverter` - Classifies tables as fact or dimension based on usage
- Each receives: BimRoot/BimTable, logger, builder, query service
- Each returns: SML object added to builder

**Parser Classes:**
- Purpose: Read and validate source format
- Examples:
  - `DbtParser` - Reads dbt manifests with Zod validation
  - `BimFileParser` - Parses JSON BIM file and validates schema
  - `SmlFolderReader` - Recursive YAML reader for SML models
- Each has create() factory method and parse() / parseFile() methods

## Entry Points

**CLI Entry:**
- Location: `bin/run.js`
- Triggers: `node bin/run.js <command> [flags]`
- Responsibilities: Load oclif core and route to command directory

**Command Router:**
- Location: `src/index.ts`
- Exports: COMMANDS record mapping command names to Command classes
- Maps:
  - "dbt-to-sml" → DbtToSmlCommand
  - "bim-to-sml" → BimToSmlCommand
  - "sml-to-cortex" → SMLToCortexCommand
  - "add-files-to-snowflake" → AddFilesToSnowflakeCommand

**Initialization Hook:**
- Location: `src/hooks/init/init.ts`
- Runs: Before any command execution
- Purpose: Global setup (e.g., environment validation)

**Individual Commands:**
- DbtToSmlCommand: `src/commands/dbt-to-sml/dbt-to-sml-command.ts`
  - Flags: source, output, dbType, database, schema, atscaleConnectionId, clean
  - Flow: DbtParser → DbtConverter → SmlResultWriter

- BimToSmlCommand: `src/commands/bim-to-sml/bim-to-sml-command.ts`
  - Flags: source, output, clean, atscaleConnectionId, llmName
  - Flow: BimFileParser → BimToYamlConverter → SmlResultWriter
  - Special: LLM validation if --llmName provided

- SMLToCortexCommand: `src/commands/sml-to-cortex/sml-to-cortex-command.ts`
  - Flags: source, output, clean
  - Flow: SmlFolderReader → CortexConverter → saveCortexYamlFiles()

- AddFilesToSnowflakeCommand: `src/commands/add-files-to-snowflake/add-snowflake-files-command.ts`
  - Flags: source, Snowflake connection params
  - Flow: Read Cortex YAML → Snowflake SDK → Upload

## Error Handling

**Strategy:** Guard-based validation with fail-fast approach

**Patterns:**

1. **Precondition Validation (Guard.should):**
   ```typescript
   Guard.should(rule: boolean, msg: string) // throws if false
   ```

2. **Existence Checks (Guard.exists):**
   ```typescript
   Guard.exists(value, "value must exist") // throws if null/undefined
   ```

3. **String Validation (Guard.notEmpty):**
   ```typescript
   Guard.notEmpty(str, "string must not be empty")
   ```

4. **Required Values (Guard.allRequired):**
   ```typescript
   Guard.allRequired([[val1, "name1"], [val2, "name2"]])
   ```

5. **Custom Error Constructors:**
   ```typescript
   Guard.forError(MyCustomError).should(...) // uses custom error
   ```

Locations where Guard is used:
- `src/shared/sml-convert-result.ts` - Validates catalog singleton
- `src/shared/guard.ts` - Core Guard implementation
- Throughout parsers and converters - Input validation

## Cross-Cutting Concerns

**Logging:**
- Framework: Custom Logger interface (src/shared/logger.ts)
- Implementation: CommandLogger (src/shared/command-logger.ts)
- Levels: error, warn, info, http, verbose, debug, silly
- Colors: Red (errors), Yellow (warnings)
- Pattern: Every component receives logger instance in constructor
- Usage: Log parsing progress, conversion steps, object creation

**Validation:**
- Framework: Guard for preconditions, Zod for schema validation
- Guard: Used for null checks, existence validation, assertions
- Zod: Used for structured data validation (DBT schemas)
- Pattern: Validate early in parse layer, fail fast with Guard in converters

**Unique Naming:**
- Pattern: `<type>.<friendly_name>` (e.g., model.sales_model, dim.customer)
- Generation: makeUniqueName() utility
- Deduplication: SmlUniqueNameGenerator with auto-suffixing (name, name(1), name(2))
- Critical: SmlConvertResultBuilder enforces uniqueness globally

**Path Handling:**
- Utility: file-system-util.ts
- Functions: parseInput(), parseInputFile(), encodeFileName(), cleanUpOutputFolder()
- Pattern: Convert relative paths to absolute using path.resolve()
- Encoding: Replace invalid filename chars ([/\\:*?"<>|]) with underscore

---

*Architecture analysis: 2026-01-26*
