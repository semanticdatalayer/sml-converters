# DAX to MDX Conversion Enhancement Plan

## Overview

Multi-phase plan for robust DAX→MDX conversion system. Improves from ~45% to 75-85% conversion rate through tokenizer enhancements, template library, VAR inlining, and systematic categorization.

## User Preferences

- AI confidence threshold: 0.3 (moderate usage)
- Metadata: Test report only (clean MDX output)
- Compatibility: Allow improvements (better conversions replace existing)
- VAR inlining: Up to 100 tokens (aggressive)

## Current Architecture

**Existing 4-stage pipeline** (measure-converter.ts:443-517):
1. `convertDivideCalc` - DIVIDE patterns
2. `convertMathOnlyCalc` - Math-only expressions
3. `convertDaxMeasureWithAI` - LLM with difficulty < 0.7
4. `convertCalculatedMeasure` - Fallback TODO stub

**Key components:**
- `DaxTokenizer` (dax-converter.ts, 648 lines) - Basic tokenizer
- `ai-dax-converter.ts` (300 lines) - LLM integration
- `expression-parser.ts` (379 lines) - Pattern matching
- `test-bim-conversion.ts` - Test infrastructure with ConversionSummary

## New Architecture

**5-stage pipeline with confidence scoring:**
1. **Direct conversion** (conf: 1.0) - Simple 1:1 DAX→MDX mappings
2. **Template-based** (conf: 0.9-1.0) - Pattern templates (DIVIDE, time intelligence)
3. **VAR inline + retry** (conf: varies) - Inline vars, retry stages 1-2
4. **AI conversion** (conf: 0.0-0.7) - LLM for remaining
5. **Fallback** (conf: 0.0) - TODO stub

## Implementation Phases

---

### Phase 0: Refactoring (1-2 days)

**Goal:** Clean, organize, document existing code for readability

**Tasks:**
1. Extract conversion stages into separate well-named methods
2. Document current conversion logic with inline comments
3. Consolidate duplicate pattern-matching (expression-parser.ts + measure-converter.ts)
4. Create `conversion-result.ts` interface for stage outputs (expression, confidence, category, metadata)
5. Add JSDoc comments to all public methods

**Files:**
- `src/commands/bim-to-sml/bim-converter/measure-converter.ts` (refactor lines 443-800)
- `src/commands/bim-to-sml/bim-converter/expression-parser.ts` (refactor, consolidate)
- `src/commands/bim-to-sml/bim-converter/conversion-result.ts` (new)
- `src/commands/bim-to-sml/bim-converter/dax-converter.ts` (add docs)

**Deliverables:**
- Clean separation of concerns
- Standardized return types (ConversionResult)
- Improved readability

---

### Phase 1: Function Categorization & Direct Conversion (3-4 days)

**Goal:** Categorize all DAX functions, implement direct 1:1 conversion

**Tasks:**

1. **Research DAX→MDX mappings:**
   - Map DAX functions to AtScale MDX equivalents
   - Identify unconvertible functions (CALCULATE, FILTER, RELATED, etc.)
   - Document semantic differences/warnings

2. **Create function registry:**
   - `src/commands/bim-to-sml/bim-converter/conversion-templates/function-mappings.json`
   ```json
   {
     "direct_mappings": {
       "SUM": "Sum",
       "MIN": "Min",
       "MAX": "Max",
       "COUNT": "Count",
       "ROUND": { "mdx": "ROUND", "arg_order": [0, 2] },
       "ABS": "Abs",
       "AVG": "Avg",
       "CEILING": "Ceiling",
       "FLOOR": "Floor"
     },
     "unconvertible": [
       "CALCULATE", "FILTER", "ALL", "ALLEXCEPT",
       "RELATED", "RELATEDTABLE", "USERELATIONSHIP",
       "SUMX", "AVERAGEX", "RANKX",
       "SWITCH"
     ],
     "complex_patterns": [
       "DIVIDE", "DATESYTD", "DATESQTD", "DATESMTD",
       "TOTALYTD", "PARALLELPERIOD"
     ]
   }
   ```

3. **Implement DirectFunctionConverter:**
   - `src/commands/bim-to-sml/bim-converter/converters/direct-function-converter.ts`
   - Load mappings from JSON
   - Validate function exists in registry
   - Handle arg reordering
   - Return confidence: 1.0

