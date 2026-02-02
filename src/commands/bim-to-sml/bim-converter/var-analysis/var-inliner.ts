import {
  DaxToken,
  VarToken,
  ReturnToken,
  IdentifierToken,
  FunctionToken,
  ParenToken,
} from "../dax-converter";
import { DaxExpression } from "../dax-expression";
import { VarScopeTracker, VarInfo, VarAnalyzer } from "./var-analysis";
import { Logger } from "../../../../shared/logger";

// =============================================================================
// SAFETY CHECKER - validates whether a VAR is safe to inline
// =============================================================================

/**
 * Safety check result
 */
export interface SafetyCheckResult {
  /** Whether VAR is safe to inline */
  isSafe: boolean;

  /** Reason for unsafe classification (if not safe) */
  reason?: string;

  /** Specific issues found */
  issues: string[];
}

/**
 * Configuration for safety checks
 */
export interface SafetyConfig {
  /** Maximum usage count for inlining (default: 3) */
  maxUsageCount: number;

  /** Maximum token count for expression (default: 100) */
  maxTokenCount: number;

  /** Whether to allow multi-use variables (default: true) */
  allowMultiUse: boolean;
}

/**
 * Default safety configuration (per user preferences)
 */
export const DEFAULT_SAFETY_CONFIG: SafetyConfig = {
  maxUsageCount: 3,
  maxTokenCount: 100,
  allowMultiUse: true,
};

/**
 * List of DAX iterator functions that make VARs unsafe to inline
 */
const ITERATOR_FUNCTIONS = [
  "FILTER",
  "CALCULATE",
  "CALCULATETABLE",
  "ALL",
  "ALLEXCEPT",
  "ALLNOBLANKROW",
  "ALLSELECTED",
  "SUMX",
  "AVERAGEX",
  "COUNTX",
  "COUNTAX",
  "MAXX",
  "MINX",
  "PRODUCTX",
  "CONCATENATEX",
  "RANKX",
  "TOPN",
  "SAMPLE",
  "ADDCOLUMNS",
  "SUMMARIZE",
  "GROUPBY",
  "SELECTCOLUMNS",
  "CROSSJOIN",
  "GENERATE",
  "GENERATEALL",
  "NATURALINNERJOIN",
  "NATURALLEFTOUTERJOIN",
];

/**
 * VarSafetyChecker validates whether a VAR is safe to inline.
 *
 * Safety criteria:
 * 1. Usage count ≤ maxUsageCount (default: 3)
 * 2. No iterator functions in expression
 * 3. No circular dependencies
 * 4. Token count ≤ maxTokenCount (default: 100)
 * 5. Variable is actually used (not orphaned)
 *
 * Usage:
 * ```typescript
 * const checker = new VarSafetyChecker(logger, config);
 * const result = checker.checkVar(varInfo, analyzer);
 * if (result.isSafe) {
 *   // Safe to inline
 * }
 * ```
 */
export class VarSafetyChecker {
  private config: SafetyConfig;

  constructor(
    private logger: Logger,
    config?: Partial<SafetyConfig>,
  ) {
    this.config = { ...DEFAULT_SAFETY_CONFIG, ...config };
  }

  /**
   * Check if a variable is safe to inline
   * @param varInfo - Variable information
   * @param analyzer - Dependency analyzer
   * @returns SafetyCheckResult
   */
  public checkVar(varInfo: VarInfo, analyzer: VarAnalyzer): SafetyCheckResult {
    const issues: string[] = [];

    // Check 1: Usage count
    if (varInfo.usageCount > this.config.maxUsageCount) {
      issues.push(
        `Usage count ${varInfo.usageCount} exceeds limit ${this.config.maxUsageCount}`,
      );
    }

    // Check 2: Must be used at least once
    if (varInfo.usageCount === 0) {
      issues.push("Variable is never used (orphaned)");
    }

    // Check 3: Token count
    const tokenCount = this.getTokenCount(varInfo.token);
    if (tokenCount > this.config.maxTokenCount) {
      issues.push(
        `Expression has ${tokenCount} tokens, exceeds limit ${this.config.maxTokenCount}`,
      );
    }

    // Check 4: Iterator functions
    const iteratorFunctions = this.findIteratorFunctions(varInfo.token);
    if (iteratorFunctions.length > 0) {
      issues.push(
        `Contains iterator functions: ${iteratorFunctions.join(", ")}`,
      );
    }

    // Check 5: Circular dependencies
    const dependency = analyzer.getDependency(varInfo.name);
    if (dependency) {
      // Check if any dependencies are in a cycle
      const circularCheck = this.checkCircularDependency(
        varInfo.name,
        analyzer,
      );
      if (circularCheck) {
        issues.push(`Circular dependency detected: ${circularCheck}`);
      }
    }

    const isSafe = issues.length === 0;
    const reason = isSafe ? undefined : issues[0];

    return {
      isSafe,
      reason,
      issues,
    };
  }

