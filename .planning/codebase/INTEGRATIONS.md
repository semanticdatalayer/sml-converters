# External Integrations

**Analysis Date:** 2026-01-26

## APIs & External Services

**LLM/AI Services:**
- **OpenAI** - DAX to MDX expression conversion
  - SDK/Client: `@ax-llm/ax` 14.0.39
  - Auth: `OPENAI_API_KEY` environment variable
  - File: `src/commands/bim-to-sml/bim-converter/ai-dax-converter.ts` (OpenAIDaxToMdxConverter class)
  - Usage: Optional --llmName flag in bim-to-sml command for AI-powered DAX translation

- **Anthropic (Claude)** - DAX to MDX expression conversion
  - SDK/Client: `@ax-llm/ax` 14.0.39
  - Auth: `ANTHROPIC_API_KEY` environment variable
  - File: `src/commands/bim-to-sml/bim-converter/ai-dax-converter.ts` (AnthropicDaxToMdxConverter class)
  - Usage: Optional --llmName flag in bim-to-sml command

- **Google Gemini** - DAX to MDX expression conversion
  - SDK/Client: `@ax-llm/ax` 14.0.39
  - Auth: `GEMINI_API_KEY` environment variable
  - File: `src/commands/bim-to-sml/bim-converter/ai-dax-converter.ts` (GeminikDaxToMdxConverter class)
  - Usage: Optional --llmName flag in bim-to-sml command

## Data Storage

**Databases:**
- **Snowflake** - Primary data warehouse target and deployment destination
  - Connection: `SNOWFLAKE_ACCOUNT`, `SNOWFLAKE_DATABASE`, `SNOWFLAKE_SCHEMA`, `SNOWFLAKE_STAGE` required
  - Client: `snowflake-sdk` 2.3.1
  - Location: `src/commands/add-files-to-snowflake/cortex-connect/SnowflakeConnection.ts`
  - Purpose: Upload Cortex Analyst YAML and manage semantic layer deployment

**File Storage:**
- **Local filesystem only** - SML output written to local disk via `SmlResultWriter`
  - Location: `src/shared/sml-result-writer.ts`
  - Format: YAML files organized by object type (models/, dimensions/, datasets/, metrics/, calculations/, connections/, security/)
  - File naming: Encodes invalid characters via `encodeFileName()` utility

**Caching:**
- None detected in codebase

## Authentication & Identity

**Snowflake Authentication:**
- Multiple auth methods supported via `SnowflakeAuth` interface
  - Location: `src/commands/add-files-to-snowflake/cortex-connect/SnowflakeAuth.ts`
  - Methods:
    - **Password**: USERNAME/PASSWORD basic auth (`SNOWFLAKE_USERNAME`, `SNOWFLAKE_PASSWORD`)
    - **MFA**: Username/Password with MFA passcode (`SNOWFLAKE_PASSCODE`)
    - **JWT/Keypair**: Private key authentication (`SNOWFLAKE_PRIVATE_KEY_PATH`, `SNOWFLAKE_PRIVATE_KEY_PASS`)
    - **Token/PAT**: Programmatic access token (`SNOWFLAKE_TOKEN`)
    - **OAuth Code Flow**: Client credentials + auth URL (`SNOWFLAKE_OAUTH_CLIENT_ID`, `SNOWFLAKE_OAUTH_CLIENT_SECRET`)
    - **OAuth Authorization Code**: Browser-based auth (`SNOWFLAKE_OAUTH_AUTH_URL`, `SNOWFLAKE_OAUTH_TOKEN_REQUEST_URL`)
    - **OKTA SSO**: External browser auth with Okta URL pattern (*.okta.com)
    - **External Browser**: Generic external auth with browser timeout (60s)
  - Config validation: `src/commands/add-files-to-snowflake/cortex-connect/cortex-config-validator.ts`

**LLM Authentication:**
- API keys provided via environment variables (OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY)
- Validated at command startup before conversion begins
- No token refresh mechanism (single request per conversion)

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, DataDog, etc.)