4. **Extend DaxTokenizer:**
   - Add `isSupportedFunction()` method
   - Add `isUnconvertibleFunction()` method
   - Cache function registry

5. **Update test tracking:**
   - Extend `ConversionSummary` interface:
     ```typescript
     metric_calc_details: {
       total: number;
       by_category: {
         direct_conversion: number;
         template_conversion: number;
         var_inlined: number;
         ai_conversion: number;
         unconvertible: number;
       };
       conversion_rate: number;
     }
     ```
   - Update `analyzeMetricCalcs()` to detect conversion category

**Files:**
- `src/commands/bim-to-sml/bim-converter/conversion-templates/function-mappings.json` (new)
- `src/commands/bim-to-sml/bim-converter/converters/direct-function-converter.ts` (new)
- `src/commands/bim-to-sml/bim-converter/dax-converter.ts` (extend)
- `scripts/test-bim-conversion.ts` (update ConversionSummary, lines 47-67)

**Deliverables:**
- Comprehensive DAX function categorization
- Working direct conversion for simple functions
- Enhanced test metrics

---

### Phase 2: Enhanced Tokenizer & AST (4-5 days)

**Goal:** Improve tokenizer for VAR support and better analysis

**Tasks:**

1. **Design VarToken class:**
   ```typescript
   export class VarToken extends DaxToken {
     constructor(
       public varName: string,
       public expression: DaxToken[],
       public usageCount: number,
       position: number
     ) {
       super(TokenType.VAR, varName, position);
     }
     toMdx(info: any): string { /* VAR handling */ }
   }
   ```

2. **Create VarScopeTracker:**
   - Tracks variable definitions and usage
   - Counts references per variable
   - Builds scope hierarchy

3. **Add dependency analysis:**
   - `src/commands/bim-to-sml/bim-converter/var-analyzer.ts`
   - Build dependency graph between VARs
   - Detect circular dependencies
   - Topological sort for evaluation order

4. **Update DaxTokenizer:**
   - Add `parseVarDeclaration()` method
   - Add `parseReturnStatement()` method
   - Track variable context during tokenization
   - Add TokenType.VAR enum value

5. **Create DaxExpression wrapper:**
   - AST-like structure for better analysis
   - Contains tokens + metadata (vars, dependencies)

**Files:**
- `src/commands/bim-to-sml/bim-converter/dax-converter.ts` (add VarToken, update enum lines 12-23)
- `src/commands/bim-to-sml/bim-converter/var-analyzer.ts` (new)
- `src/commands/bim-to-sml/bim-converter/var-scope-tracker.ts` (new)

**Deliverables:**
- VarToken support in tokenizer
- Dependency graph builder
- Foundation for VAR inlining

---

### Phase 3: Template System & Pattern Conversion (3-4 days)

**Goal:** Build template library for common DAX patterns

**Tasks:**

1. **Create template base infrastructure:**
   - `src/commands/bim-to-sml/bim-converter/conversion-templates/template-base.ts`
   ```typescript
   export abstract class ConversionTemplate {
     abstract name: string;
     abstract confidence: number;
     abstract canConvert(tokens: DaxToken[]): boolean;
     abstract convert(tokens: DaxToken[], context: ConversionContext): ConversionResult;
     abstract examples: { dax: string; mdx: string }[];
   }
   ```

2. **Implement core templates:**

   **DIVIDE template:**
   - `src/commands/bim-to-sml/bim-converter/conversion-templates/templates/divide-template.ts`
   - Handle 2-arg: `DIVIDE(num, denom)` → `(num) / (denom)`
   - Handle 3-arg: `DIVIDE(num, denom, default)` → `IIF(denom = 0, default, (num) / (denom))`
   - Confidence: 1.0

   **Additional templates (conservative approach):**
   - Only create templates where 100% confident in semantic equality
   - If uncertain, leave for manual template addition later
   - Focus on DIVIDE template initially (already working)
   - Time intelligence and other complex patterns: manual addition later

3. **Create TemplateRegistry:**
   - `src/commands/bim-to-sml/bim-converter/conversion-templates/template-registry.ts`
   - Load all templates
   - Match tokens against patterns (ordered by confidence desc)
   - Return best match

