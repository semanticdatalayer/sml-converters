# PRD: Reduce and Clean Up Logging

## Introduction

Clean up verbose and temporary logging in the BIM converter. Remove debug markers, consolidate repetitive log messages, and truncate long lists to reduce noise.

## Goals

- Remove temporary "XXX " debug console.log statements from code
- Limit perspective warning lists to 5 items max
- Consolidate template registration into single log message

## User Stories

### US-001: Remove XXX debug statements

**Description:** As a developer, I want temporary debug markers removed so the codebase is clean.

**Acceptance Criteria:**

- [x] Remove `console.log` on line 282 in measure-converter.ts (`XXX Calc...from agg only`)
- [x] Remove `console.log` on line 364 in measure-converter.ts (`XXX Calc...count rows`)
- [x] Remove `console.log` on line 499 in measure-converter.ts (`XXX Meas...`)
- [x] Remove `console.log` on line 171 in dataset-converter.ts (`XXX...fell out...`)
- [x] Typecheck passes
- [x] `npm run test-custom-calcs` passes

### US-002: Truncate perspective warning lists to 5 items

**Description:** As a user, I want long lists in perspective warnings truncated so logs are readable.

**Acceptance Criteria:**

- [ ] In `warnMissingInPerspective()` in perspective-converter.ts, if list has >5 items, show first 5 plus "... and N more"
- [ ] Applies to measures, columns, and hierarchies warnings in that method
- [ ] Example: `will not include: measure1, measure2, measure3, measure4, measure5... and 3 more`
- [ ] Typecheck passes

### US-003: Consolidate template registration logs

**Description:** As a developer, I want template registration logged as one message instead of many.

**Acceptance Criteria:**

- [ ] Remove per-template debug log from `registerTemplate()` method
- [ ] After all templates registered in constructor, log single message: `Registered templates: DivideTemplate (1), IsBlankTemplate (0.95), ...`
- [ ] List sorted by confidence (highest first)
- [ ] Typecheck passes

## Non-Goals

- No changes to log levels or logger infrastructure
- No changes to other log messages beyond those specified
- No log file output changes

## Technical Considerations

- XXX lines are `console.log`, not logger calls - just delete them
- Perspective truncation helper could be inline or small utility function
- Template consolidation requires moving log call to after `registerBuiltInTemplates()` completes