**Logs:**
- Custom logger implementation using chalk for colored output
  - Location: `src/shared/command-logger.ts`
  - Uses `@oclif/core` Command.log() for output
  - Levels: error (red), warn (yellow), info, http, verbose, debug, silly
  - No persistent logging to files

## CI/CD & Deployment

**Hosting:**
- GitHub repository: https://github.com/semanticdatalayer/sml-converters
- Published as npm package (sml-converters)
- Installed locally or in CI/CD pipelines

**CI Pipeline:**
- Not detected in codebase (no GitHub Actions, Jenkins, etc. config files)

**Deployment Target:**
- Snowflake (via add-files-to-snowflake command)
- SML YAML artifacts written to local/network filesystem
- Manual deployment to data warehouse platforms

## Environment Configuration

**Required env vars:**
- **Snowflake (if using add-files-to-snowflake command):**
  - `SNOWFLAKE_ACCOUNT` - Required
  - `SNOWFLAKE_DATABASE` - Required
  - `SNOWFLAKE_SCHEMA` - Required
  - `SNOWFLAKE_STAGE` - Optional
  - One auth method required (see auth section above)

- **LLM (if using bim-to-sml with --llmName flag):**
  - `OPENAI_API_KEY` - If --llmName=openai
  - `ANTHROPIC_API_KEY` - If --llmName=anthropic
  - `GEMINI_API_KEY` - If --llmName=gemini

**Secrets location:**
- `.env` file at project root (loaded via dotenv)
- Template at `.env.example`
- Not committed to git (listed in .gitignore)
- Individual env vars: SNOWFLAKE_PASSWORD, SNOWFLAKE_PRIVATE_KEY_PASS, SNOWFLAKE_TOKEN, API keys

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected
- Snowflake integration is pull-based (CLI pulls from local files and pushes to Snowflake)

## Integration Flows

**BIM to SML Conversion Flow:**
1. Read Power BI BIM file (JSON format)
2. Optional: AI-powered DAX→MDX conversion (requires LLM API key + --llmName flag)
3. Output: SML YAML files to local filesystem
4. No external API calls required (unless using --llmName)

**SML to Cortex Flow:**
1. Read SML YAML files from local filesystem
2. Transform to Snowflake Cortex Analyst YAML format
3. Output: Cortex YAML files to local filesystem
4. No external API calls required

**Upload to Snowflake Flow:**
1. Read Cortex YAML files from local filesystem
2. Connect to Snowflake using auth method from env vars
3. Upload files to Snowflake stage/database
4. Requires: Snowflake connection, valid credentials, network access

**DBT to SML Flow:**
1. Read dbt metadata and model definitions
2. Output: SML YAML files to local filesystem
3. No external API calls required

## LLM Integration Details

**Framework:** `@ax-llm/ax` 14.0.39
  - Abstraction layer over multiple LLM providers
  - Instantiation: `AxAI.create({ name: "openai"|"anthropic"|"google-gemini", apiKey: ... })`
  - Usage: One-shot prompt for DAX expression translation
  - Location: `src/commands/bim-to-sml/bim-converter/ai-dax-converter.ts`

**Conversion Process:**
- Only activated with --llmName flag in bim-to-sml command
- Called for each measure that cannot be converted via direct/template matching
- Fallback: If LLM conversion unavailable or fails, measure gets TODO comment: `0 /* TODO: {original_dax} */`
- No retry mechanism on API failure

## Data Formats

**Input Formats:**
- **Power BI BIM**: JSON semantic model files (bim-to-sml)
- **dbt**: metadata.json + YAML model files (dbt-to-sml)
- **SML**: YAML catalog files (sml-to-cortex)

**Output Formats:**
- **SML**: YAML files following sml-sdk schema (from all converters)
- **Cortex Analyst**: YAML configuration files (sml-to-cortex)
- **Snowflake**: Deployed to stage/database (add-files-to-snowflake)

---

*Integration audit: 2026-01-26*
