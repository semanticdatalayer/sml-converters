# Codebase Concerns

**Analysis Date:** 2026-01-26

## Tech Debt

**Incomplete DAX to MDX Conversion:**
- Issue: Many DAX expressions fall through to TODO stubs (`0 /* TODO: {...} */`) when conversion fails
- Files: `src/commands/bim-to-sml/bim-converter/measure-converter.ts`, `src/commands/bim-to-sml/bim-converter/conversion-pipeline.ts`, `src/commands/bim-to-sml/bim-converter/dax-converter.ts`
- Impact: Converted SML metrics are non-functional placeholders; analysts must manually fix all TODO expressions before deployment
- Fix approach: Expand template coverage for common DAX patterns (IFERROR, IN operator edge cases, CALCULATE variations); improve AI LLM integration to reduce fallthrough rate

**File Name Collision Handling:**
- Issue: Output file writer does not check for existing files or auto-suffix duplicates
- Files: `src/shared/sml-result-writer.ts:68` (TODO comment)
- Impact: When two SML objects have the same unique_name after encoding, the second silently overwrites the first
- Fix approach: Implement collision detection in `SmlResultWriter.persistObject()` to suffix duplicate filenames (e.g., `name_(1).yml`, `name_(2).yml`)

**Hardcoded Snowflake Case Handling:**
- Issue: Dataset unique_name casing is not adjusted for Snowflake (which requires UPPERCASE)
- Files: `src/commands/dbt-to-sml/dbt-converter/dbt-converter.ts:554` (TODO comment)
- Impact: DBT→SML→Cortex conversions produce lowercase identifiers that fail in Snowflake's case-sensitive context
- Fix approach: Use `DWType` enum to apply `.toLocaleUpperCase()` for Snowflake targets in dataset naming

**Sample Repo Workaround:**
- Issue: Temporary workaround for sample repository that runs on Snowflake
- Files: `src/commands/dbt-to-sml/dbt-converter/dbt-converter.ts:685` (TODO comment)
- Impact: Unknown conditional logic affects non-sample conversions; maintenance risk
- Fix approach: Document the specific condition and remove when sample repo is no longer needed

**Unused Dimensions in allObjects():**
- Issue: Dimensions array is added twice in `SmlConvertResultBuilder.allObjects()`
- Files: `src/shared/sml-convert-result.ts:68` (duplicate spread operator)
- Impact: When validating unique_name uniqueness, dimensions are checked twice; performance minor but correctness unaffected
- Fix approach: Remove duplicate `...this._dimensions` line

**SDK Interface Questions:**
- Issue: Alias field in metric calculations marked as optional without clear rationale
- Files: `src/commands/dbt-to-sml/dbt-converter/dbt-calculations.ts:284` (TODO comment)
- Impact: Unknown; requires SDK team clarification to ensure correct metric modeling
- Fix approach: Escalate to SDK team for documentation or API clarification

**Calculation Group Conversion Limitations:**
- Issue: Power BI calculation groups cannot be fully converted to SML; dynamic SELECTEDMEASURE() has no direct SML equivalent
- Files: Architectural limitation across BIM conversion suite
- Impact: Calculation groups must be manually modeled as separate SML calculated metrics; cannot preserve dynamic behavior
- Fix approach: Document conversion gaps in BIM converter README; implement semi-manual conversion approach with warnings

## Known Issues

**XXX Debug Markers in Production Code:**
- Issue: Debug console.log statements with XXX prefix left in converter logic
- Files:
  - `src/commands/bim-to-sml/bim-converter/measure-converter.ts:281, 363, 498` (console.log)
  - `src/commands/bim-to-sml/bim-converter/dataset-converter.ts:171` (logger.info)
- Symptoms: Verbose output during BIM conversions; makes logs harder to parse
- Workaround: Redirect stdout or filter XXX lines when analyzing conversion logs
- Fix: Replace with proper logger.debug() calls in measure-converter.ts and remove dataset-converter XXX log

**Console Logging Bypasses Logger:**
- Issue: 83 console.log/console.error/console.warn calls bypass centralized logging system
- Files: Scattered across BIM converter modules
- Impact: Logs are not controlled by logger configuration; lose log level filtering, formatting, and structured output
- Fix approach: Replace all direct console calls with `this.logger.info()`, `this.logger.debug()`, etc.