  /**
   * Check multiple variables for safety
   * @param vars - Array of variable info
   * @param analyzer - Dependency analyzer
   * @returns Map of variable name to safety result
   */
  public checkVars(
    vars: VarInfo[],
    analyzer: VarAnalyzer,
  ): Map<string, SafetyCheckResult> {
    const results = new Map<string, SafetyCheckResult>();

    for (const varInfo of vars) {
      const result = this.checkVar(varInfo, analyzer);
      results.set(varInfo.name, result);

      if (result.isSafe) {
        this.logger.debug(
          `VAR ${varInfo.originalName} is SAFE to inline (usage: ${varInfo.usageCount}, tokens: ${this.getTokenCount(varInfo.token)})`,
        );
      } else {
        this.logger.debug(
          `VAR ${varInfo.originalName} is UNSAFE to inline: ${result.reason}`,
        );
      }
    }

    return results;
  }

  /**
   * Get statistics about safety checks
   * @param results - Safety check results
   * @returns Stats object
   */
  public getStats(results: Map<string, SafetyCheckResult>): {
    total: number;
    safe: number;
    unsafe: number;
    reasons: { [reason: string]: number };
  } {
    const stats = {
      total: results.size,
      safe: 0,
      unsafe: 0,
      reasons: {} as { [reason: string]: number },
    };

    for (const result of results.values()) {
      if (result.isSafe) {
        stats.safe++;
      } else {
        stats.unsafe++;
        if (result.reason) {
          stats.reasons[result.reason] =
            (stats.reasons[result.reason] || 0) + 1;
        }
      }
    }

    return stats;
  }

  /**
   * Count tokens in a VAR expression (recursively)
   */
  private getTokenCount(varToken: VarToken): number {
    return this.countTokensRecursive(varToken.getExpressionTokens());
  }

  /**
   * Recursively count all tokens
   */
  private countTokensRecursive(tokens: DaxToken[]): number {
    let count = 0;

    for (const token of tokens) {
      count++; // Count this token

      // If token has nested tokens (FunctionToken has args)
      if (token instanceof FunctionToken) {
        count += this.countTokensRecursive(token.args);
      }
    }

    return count;
  }

  /**
   * Find iterator functions in VAR expression
   */
  private findIteratorFunctions(varToken: VarToken): string[] {
    const found: string[] = [];
    const tokens = varToken.getExpressionTokens();

    this.findIteratorFunctionsRecursive(tokens, found);

    return found;
  }

  /**
   * Recursively search for iterator functions
   */
  private findIteratorFunctionsRecursive(
    tokens: DaxToken[],
    found: string[],
  ): void {
    for (const token of tokens) {
      if (token instanceof FunctionToken) {
        const funcName = token.functionAgg.toUpperCase();

        if (ITERATOR_FUNCTIONS.includes(funcName)) {
          if (!found.includes(funcName)) {
            found.push(funcName);
          }
        }

        // Recurse into function arguments
        this.findIteratorFunctionsRecursive(token.args, found);
      }
    }
  }

  /**
   * Check for circular dependency using DFS
   * @param varName - Variable name to check
   * @param analyzer - Dependency analyzer
   * @returns Cycle description if found, undefined otherwise
   */
  private checkCircularDependency(
    varName: string,
    analyzer: VarAnalyzer,
  ): string | undefined {
    const circularResult = analyzer.hasCircularDependency();

    if (circularResult.hasCircular && circularResult.cycle) {
      // Check if this variable is in the cycle
      if (circularResult.cycle.includes(varName.toUpperCase())) {
        return circularResult.cycle.join(" → ");
      }
    }

    return undefined;
  }
}

// =============================================================================
// INLINER - performs safe variable inlining on DAX expressions
// =============================================================================

/**
 * Result of VAR inlining operation
 */
export interface InliningResult {
  /** Whether any VARs were inlined */
  modified: boolean;

