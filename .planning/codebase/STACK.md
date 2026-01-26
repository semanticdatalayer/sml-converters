# Technology Stack

**Analysis Date:** 2026-01-26

## Languages

**Primary:**
- TypeScript 5.9.3 - All source code in `src/`
- JavaScript - CLI entry point and configuration files

**Secondary:**
- YAML - Output format for SML and Cortex configurations
- JSON - BIM model input format, Power BI semantic models

## Runtime

**Environment:**
- Node.js 18.0.0 or higher (required by `engines.node` in `package.json`)

**Package Manager:**
- npm (with package-lock.json)
- Lockfile: Present at `package-lock.json`

## Frameworks

**Core:**
- `@oclif/core` 4.8.0 - CLI framework for command-based interface
- `@oclif/plugin-help` 6.2.35 - Auto-generated CLI help system

**Testing:**
- None configured (npm test is a no-op)
- Manual test scripts available: `npm run test-conversion`, `npm run test-custom-calcs`, `npm run validate-conversion`

**Build/Dev:**
- TypeScript 5.9.3 - Compiler
- tsx 4.19.2 - TypeScript executor for scripts
- ts-node 10.9.2 - TypeScript execution in Node
- ESLint 8.57.1 - Static code analysis
- @typescript-eslint/eslint-plugin 6.21.0 - TypeScript-specific linting rules
- @typescript-eslint/parser 6.21.0 - TypeScript parser for ESLint
- Prettier (via @oclif/prettier-config 0.2.1) - Code formatting
- shx 0.3.4 - Cross-platform shell commands for build scripts

## Key Dependencies

**Critical:**
- `sml-sdk` 1.4.0 - SML data structures, object types, and YAML serialization
  - Used throughout: `src/shared/sml-convert-result.ts`, `src/shared/sml-result-writer.ts`, all converters
  - Provides: SMLModel, SMLObject, SMLCatalog, SMLObjectType enums, serializeToSML()

- `@ax-llm/ax` 14.0.39 - LLM abstraction layer for AI-powered conversions
  - Used in: `src/commands/bim-to-sml/bim-converter/ai-dax-converter.ts`
  - Supports: OpenAI, Anthropic, Google Gemini for DAX→MDX conversion

- `snowflake-sdk` 2.3.1 - Snowflake database connection client
  - Used in: `src/commands/add-files-to-snowflake/cortex-connect/`
  - Connects to Snowflake for Cortex Analyst YAML upload

**Infrastructure:**
- `js-yaml` 4.1.1 - YAML parser and serializer for reading/writing SML and Cortex files
- `zod` 3.22.3 - Schema validation library for runtime type checking
- `chalk` 4.1.2 - Terminal string styling for colored CLI output
- `dotenv` 16.6.1 - Environment variable loading from .env files
- `@types/js-yaml` 4.0.9 - TypeScript type definitions for js-yaml
- `@types/node` 22.19.1 - TypeScript type definitions for Node.js APIs

**Development:**
- `eslint-config-prettier` 9.1.2 - ESLint config that disables conflicting rules with Prettier
- `oclif` 4.22.44 - CLI framework scaffolding and manifest generation

## Configuration

**Environment:**
- Loaded via `dotenv` from `.env` file (see `.env.example` for template)
- Key environment variables:
  - **Snowflake**: `SNOWFLAKE_ACCOUNT`, `SNOWFLAKE_DATABASE`, `SNOWFLAKE_SCHEMA`, `SNOWFLAKE_STAGE`
  - **Snowflake Auth**: `SNOWFLAKE_USERNAME`, `SNOWFLAKE_PASSWORD`, `SNOWFLAKE_PASSCODE`, `SNOWFLAKE_PRIVATE_KEY_PATH`, `SNOWFLAKE_PRIVATE_KEY_PASS`, `SNOWFLAKE_TOKEN`
  - **Snowflake OAuth**: `SNOWFLAKE_OAUTH_CLIENT_ID`, `SNOWFLAKE_OAUTH_CLIENT_SECRET`, `SNOWFLAKE_OAUTH_AUTH_URL`, `SNOWFLAKE_OAUTH_TOKEN_REQUEST_URL`
  - **LLM**: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`

**TypeScript:**
- `tsconfig.json`: Main TypeScript config (target: ES2022, module: CommonJS, strict mode enabled)
  - Compiler options: declaration, rootDir: src, outDir: dist, strict type checking, JSON module resolution
- `tsconfig.scripts.json`: Separate config for test/validation scripts in `scripts/` directory

**Linting:**
- `.eslintrc.js`: ESLint configuration with TypeScript parser
  - Enabled rules: no-misused-promises, require-await, no-floating-promises (async safety)
  - Disabled: no-explicit-any (allows `any` type for flexibility in converters)
  - Parser: @typescript-eslint/parser with tsconfig.json project references

**Formatting:**
- `.prettierrc.json`: Minimal Prettier config
  - Setting: `trailingComma: "all"`

**CLI Framework:**
- `.oclifrc.js`: oclif CLI configuration
  - Bin name: sml-converters
  - Strategy: explicit command discovery from dist/index.js
  - Plugins: @oclif/plugin-help
  - Init hook for environment setup

## Build Process

**Build Command:**
```bash
npm run build
```

**Build Steps:**
1. Remove existing `dist/` directory
2. Compile TypeScript with `tsc -b` (incremental build)
3. Copy `src/commands/bim-to-sml/bim-converter/conversion-templates/function-mappings.json` to dist (required for runtime)

**Entry Point:**
- CLI: `./bin/run.js` (wrapper that loads compiled dist/index.js)
- Package main: `dist/index.js`
- Types declaration: `dist/index.d.ts`

## Package Publishing

**Package Files:**
- Distribution: `./bin/run.js`, `./dist/`, `./oclif.manifest.json`, `./.oclifrc.js`
- Hooks: `postpack` removes manifest, `prepack` regenerates manifest and README

**Manifest Management:**
- oclif manifest auto-generated during `npm run prepack`
- Tracks available commands in compiled dist output

## Platform Requirements

**Development:**
- Node.js 18.0.0+
- npm
- TypeScript compiler
- ESLint + TypeScript ESLint plugin
- Git (for repository)

**Production/Runtime:**
- Node.js 18.0.0+
- Network access to:
  - Snowflake (if using add-files-to-snowflake command)
  - OpenAI/Anthropic/Gemini API endpoints (if using LLM-powered DAX conversion with --llmName flag)
  - File system access (for reading source formats and writing SML output)

**Data Warehouse Targets:**
- Snowflake (Cortex Analyst integration)
- BigQuery, PostgreSQL, Databricks, Iris (supported via SML models)

---

*Stack analysis: 2026-01-26*
