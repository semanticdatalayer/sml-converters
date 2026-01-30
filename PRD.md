# PRD: BIM Converter Bug Fixes via Real-World File Deployment

## Introduction

Expand BIM-to-SML converter coverage by iteratively converting and deploying real customer BIM files. Each deployment failure reveals converter bugs to fix. This creates a feedback loop that improves converter quality through real-world validation.

## Goals

- Deploy all 6 BIM files from `/Users/dianne/Downloads/bim/fails/` successfully
- Fix converter bugs discovered during deployment attempts
- Document learnings in `progress.txt` after each iteration
- Skip files requiring significant new functionality (document as future work)

## Workflow

```
For each BIM file:
  1. Convert: node bin/run.js bim-to-sml --source <file> --output /tmp/sml-out --clean
  2. Deploy: cd /Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter && pnpm pbi-deploy <file>
  3. If deploy fails:
     - Analyze error
     - If fixable in converter code → create next US to fix and retry
     - If requires significant work → document and skip file
  4. If deploy succeeds (exit 0) → move to next file
```

## Files to Process (in order)

1. `Trek_bim.json` (16KB - smallest, likely simplest)
2. `PTM_bim.json` (321KB)
3. `test_bim.json` (364KB)
4. `Ulta_bim.json` (499KB)
5. `POC_bim.json` (498KB)
6. `PFM_from_Daniel_bim.json` (1.1MB - largest, likely most complex)

## User Stories

### US-001: Trek_bim.json - Initial Conversion Attempt

**Description:** As a developer, I want to convert and deploy Trek_bim.json to discover any converter bugs.

**Acceptance Criteria:**
- [x] Run conversion: `node bin/run.js bim-to-sml --source /Users/dianne/Downloads/bim/fails/Trek_bim.json --output /tmp/sml-out --clean`
- [x] Run deploy from `/Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter`: `pnpm pbi-deploy /Users/dianne/Downloads/bim/fails/Trek_bim.json`
- [ ] If deploy succeeds (exit 0): document in progress.txt and mark complete
- [ ] If deploy fails: document error details in progress.txt, create US-001-A for the fix
- [x] If error requires significant work: document as "future work" in progress.txt, mark complete, proceed to US-002

**Result:** Future work - BIM file has no relationships, converter requires relationships to classify tables. All 4 tables skipped, resulting in empty model that fails deploy.

---

### US-002: PTM_bim.json - Initial Conversion Attempt

**Description:** As a developer, I want to convert and deploy PTM_bim.json to discover any converter bugs.

**Acceptance Criteria:**
- [x] Run conversion: `node bin/run.js bim-to-sml --source /Users/dianne/Downloads/bim/fails/PTM_bim.json --output /tmp/sml-out --clean`
- [x] Run deploy from `/Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter`: `pnpm pbi-deploy /Users/dianne/Downloads/bim/fails/PTM_bim.json`
- [x] If deploy succeeds (exit 0): document in progress.txt and mark complete
- [ ] If deploy fails: document error details in progress.txt, create US-002-A for the fix
- [ ] If error requires significant work: document as "future work" in progress.txt, mark complete, proceed to US-003

**Result:** Deployed successfully after fixing two bugs:
1. BLANK() nested in expressions not converting to NULL
2. DAX & (string concat) operator not converting to MDX + operator

---

### US-003: test_bim.json - Initial Conversion Attempt

**Description:** As a developer, I want to convert and deploy test_bim.json to discover any converter bugs.

**Acceptance Criteria:**
- [x] Run conversion: `node bin/run.js bim-to-sml --source /Users/dianne/Downloads/bim/fails/test_bim.json --output /tmp/sml-out --clean`
- [x] Run deploy from `/Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter`: `pnpm pbi-deploy /Users/dianne/Downloads/bim/fails/test_bim.json`
- [ ] If deploy succeeds (exit 0): document in progress.txt and mark complete
- [ ] If deploy fails: document error details in progress.txt, create US-003-A for the fix
- [x] If error requires significant work: document as "future work" in progress.txt, mark complete, proceed to US-004