  /** New token array with VARs inlined */
  tokens: DaxToken[];

  /** Number of VARs successfully inlined */
  inlinedCount: number;

  /** Number of VARs left un-inlined (unsafe) */
  remainingCount: number;

  /** Map of variable name to safety result */
  safetyResults: Map<string, SafetyCheckResult>;

  /** Variables that were inlined */
  inlinedVars: string[];

  /** Variables that were not inlined (unsafe) */
  unsafeVars: string[];
}

/**
 * VarInliner performs safe variable inlining on DAX expressions.
 *
 * Algorithm:
 * 1. Analyze expression (build dependency graph)
 * 2. Check safety for each VAR
 * 3. Get topological ordering (leaves first)
 * 4. Inline safe VARs bottom-up
 * 5. Return modified expression
 *
 * Unsafe VARs are left in place with original VarToken.
 *
 * Usage:
 * ```typescript
 * const inliner = new VarInliner(logger, config);
 * const result = inliner.inline(expression);
 * if (result.modified) {
 *   // Use result.tokens
 * }
 * ```
 */
export class VarInliner {
  private safetyChecker: VarSafetyChecker;

  constructor(
    private logger: Logger,
    config?: Partial<SafetyConfig>,
  ) {
    this.safetyChecker = new VarSafetyChecker(logger, config);
  }

  /**
   * Inline VARs in a DAX expression
   * @param expression - Parsed DAX expression
   * @returns InliningResult
   */
  public inline(expression: DaxExpression): InliningResult {
    const vars = expression.getVariables();

    // If no variables, nothing to inline
    if (vars.length === 0) {
      return {
        modified: false,
        tokens: expression.getTokens(),
        inlinedCount: 0,
        remainingCount: 0,
        safetyResults: new Map(),
        inlinedVars: [],
        unsafeVars: [],
      };
    }

    // Get dependency analyzer
    const dependencies = expression.getDependencies();
    const analyzer = new VarAnalyzer(
      this.buildScopeTrackerFromExpression(expression),
    );
    analyzer.analyze();

    // Check safety for all VARs
    const safetyResults = this.safetyChecker.checkVars(vars, analyzer);

    // Get topological ordering (leaves first = variables with no dependencies)
    const inliningOrder = expression.getInliningOrder();

    // Separate safe and unsafe variables
    const safeVars: VarInfo[] = [];
    const unsafeVars: string[] = [];

    for (const varInfo of vars) {
      const safety = safetyResults.get(varInfo.name);
      if (safety?.isSafe) {
        safeVars.push(varInfo);
      } else {
        unsafeVars.push(varInfo.originalName);
      }
    }

    // Build substitution map for safe variables (ordered by dependency)
    const substitutions = new Map<string, DaxToken[]>();

    for (const varName of inliningOrder) {
      const varInfo = vars.find((v) => v.originalName === varName);
      if (!varInfo) continue;

      const safety = safetyResults.get(varInfo.name);
      if (safety?.isSafe) {
        // Get expression tokens, applying any previous substitutions
        let exprTokens = varInfo.token.getExpressionTokens();
        exprTokens = this.applySubstitutions(exprTokens, substitutions);

        substitutions.set(varInfo.name, exprTokens);

        this.logger.debug(
          `VAR ${varInfo.originalName} ready for inlining (${exprTokens.length} tokens)`,
        );
      }
    }

    // Apply substitutions to the entire expression
    const originalTokens = expression.getTokens();
    const modifiedTokens = this.inlineTokens(
      originalTokens,
      substitutions,
      safetyResults,
    );

    const inlinedVars = Array.from(substitutions.keys()).map((key) => {
      const varInfo = vars.find((v) => v.name === key);
      return varInfo?.originalName || key;
    });

    return {
      modified: substitutions.size > 0,
      tokens: modifiedTokens,
      inlinedCount: substitutions.size,
      remainingCount: unsafeVars.length,
      safetyResults,
      inlinedVars,
      unsafeVars,
    };
  }