4. **Match templates by confidence:**
   - Registry orders templates by confidence (highest first)
   - First successful match wins

**Files:**
- `src/commands/bim-to-sml/bim-converter/conversion-templates/template-base.ts` (new)
- `src/commands/bim-to-sml/bim-converter/conversion-templates/template-registry.ts` (new)
- `src/commands/bim-to-sml/bim-converter/conversion-templates/templates/divide-template.ts` (new)
- `src/commands/bim-to-sml/bim-converter/conversion-context.ts` (new - shared context for conversions)

**Deliverables:**
- Template system architecture
- DIVIDE template (high confidence)
- Template documentation with examples
- Framework for adding more templates manually

---

### Phase 4: VAR Inlining Implementation (4-5 days)

**Goal:** Implement safe VAR replacement (up to 100 tokens)

**Tasks:**

1. **Implement VarInliner:**
   - `src/commands/bim-to-sml/bim-converter/var-inliner.ts`
   - Analyze VAR safety
   - Inline safe VARs bottom-up (dependency order)
   - Leave unsafe VARs unchanged

2. **Safety checks:**
   ```typescript
   function isSafeToInline(varToken: VarToken, context: DaxExpression): boolean {
     // Single use only (or simple refs)
     if (varToken.usageCount > 3) return false;

     // No iterator functions (FILTER, CALCULATE, etc.)
     if (hasIteratorFunctions(varToken.expression)) return false;

     // No circular dependencies
     if (hasCircularDependency(varToken, context)) return false;

     // Expression not too complex (100 tokens max per user pref)
     if (getTokenCount(varToken.expression) > 100) return false;

     return true;
   }
   ```

3. **Inlining algorithm:**
   - Build dependency graph
   - Topological sort (leaves first)
   - For each VAR:
     - If safe: inline expression at usage point
     - If unsafe: leave with TODO comment
   - Return modified expression + metadata (inlined count)

4. **Integration:**
   - Add VAR inlining stage between template and AI
   - After inlining, retry direct + template conversion
   - Track which measures benefited

5. **Validation:**
   - Test with real BIM files containing VARs
   - Compare baseline metrics

**Files:**
- `src/commands/bim-to-sml/bim-converter/var-inliner.ts` (new)
- `src/commands/bim-to-sml/bim-converter/var-safety-checker.ts` (new)

**Deliverables:**
- Working VAR inlining for safe cases
- Clear TODO for unsafe cases
- Measurable conversion improvement

---

### Phase 5: 5-Stage Pipeline Integration (3-4 days)

**Goal:** Integrate all converters into unified pipeline

**Tasks:**

1. **Design ConversionPipeline:**
   - `src/commands/bim-to-sml/bim-converter/conversion-pipeline.ts`
   ```typescript
   export class ConversionPipeline {
     async convert(daxExpression: string, context: ConversionContext): Promise<ConversionResult> {
       // Stage 1: Direct conversion
       let result = this.directConverter.tryConvert(tokens);
       if (result.success && result.confidence >= 0.95) {
         return { ...result, category: 'direct_conversion' };
       }

       // Stage 2: Template conversion
       result = this.templateRegistry.tryConvert(tokens, context);
       if (result.success && result.confidence >= 0.85) {
         return { ...result, category: 'template_conversion' };
       }

       // Stage 3: VAR inline + retry
       const inlined = this.varInliner.inline(tokens);
       if (inlined.modified) {
         result = this.retryStages1And2(inlined.tokens, context);
         if (result.success) {
           return { ...result, category: 'var_inlined' };
         }
       }

       // Stage 4: AI conversion (if enabled, conf >= 0.3 per user pref)
       if (this.aiEnabled && !hasUnconvertibleFunctions(tokens)) {
         result = await this.aiConverter.tryConvert(tokens);
         if (result.success && result.confidence >= 0.3) {
           return { ...result, category: 'ai_conversion' };
         }
       }

       // Stage 5: Fallback TODO
       return this.createFallback(daxExpression);
     }
   }
   ```

2. **Update MeasureConverter.metricFromCalc():**
   - Replace lines 443-517 with ConversionPipeline.convert()
   - Pass context (BIM model, table, existing measures)
   - Collect conversion metadata