**Unsafe Type Assertions (any):**
- Issue: 12 uses of `any` type in critical paths weaken type safety
- Files:
  - `src/shared/enum-util.ts:6` (input parameter)
  - `src/shared/guard.ts:59` (typeGuard parameter)
  - `src/commands/add-files-to-snowflake/add-snowflake-files-command.ts:101` (flags parameter)
  - `src/shared/sml-folder-reader.ts:137` (type guard check)
- Impact: Silent type errors possible; reducer compile-time safety
- Fix approach: Replace `any` with specific types or generics; use conditional type narrowing

**Snowflake Connection Error Handling Gap:**
- Issue: Connection errors in OAuth/external browser auth may not be caught properly
- Files: `src/commands/add-files-to-snowflake/cortex-connect/SnowflakeConnection.ts:64-70` (callback-based async without proper error propagation)
- Symptoms: Async callback errors might not reject the Promise if synchronous error occurs
- Fix approach: Ensure all snowflake.createConnection() callbacks reject the outer Promise on error

## Security Considerations

**Environment Variable Exposure in Snowflake Command:**
- Risk: Snowflake credentials passed as plaintext environment variables (username, password, tokens)
- Files: `src/commands/add-files-to-snowflake/add-snowflake-files-command.ts:116-125` (reads process.env directly)
- Current mitigation: .env files not committed (assumed); CLI requires flag input
- Recommendations:
  - Use Snowflake JWT or OAuth instead of plaintext passwords where possible
  - Validate that .env is in .gitignore
  - Add warning in docs about credential security
  - Consider using secure credential store (AWS Secrets Manager, HashiCorp Vault) for production

**YAML Parsing Security:**
- Risk: `js-yaml` library used with default settings; potential for code execution via YAML gadgets
- Files: `src/shared/yaml-parser.ts` (uses `js-yaml` with no explicit safe parsing)
- Current mitigation: Source YAML is from trusted internal converters, not user input
- Recommendations:
  - Explicitly use `js-yaml.load(..., { safe: true })` to prevent arbitrary code execution
  - Document YAML security assumptions

**No Input Validation on File Paths:**
- Risk: File path traversal attacks possible if user-supplied paths not validated
- Files: `src/shared/file-system-util.ts` (parseInput, parseOutput functions)
- Current mitigation: Commands do not accept user-specified input paths; defaults to current directory
- Recommendations: Add path normalization and canonicalization; reject paths outside project root

## Performance Bottlenecks

**BIM Conversion Scales Linearly with Measure Count:**
- Problem: Every measure is converted sequentially through 6-stage pipeline; VAR inlining, template matching, and AI calls create nested loops
- Files: `src/commands/bim-to-sml/bim-converter/measure-converter.ts` (1244 lines), `src/commands/bim-to-sml/bim-converter/conversion-pipeline.ts` (575 lines)
- Cause: ConversionPipeline runs synchronously; AI conversion blocks on LLM calls; no parallelization
- Improvement path:
  - Parallelize measure conversion using Promise.all() where dependencies allow
  - Cache template matching results to avoid redundant pattern analysis
  - Batch AI LLM calls instead of per-measure

**DAX Tokenization on Every Conversion:**
- Problem: DaxTokenizer re-parses same DAX expression in multiple pipeline stages
- Files: `src/commands/bim-to-sml/bim-converter/conversion-pipeline.ts:108`
- Cause: Token cache not maintained across stages; tokenization is O(n) per stage
- Improvement path: Cache tokens in ConversionContext; reuse across all stages

**No Incremental Conversion:**
- Problem: Large BIM files with thousands of measures must be fully re-converted on every run
- Files: All BIM converter modules
- Impact: Database-scale models take minutes to convert; development velocity limited
- Improvement path: Store conversion results + metadata; skip previously converted measures; only re-convert changed ones

**Recursive SML Folder Read:**
- Problem: `SmlFolderReader` uses recursive Promise.all() to read entire folder tree
- Files: `src/shared/sml-folder-reader.ts:104` (recursion without depth limit)
- Cause: Loads all SML files into memory; no streaming or pagination
- Improvement path: Implement streaming reader; add depth limits; lazy-load dimensions/metrics on demand

## Fragile Areas