  /**
   * Inline VARs in token array
   * Removes inlined VarTokens, replaces IdentifierTokens with VAR expressions
   */
  private inlineTokens(
    tokens: DaxToken[],
    substitutions: Map<string, DaxToken[]>,
    safetyResults: Map<string, SafetyCheckResult>,
  ): DaxToken[] {
    const result: DaxToken[] = [];

    for (const token of tokens) {
      if (token instanceof VarToken) {
        // Check if this VAR was inlined
        const safety = safetyResults.get(token.varName.toUpperCase());
        if (safety?.isSafe) {
          // VAR was inlined - remove it
          this.logger.debug(`Removing inlined VAR: ${token.varName}`);
          continue; // Skip this token
        } else {
          // VAR is unsafe - keep it
          result.push(token);
        }
      } else if (token instanceof IdentifierToken) {
        // Check if this identifier is a variable reference
        const varNameUpper = token.value.toUpperCase();
        if (substitutions.has(varNameUpper)) {
          // Replace with variable expression
          const substitutionTokens = substitutions.get(varNameUpper)!;
          this.logger.debug(
            `Replacing reference to ${token.value} with ${substitutionTokens.length} tokens`,
          );

          // Wrap in parentheses to preserve evaluation order
          result.push(...this.wrapInParens(substitutionTokens));
        } else {
          // Not a variable reference - keep as is
          result.push(token);
        }
      } else if (token instanceof ReturnToken) {
        // Recurse into RETURN expression
        const inlinedExpr = this.inlineTokens(
          token.getExpressionTokens(),
          substitutions,
          safetyResults,
        );
        result.push(new ReturnToken(inlinedExpr, token.position));
      } else if (token instanceof FunctionToken) {
        // Recurse into function arguments
        const inlinedArgs = this.inlineTokens(
          token.args,
          substitutions,
          safetyResults,
        );
        result.push(
          new FunctionToken(token.functionAgg, inlinedArgs, token.position),
        );
      } else if (token instanceof ParenToken) {
        // Recurse into parenthesized expression
        const inlinedArgs = this.inlineTokens(
          token.args,
          substitutions,
          safetyResults,
        );
        const parenToken = new ParenToken(inlinedArgs, token.position);
        result.push(parenToken);
      } else {
        // Other tokens - keep as is
        result.push(token);
      }
    }

    return result;
  }

  /**
   * Apply substitutions to a token array (used when building substitution map)
   */
  private applySubstitutions(
    tokens: DaxToken[],
    substitutions: Map<string, DaxToken[]>,
  ): DaxToken[] {
    const result: DaxToken[] = [];

    for (const token of tokens) {
      if (token instanceof IdentifierToken) {
        const varNameUpper = token.value.toUpperCase();
        if (substitutions.has(varNameUpper)) {
          // Replace with previously inlined variable
          const substitutionTokens = substitutions.get(varNameUpper)!;
          result.push(...this.wrapInParens(substitutionTokens));
        } else {
          result.push(token);
        }
      } else if (token instanceof FunctionToken) {
        const inlinedArgs = this.applySubstitutions(token.args, substitutions);
        result.push(
          new FunctionToken(token.functionAgg, inlinedArgs, token.position),
        );
      } else if (token instanceof ParenToken) {
        const inlinedArgs = this.applySubstitutions(token.args, substitutions);
        result.push(new ParenToken(inlinedArgs, token.position));
      } else {
        result.push(token);
      }
    }

    return result;
  }

  /**
   * Wrap tokens in parentheses to preserve evaluation order
   */
  private wrapInParens(tokens: DaxToken[]): DaxToken[] {
    // If already a single ParenToken, no need to wrap
    if (tokens.length === 1 && tokens[0] instanceof ParenToken) {
      return tokens;
    }

    // Wrap in new ParenToken
    return [new ParenToken(tokens, tokens[0]?.position || 0)];
  }

  /**
   * Build scope tracker from expression (helper for analyzer)
   */
  private buildScopeTrackerFromExpression(
    expression: DaxExpression,
  ): VarScopeTracker {
    const tracker = new VarScopeTracker();

    for (const varInfo of expression.getVariables()) {
      tracker.registerVar(varInfo.token);
    }

    return tracker;
  }

  /**
   * Get inlining statistics from result
   */
  public getStats(result: InliningResult): {
    total: number;
    inlined: number;
    remaining: number;
    inliningRate: number;
    safetyStats: ReturnType<VarSafetyChecker["getStats"]>;
  } {
    const total = result.inlinedCount + result.remainingCount;
    const inliningRate = total > 0 ? (result.inlinedCount / total) * 100 : 0;

    return {
      total,
      inlined: result.inlinedCount,
      remaining: result.remainingCount,
      inliningRate: Math.round(inliningRate),
      safetyStats: this.safetyChecker.getStats(result.safetyResults),
    };
  }
}