3. **Add confidence thresholds:**
   - Configurable via env: `DAX_CONVERSION_MIN_CONFIDENCE=0.3`
   - Default: 0.3 (user pref)

4. **Implement retry logic:**
   - After VAR inlining, retry direct + template
   - Track which stage succeeded
   - Log conversion path

5. **Error handling:**
   - Graceful degradation (stage failure → next stage)
   - Never crash pipeline

**Files:**
- `src/commands/bim-to-sml/bim-converter/conversion-pipeline.ts` (new)
- `src/commands/bim-to-sml/bim-converter/measure-converter.ts` (refactor metricFromCalc lines 443-517)
- `src/commands/bim-to-sml/bim-converter/conversion-context.ts` (update)

**Deliverables:**
- Unified conversion pipeline
- Configurable confidence thresholds
- Clean integration

---

### Phase 6: Enhanced Test Tracking & Metrics (2-3 days)

**Goal:** Comprehensive reporting on conversion effectiveness

**Tasks:**

1. **Update ConversionSummary interface:**
   - Extend `metric_calc_details` with category breakdown (already added in Phase 1)
   - Add function usage statistics
   - Track conversion method per measure (in-memory only per user pref)

2. **Extend test-bim-conversion.ts:**
   - Update `analyzeMetricCalcs()` (lines 112-148) to detect category
   - Detect unconvertible functions
   - Track function usage across files
   - Generate detailed summary

3. **Category detection logic:**
   ```typescript
   function detectCategory(metric: SMLMetricCalculated): string {
     const expr = metric.expression || "";

     // Check metadata comment (if present)
     const match = expr.match(/\/\* category: (\w+) \*\//);
     if (match) return match[1];

     // Heuristics
     if (expr.includes("TODO")) return "unconvertible";
     if (expr.includes("Original DAX")) return "ai_conversion";
     // More detection logic...

     return "unknown";
   }
   ```

4. **Enhanced reporting:**
   - Print category breakdown in console output
   - Update baseline comparison to show category changes

5. **Baseline comparison:**
   - Show before/after conversion rates
   - Highlight regression
   - Flag new unconvertible functions

**Files:**
- `scripts/test-bim-conversion.ts` (update analyzeMetricCalcs, add category detection)

**Deliverables:**
- Detailed conversion metrics by category
- Baseline comparison with category breakdown

---

### Phase 7: Documentation & Examples (2-3 days)

**Goal:** Comprehensive docs for users and developers

**Tasks:**

1. **User documentation:**
   - `docs/dax-to-mdx-conversion.md`
   - List supported DAX functions
   - Explain conversion categories
   - Show examples for each category
   - Document unconvertible patterns with workarounds

2. **Developer documentation:**
   - `docs/conversion-architecture.md`
   - Explain pipeline stages
   - Template creation guide
   - VAR inlining safety rules
   - Contributing new converters

3. **Template documentation:**
   - Document each template with DAX/MDX examples
   - Explain confidence scores
   - Note semantic differences

4. **Update CLAUDE.md:**
   - Add conversion architecture section
   - Link to new docs

5. **Create examples:**
   - `examples/dax-conversions/`
   - Real-world DAX expressions
   - Expected MDX output
   - Conversion category

**Files:**
- `docs/dax-to-mdx-conversion.md` (new)
- `docs/conversion-architecture.md` (new)
- `docs/template-development-guide.md` (new)
- `.claude/CLAUDE.md` (update)
- `examples/dax-conversions/*.md` (new)

**Deliverables:**
- Comprehensive user docs
- Developer contribution guide
- Real-world examples

---

### Phase 8: Template Validation (2-3 days)

**Goal:** Add comprehensive validation for all templates

**Tasks:**

1. **Unit tests for each template:**
   - Test DIVIDE template with 2-arg and 3-arg cases
   - Test edge cases (zero division, null handling)
   - Verify MDX output correctness

2. **Integration tests:**
   - Test templates with real BIM files
   - Compare baseline conversion results
   - Verify no regressions

3. **Template examples:**
   - Document DAX → MDX pairs for each template
   - Include edge cases
   - Show semantic equivalence

**Files:**
- `src/commands/bim-to-sml/bim-converter/conversion-templates/__tests__/` (new)
- Update template files with example documentation