**Result:** Future work - Multiple bugs fixed (single-quoted column names, perspective dimension lookup, unquoted table names, boolean TODO stubs) but final deploy fails with "Measure TopTaskID in calculation is not a measure" - requires architectural changes to handle dimension key columns used as fact measures in calculations.

---

### US-004: Ulta_bim.json - Initial Conversion Attempt

**Description:** As a developer, I want to convert and deploy Ulta_bim.json to discover any converter bugs.

**Acceptance Criteria:**
- [ ] Run conversion: `node bin/run.js bim-to-sml --source /Users/dianne/Downloads/bim/fails/Ulta_bim.json --output /tmp/sml-out --clean`
- [ ] Run deploy from `/Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter`: `pnpm pbi-deploy /Users/dianne/Downloads/bim/fails/Ulta_bim.json`
- [ ] If deploy succeeds (exit 0): document in progress.txt and mark complete
- [ ] If deploy fails: document error details in progress.txt, create US-004-A for the fix
- [ ] If error requires significant work: document as "future work" in progress.txt, mark complete, proceed to US-005

---

### US-005: POC_bim.json - Initial Conversion Attempt

**Description:** As a developer, I want to convert and deploy POC_bim.json to discover any converter bugs.

**Acceptance Criteria:**
- [ ] Run conversion: `node bin/run.js bim-to-sml --source /Users/dianne/Downloads/bim/fails/POC_bim.json --output /tmp/sml-out --clean`
- [ ] Run deploy from `/Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter`: `pnpm pbi-deploy /Users/dianne/Downloads/bim/fails/POC_bim.json`
- [ ] If deploy succeeds (exit 0): document in progress.txt and mark complete
- [ ] If deploy fails: document error details in progress.txt, create US-005-A for the fix
- [ ] If error requires significant work: document as "future work" in progress.txt, mark complete, proceed to US-006

---

### US-006: PFM_from_Daniel_bim.json - Initial Conversion Attempt

**Description:** As a developer, I want to convert and deploy PFM_from_Daniel_bim.json to discover any converter bugs.

**Acceptance Criteria:**
- [ ] Run conversion: `node bin/run.js bim-to-sml --source /Users/dianne/Downloads/bim/fails/PFM_from_Daniel_bim.json --output /tmp/sml-out --clean`
- [ ] Run deploy from `/Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter`: `pnpm pbi-deploy /Users/dianne/Downloads/bim/fails/PFM_from_Daniel_bim.json`
- [ ] If deploy succeeds (exit 0): document in progress.txt and mark complete
- [ ] If deploy fails: document error details in progress.txt, create US-006-A for the fix
- [ ] If error requires significant work: document as "future work" in progress.txt, mark complete

---

## Dynamic Story Creation Template

When a deployment fails and the fix is in scope, create a new story using this template:

```markdown
### US-XXX-Y: [File] - Fix [Error Description]

**Description:** As a developer, I want to fix [specific error] so that [file] can deploy successfully.

**Error from previous attempt:**
[Paste error message]

**Acceptance Criteria:**
- [ ] Analyze error and identify root cause in converter code
- [ ] Implement fix in appropriate file (dax-converter.ts, templates, pipeline, etc.)
- [ ] Run `npm run test-custom-calcs` to verify no regressions
- [ ] Re-run conversion and deployment
- [ ] If deploy succeeds: document fix in progress.txt, mark complete
- [ ] If deploy fails with NEW error: document in progress.txt, create US-XXX-Z
- [ ] If error requires significant work: document as "future work", mark complete
- [ ] Typecheck passes
```

## Non-Goals

- Adding entirely new DAX function support (document as future work)
- Fixing issues outside converter code (schema changes, new converters)
- Validating that queries return correct results (only exit code 0 matters)
- Processing files outside the fails directory

## Technical Considerations

- Converter code is in `src/commands/bim-to-sml/bim-converter/`
- Key files: `dax-converter.ts`, `conversion-pipeline.ts`, `conversion-templates/`
- Run `npm run test-custom-calcs` after any converter changes
- Deploy command must run from `/Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter`

## Success Criteria

- All 6 files either deploy successfully OR are documented as "future work"
- Each fix is committed with descriptive message
- `progress.txt` contains learnings from all iterations