**Conversion Pipeline Stage Interdependencies:**
- Files: `src/commands/bim-to-sml/bim-converter/conversion-pipeline.ts`
- Why fragile: 6 stages have complex ordering and fallthrough logic; adding new template or VAR inline logic requires careful mutation to succeed/fail paths
- Safe modification: Document stage contract clearly; add integration tests for cross-stage transitions (Stage 1 fails → Stage 2 attempted, etc.); separate concerns with clear ConversionResult state machine
- Test coverage: No unit tests for pipeline stage transitions; relies on integration tests in scripts/test-bim-conversion.ts

**Calculation Group Referencing:**
- Files: `src/commands/bim-to-sml/bim-converter/measure-converter.ts` (calculation group detection and fallback)
- Why fragile: Complex DAX patterns referencing calc groups (`CALCULATE(SELECTEDMEASURE(), 'CG'[col] = "item")`) require careful pattern matching to detect and mark as unconvertible
- Safe modification: Add dedicated CalculationGroupDetector class; unit test DAX patterns exhaustively; log all detected calc group references for manual review
- Test coverage: Calc group detection scattered across measure-converter; no dedicated test suite

**VAR Inlining Logic:**
- Files: `src/commands/bim-to-sml/bim-converter/var-analysis/var-inliner.ts` (327 lines), `src/commands/bim-to-sml/bim-converter/var-analysis/var-safety-checker.ts` (310 lines)
- Why fragile: Determines which VARs are safe to inline; errors result in invalid inlined expressions breaking Stage 4 retry
- Safe modification: Add comprehensive VAR safety unit tests; test edge cases (recursive VARs, cross-table references, cyclic deps); log safety decisions
- Test coverage: VAR inlining tested indirectly via measure conversion tests; no dedicated unit tests

**DBT Metric Type Handling:**
- Files: `src/commands/dbt-to-sml/dbt-converter/dbt-calculations.ts` (544 lines)
- Why fragile: Switch statement on dbtMetric.type with many branches and missing types; unsupported types silently skipped with warnings
- Safe modification: Create MetricTypeConverter classes per type; use strategy pattern; add exhaustive pattern matching; test all DBT metric types
- Test coverage: No unit tests for DBT calculation conversion; relies on script-based validation

**Relationship Mapping (BIM):**
- Files: `src/commands/bim-to-sml/bim-converter/relationship-converter.ts` (356 lines)
- Why fragile: Complex table classification (fact vs dimension) based on relationship cardinality; errors cascade to table role misclassification
- Safe modification: Add unit tests for table classification logic; document assumptions about relationship cardinality
- Test coverage: Table classification tested indirectly via full BIM conversion; no dedicated unit tests

## Scaling Limits

**BIM Model Size Ceiling:**
- Current capacity: Tested on Power BI models with ~100 measures, ~50 dimensions
- Limit: Models with >500 measures or recursive measure dependencies may timeout (6-stage pipeline × measures = O(n²) complexity)
- Scaling path:
  1. Implement incremental conversion caching
  2. Parallelize measure conversion across CPU cores
  3. Add measure dependency graph to skip redundant conversions
  4. Move large DAX parsing to C++ extension (e.g., tree-sitter) if Python binding available

**DBT Project Size Ceiling:**
- Current capacity: DBT projects with ~1000 models
- Limit: Projects with >5000 models may hit memory limits loading entire dbt_project.yml and manifest
- Scaling path: Stream manifest parsing; lazy-load model definitions; implement selective conversion (convert only specific selectors)

**Snowflake Stage Upload Ceiling:**
- Current capacity: Individual YAML files typically <1MB
- Limit: Large Cortex Analyst models with >1000 datasets might hit Snowflake stage space or upload time limits
- Scaling path: Batch YAML files; implement resumable uploads; compress before upload

## Dependencies at Risk

**@ax-llm/ax (v14.0.39) - LLM Integration:**
- Risk: Undocumented dependency; DAX→MDX AI conversion confidence scores not validated against ground truth
- Impact: If LLM provider changes API or model degrades, AI conversion stage breaks silently
- Migration plan: Add LLM fallback chain (OpenAI → Anthropic → local model); implement confidence threshold enforcement; add human review workflow for <0.5 confidence results