**Deliverables:**
- Unit test coverage for all templates
- Integration test suite
- Documented examples

---

## Critical Integration Points

### 1. MeasureConverter.metricFromCalc() (lines 443-517)
**Current:** 4-stage pipeline with hardcoded logic
**New:** Call `ConversionPipeline.convert()`

### 2. Test Infrastructure (test-bim-conversion.ts)
**Current:** Tracks MDX vs TODO (lines 112-148)
**New:** Track 5 categories in `by_category` object

### 3. AI Converter (ai-dax-converter.ts)
**Current:** Standalone with difficulty < 0.7
**New:** Stage 4 of pipeline, difficulty score → confidence (invert: 1 - difficulty)

### 4. DaxTokenizer (dax-converter.ts)
**Current:** Basic tokens (Function, TableColumn, Literal, Operator)
**New:** Add VarToken, enhance function detection

### 5. Expression Parser (expression-parser.ts)
**Current:** Pattern matching for simple cases
**New:** Basis for template system (divide, aggregations)

---

## File Organization

### New Directories
```
src/commands/bim-to-sml/bim-converter/
├── conversion-templates/
│   ├── template-base.ts
│   ├── template-registry.ts
│   ├── function-mappings.json
│   └── templates/
│       ├── divide-template.ts
│       ├── time-intelligence-template.ts
│       └── aggregation-template.ts
├── converters/
│   ├── direct-function-converter.ts
│   ├── conversion-pipeline.ts
│   └── conversion-context.ts
└── var-analysis/
    ├── var-analyzer.ts
    ├── var-inliner.ts
    ├── var-safety-checker.ts
    └── var-scope-tracker.ts

docs/
├── dax-to-mdx-conversion.md
├── conversion-architecture.md
└── template-development-guide.md

examples/dax-conversions/
```

### Modified Files
- `src/commands/bim-to-sml/bim-converter/measure-converter.ts` (Phases 0, 5)
- `src/commands/bim-to-sml/bim-converter/dax-converter.ts` (Phases 1, 2)
- `src/commands/bim-to-sml/bim-converter/expression-parser.ts` (Phase 0)
- `scripts/test-bim-conversion.ts` (Phases 1, 6)
- `.claude/CLAUDE.md` (Phase 7)

---

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 0: Refactoring | 1-2 days | None |
| Phase 1: Direct Conversion | 3-4 days | Phase 0 |
| Phase 2: Enhanced Tokenizer | 4-5 days | Phase 0 |
| Phase 3: Template System | 3-4 days | Phase 0, 1 |
| Phase 4: VAR Inlining | 4-5 days | Phase 2 |
| Phase 5: Pipeline Integration | 3-4 days | Phases 1-4 |
| Phase 6: Enhanced Testing | 2-3 days | Phase 5 |
| Phase 7: Documentation | 2-3 days | Phases 1-6 |
| Phase 8: Template Validation | 2-3 days | Phase 3 |

**Total: 24-34 days (5-7 weeks)**

**Parallelization:**
- Phases 1 & 2 can run in parallel after Phase 0
- Phase 7 can start while others continue

---

## Success Metrics

### Conversion Rate
- **Current:** ~45% MDX conversion
- **Target:** 75-85% conversion
- **Breakdown goal:**
  - Direct: 30-40%
  - Template: 20-30%
  - VAR inline: 10-15%
  - AI: 10-15%
  - Unconverted: 15-25%

### Code Quality
- All new code has unit tests
- Template coverage: 80%+ of common patterns
- Zero regression on existing conversions

### Documentation
- User guide covers 90%+ scenarios
- Developer guide enables contributions
- All templates have examples

---

## Resolved Questions

1. **Template priority?** Confidence-based (highest confidence first)
2. **Function mapping source?** Use DAX docs + MDX docs + AtScale MDX function list. Resulting MDX must only use AtScale MDX functions
3. **Time intelligence semantics?** Only create templates where confident in equality. If in doubt, don't add - will be added manually later
4. **Template validation?** Move to separate phase (Phase 8) after initial implementation
5. **Backward compat?** Improvements allowed (yes)
6. **Metadata in output?** Test report only (yes)
7. **AI threshold?** 0.3 (yes)
8. **VAR complexity?** 100 tokens (yes)
