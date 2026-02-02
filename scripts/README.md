# BIM Conversion Testing Scripts

Batch test BIM-to-SML conversions, track metrics, compare against baselines, validate SML output.

## Scripts Overview

1. **test-conversion** - Batch test multiple BIM files, generate reports, compare baselines
2. **validate-conversion** - Convert single BIM file and validate with SML CLI
3. **deploy-test** - Convert BIM file, deploy/validate with AtScale, capture errors

## Quick Start

### Single File Validation

```bash
# Validate single BIM file with SML CLI
npm run validate-conversion -- --input ./path/to/file.bim

# Specify custom output directory
npm run validate-conversion -- --input ./file.bim --output ./sml-output

# Custom SML CLI path
npm run validate-conversion -- --input ./file.bim --sml-cli /path/to/sml/bin/dev.js
```

### Batch Testing

```bash
# Install tsx if needed
npm install

# Run on a directory of BIM files
npm run test-conversion -- --input /Users/dianne/Downloads/bim/testfiles --output results.json

# Compare against baseline
npm run test-conversion -- --input ./test-bim --baseline baseline.json --diff changes.json

# With LLM conversion enabled
npm run test-conversion -- --input ./test-bim --output results.json --llm openai

# Verbose logging
npm run test-conversion -- --input ./test-bim --verbose
```

## Usage

### validate-conversion

Converts single BIM file, validates with SML CLI, shows detailed report.

```
npm run validate-conversion -- [options]

Options:
  --input <file>      BIM file to convert (required)
  --output <dir>      SML output directory (default: auto-generated)
  --sml-cli <path>    Path to SML CLI (default: /Users/dianne/go/src/github.com/AtScaleInc/SML/apps/cli/bin/dev.js)
  --verbose, -v       Show detailed logs
```

**Use this script:**

- After code changes to validate SML generation quality
- To debug specific conversion issues
- To see SML validation errors/warnings

### test-conversion

Batch test multiple BIM files.

```
npm run test-conversion -- [options]

Options:
  --input <dir>       Directory containing BIM files (required)
  --output <file>     Write JSON report to file
  --baseline <file>   Compare against baseline report
  --diff <file>       Write differences to file
  --llm <provider>    Enable AI DAX conversion (openai|anthropic|gemini)
  --verbose, -v       Show detailed logs
```

## Report Formats

### validate-conversion Output

Console report showing:

1. **Conversion Summary**: Duration, success/failure
2. **SML Objects**: Count of models, datasets, dimensions, metrics, relationships, connections
3. **Calculated Metrics Analysis**:
   - Total calculated metrics
   - Successfully converted (MDX)
   - TODO/unconverted count
   - Conversion rate %
   - Breakdown by conversion category (direct, template, VAR inlined, AI, unconvertible)
4. **SML Validation Results**:
   - Success/failure status
   - Warnings (duplicates, cycle references, etc.)
   - Errors (missing metrics, syntax issues, etc.)
   - Full SML CLI validation output

### test-conversion Output

Output JSON structure:

```json
{
  "timestamp": "2025-12-29T10:30:00Z",
  "input_directory": "/path/to/bim/files",
  "total_files": 10,
  "successful": 9,
  "failed": 1,
  "llm_enabled": false,
  "summaries": [
    {
      "file": "Sales_Dashboard_bim.json",
      "success": true,
      "duration_ms": 1234,
      "counts": {
        "models": 1,
        "datasets": 5,
        "dimensions": 8,
        "metrics": 12,
        "metrics_calculated": 20,
        "relationships": 10,
        "connections": 1
      },
      "metric_calc_details": {
        "total": 20,
        "mdx_converted": 15,
        "todo_remaining": 5,
        "conversion_rate": 75
      }
    }
  ]
}
```

## Workflow

### 1. Create Baseline

Run conversion on known-good code:

```bash
git checkout main
npm run test-conversion -- --input ./test-bim --output baseline.json
git add baseline.json
git commit -m "Add conversion baseline"
```

### 2. Make Changes

Update conversion logic on feature branch.

### 3. Compare

```bash
npm run test-conversion -- --input ./test-bim --baseline baseline.json --diff changes.json
```

Exit code 1 if differences found.

### 4. Review Diff

```json
[
  {
    "file": "Sales_Dashboard_bim.json",
    "changes": [
      {
        "field": "counts.metrics_calculated",
        "baseline": 18,
        "current": 20,
        "diff": 2,
        "percent_change": 11
      },
      {
        "field": "metric_calc_details.conversion_rate",
        "baseline": 70,
        "current": 80,
        "diff": 10
      }
    ]
  }
]
```

### 5. Update Baseline (if changes expected)

```bash
cp results.json baseline.json
git add baseline.json
git commit -m "Update baseline after conversion improvements"
```

## Use Cases

### Regression Testing

Detect unintended changes:

```bash
# Before changes
npm run test-conversion -- --input ./test-bim --output before.json

# After changes
npm run test-conversion -- --input ./test-bim --baseline before.json
```

### Tracking AI Conversion Progress