**snowflake-sdk (v2.3.1) - Node.js Driver:**
- Risk: Callback-based async API makes error handling error-prone; newer releases may deprecate async callback style
- Impact: If Snowflake deprecates callback API, Snowflake upload command breaks
- Migration plan: Migrate to `snowflake-sdk` promise-based API when available or switch to `snowflake-api` library; refactor SnowflakeConnection to async/await

**sml-sdk (v1.4.0) - SML Data Structures:**
- Risk: SDK version pinned; breaking changes in future releases require converter updates across all converters
- Impact: If SML schema evolves, converters produce invalid YAML
- Migration plan: Monitor SML SDK releases; run conversion integration tests on SDK pre-release versions; document SML schema version expectations

**js-yaml (v4.1.1) - YAML Parser:**
- Risk: Minor library with security considerations around gadget deserialization
- Impact: If YAML parser has vulnerability, SML folder reading may be compromised (low risk since SML comes from trusted converters)
- Migration plan: Upgrade to latest js-yaml; use safe parsing mode explicitly

## Missing Critical Features

**No Offline DAX Reference Resolution:**
- Problem: When BIM measures reference other measures, resolution depends on having all measures loaded first
- Blocks: Cannot convert partial BIM files or individual measures in isolation
- Workaround: Always convert entire BIM model; measures referencing missing measures generate warnings

**No Conversion Resume/Checkpoint:**
- Problem: Long-running BIM conversions with thousands of measures cannot be resumed on failure
- Blocks: Network interrupts, timeouts, or crashes lose all progress
- Workaround: Re-run entire conversion (expensive)

**No Schema Validation for Converted SML:**
- Problem: Converted SML YAML not validated against SML schema before writing
- Blocks: Invalid SML can be written to disk, discovered only at deployment time
- Workaround: Manual validation using sml-sdk serialization roundtrip

**No Diff/Preview of Conversions:**
- Problem: Users cannot preview converted SML before committing to output folder
- Blocks: Cannot validate correctness before overwriting existing SML
- Workaround: Manually review YAML files post-conversion

## Test Coverage Gaps

**No Unit Tests for DAX Conversion Stages:**
- What's not tested: Each ConversionPipeline stage independently; stage fallthrough logic; confidence score thresholds
- Files: `src/commands/bim-to-sml/bim-converter/conversion-pipeline.ts`
- Risk: Regression in confidence scoring or stage ordering breaks conversions silently; false negatives in confidence thresholds
- Priority: High

**No Unit Tests for VAR Inlining:**
- What's not tested: VAR safety analysis; cyclic dependencies; cross-table references; scope tracking
- Files: `src/commands/bim-to-sml/bim-converter/var-analysis/*`
- Risk: Invalid inlining produces wrong MDX; untested edge cases cause Stage 4 failures
- Priority: High

**No Unit Tests for Table Classification (Fact vs Dimension):**
- What's not tested: Relationship cardinality analysis; fact table detection; dimension-only tables
- Files: `src/commands/bim-to-sml/bim-converter/table-converter.ts`
- Risk: Incorrect classification cascades to wrong dimension/measure modeling
- Priority: High

**No Unit Tests for DBT Metric Type Conversion:**
- What's not tested: All DBT metric types (simple, derived, ratio, cumulative, conversion); unsupported types fallback behavior
- Files: `src/commands/dbt-to-sml/dbt-converter/dbt-calculations.ts`
- Risk: Silent failures for unsupported types; incomplete metric definitions
- Priority: Medium

**No Unit Tests for Snowflake Connection/Upload:**
- What's not tested: Connection error handling; authentication flows; file upload with collision detection; stage management
- Files: `src/commands/add-files-to-snowflake/cortex-connect/SnowflakeConnection.ts`
- Risk: Silent connection failures; corrupted stage uploads; credentials not handled safely
- Priority: High

**No BIM Model Regression Suite:**
- What's not tested: Full end-to-end conversion against diverse BIM models; no baseline comparison for conversion quality
- Files: Integration tests in `scripts/test-bim-conversion.ts`
- Risk: Converter regressions not caught; conversion quality degrades silently
- Priority: High

**No Performance Benchmarks:**
- What's not tested: Conversion time vs model size; memory usage; DAX parsing complexity
- Files: Scripts only, no benchmarking harness
- Risk: Performance regressions undetected; scaling limits unknown
- Priority: Medium

---

*Concerns audit: 2026-01-26*
