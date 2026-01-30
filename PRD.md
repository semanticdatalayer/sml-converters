# PRD: BIM-to-SML Conversion Bug Fixes

## Introduction

Fix all errors encountered when converting BIM files to SML, validating, and deploying to AtScale. Process the 3 BIM files in `/Users/dianne/Downloads/bim/quickfiles/` sequentially, fixing converter bugs as encountered. Document patterns that cannot be fixed within existing converter architecture.

## Goals

- All 3 BIM files convert to valid SML without errors
- All converted SML deploys successfully to AtScale
- Maximize DAX→MDX conversion rate (minimize TODOs)
- Fix only bugs in existing converter code (no new templates)
- Document unfixable limitations

## BIM Files to Process

1. `finance_bim.json` (156KB)
2. `DataMgt_bim.json` (720KB)
3. `PFM_from_Daniel_bim.json` (1.1MB)

## User Stories

### US-001: Deploy finance_bim.json and fix errors

**Description:** As a developer, I want finance_bim.json to convert and deploy successfully so I can identify and fix converter bugs.

**Acceptance Criteria:**

- [x] Run: `cd /Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter && pnpm pbi-deploy /Users/dianne/Downloads/bim/quickfiles/finance_bim.json`
- [x] If deployment fails, identify root cause in converter code
- [x] Fix the bug in sml-converters codebase
- [x] Rebuild: `npm run build`
- [x] Re-run deployment until successful
- [x] Document any unfixable patterns encountered
- [x] Typecheck passes

### US-002: Deploy DataMgt_bim.json and fix errors

**Description:** As a developer, I want DataMgt_bim.json to convert and deploy successfully so I can identify and fix additional converter bugs.

**Acceptance Criteria:**

- [ ] Run: `cd /Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter && pnpm pbi-deploy /Users/dianne/Downloads/bim/quickfiles/DataMgt_bim.json`
- [ ] If deployment fails, identify root cause in converter code
- [ ] Fix the bug in sml-converters codebase
- [ ] Rebuild: `npm run build`
- [ ] Re-run deployment until successful
- [ ] Document any unfixable patterns encountered
- [ ] Typecheck passes

### US-003: Deploy PFM_from_Daniel_bim.json and fix errors

**Description:** As a developer, I want PFM_from_Daniel_bim.json to convert and deploy successfully so I can identify and fix remaining converter bugs.

**Acceptance Criteria:**

- [ ] Run: `cd /Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter && pnpm pbi-deploy /Users/dianne/Downloads/bim/quickfiles/PFM_from_Daniel_bim.json`
- [ ] If deployment fails, identify root cause in converter code
- [ ] Fix the bug in sml-converters codebase
- [ ] Rebuild: `npm run build`
- [ ] Re-run deployment until successful
- [ ] Document any unfixable patterns encountered
- [ ] Typecheck passes

### US-004: Verify all fixes and run regression tests

**Description:** As a developer, I want to ensure all fixes work together and don't break existing functionality.

**Acceptance Criteria:**

- [ ] Run `npm run test-custom-calcs` - passes
- [ ] Re-deploy all 3 BIM files successfully
- [ ] Commit all fixes with descriptive messages
- [ ] Typecheck passes

## Non-Goals

- Adding new conversion templates for unsupported DAX patterns
- Modifying BIM source files to work around limitations
- Fixing DAX patterns that require architectural changes
- Performance optimization of conversion process

## Technical Considerations

- Deploy command: `pnpm pbi-deploy <bim-file-path>`
- Run from: `/Users/dianne/go/src/github.com/AtScaleInc/SML/tests/snowflake-converter`
- Converter code: `/Users/dianne/go/src/github.com/semanticdatalayer/sml-converters`
- Common error types:
  - Hierarchy not found (naming mismatches)
  - Invalid MDX expressions
  - Missing dimension/measure references
  - Timing issues (dimensions not populated during conversion)