Monitor MDX conversion improvements:

```bash
# Without LLM
npm run test-conversion -- --input ./test-bim --output no-llm.json

# With LLM
npm run test-conversion -- --input ./test-bim --llm openai --output with-llm.json
```

Compare `metric_calc_details.conversion_rate` across reports.

### Testing LLM Provider Differences

```bash
npm run test-conversion -- --input ./test-bim --llm openai --output openai-results.json
npm run test-conversion -- --input ./test-bim --llm anthropic --output anthropic-results.json
```

## Test File Organization

Recommended structure:

```
test-bim/
├── simple/              # Minimal valid BIM files
│   ├── single-table.json
│   └── basic-relationship.json
├── complex/             # Multi-table, hierarchies
│   ├── sales-dashboard.json
│   └── financial-model.json
├── edge-cases/          # Specific scenarios
│   ├── hidden-columns.json
│   ├── time-dimensions.json
│   ├── no-relationships.json
│   └── dax-expressions.json
└── baseline.json        # Expected results
```

## CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Test BIM Conversion
  run: |
    npm run test-conversion -- \
      --input ./test-bim \
      --baseline ./test-bim/baseline.json \
      --output ./test-results.json

- name: Upload Results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: conversion-results
    path: test-results.json
```

## Troubleshooting

**No BIM files found**

- Ensure directory contains `.json` or `.bim` files
- Script recursively scans subdirectories

**Conversion failures**

- Check error messages in failed summaries
- Run with `--verbose` for detailed logs
- Validate BIM file structure

**Baseline comparison fails**

- Ensure baseline format matches current report structure
- Regenerate baseline if schema changed

## Workflow: Testing Code Changes

Recommended workflow when modifying conversion logic:

1. **Before changes**: Run validate-conversion on test BIM file
2. **Make changes**: Update conversion code
3. **After changes**: Re-run validate-conversion on same file
4. **Compare results**: Check if conversion rate improved or validation errors reduced
5. **Run batch test**: Use test-conversion on all test files before committing

Example:

```bash
# Before changes
npm run validate-conversion -- --input ./test-files/complex.bim > before.txt

# Make code changes...

# After changes
npm run validate-conversion -- --input ./test-files/complex.bim > after.txt

# Compare
diff before.txt after.txt

# If good, run full batch
npm run test-conversion -- --input ./test-files --baseline baseline.json
```

## deploy-test

Deploy/validate converted SML with AtScale and capture errors.

### Quick Start

```bash
# Validate SML without deploying (no AtScale required)
npm run deploy-test -- --validate-only

# Deploy to AtScale (requires running AtScale instance and setting ATSCALE_API_TOKEN and ATSCALE_API_URL)
npm run deploy-test -- --input ./path/to/file.bim

# Save errors to JSON file
npm run deploy-test -- --validate-only --output-errors ./errors.json

# Use custom BIM input file
npm run deploy-test -- --input ./path/to/file.bim --validate-only
```

### Options

```
npm run deploy-test -- [options]

Options:
  --input <file>          BIM file to convert (default: test-files/pbi_dw_test_model.bim)
  --output <dir>          SML output directory (default: temp directory)
  --output-errors <file>  Save error report to JSON file
  --sml-cli <path>        Path to SML CLI
  --validate-only         Skip deploy, just validate SML (no AtScale needed)
  --verbose, -v           Show detailed logs
```

### Environment Variables (for deploy mode)

```bash
ATSCALE_API_URL=http://localhost:10500/api    # AtScale API endpoint
ATSCALE_API_TOKEN=<token>                      # AtScale authentication token
```

### Output

The script reports:

- Conversion success/failure
- Validation/deployment errors and warnings
- Unconverted expressions (TODOs) with categorization
- Summary with pass/fail result

JSON error report includes:

```json
{
  "timestamp": "2025-01-22T...",
  "inputFile": "test-files/pbi_dw_test_model.bim",
  "success": true,
  "errors": [],
  "unconvertedExpressions": [...],
  "conversionStats": {
    "totalTodos": 29,
    "categories": { "time-intelligence": 10, "filter-context": 5, ... }
  }
}
```

### Use Cases

**Testing converter changes:**

```bash
# Before changes
npm run deploy-test -- --validate-only --output-errors before.json

# Make converter changes...

# After changes
npm run deploy-test -- --validate-only --output-errors after.json

# Compare TODO counts
```

**CI/CD validation:**

```bash
npm run deploy-test -- --validate-only
# Exits with code 0 if validation passes, 1 if fails
```

## Limitations

### validate-conversion

- Requires local SML CLI installation
- SML CLI must have dependencies installed (run `npm install` in SML repo)
- Exits with error code 1 if validation fails

### test-conversion

- Does not validate SML output (use validate-conversion for that)
- Does not write SML files to disk (analyzes in-memory)
- Does not track individual measure names (only counts)

## Future Enhancements

- Integrate SML validation into test-conversion (batch validation)
- Track specific measure/dimension names
- Generate HTML report
- Performance benchmarking
- Parallel file processing
- Auto-detect SML CLI path
