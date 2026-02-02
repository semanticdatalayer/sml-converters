import { VarToken, DaxToken, FunctionToken } from "../dax-converter";
import { VarInfo, VarAnalyzer } from "./var-analysis";
import { DaxExpression } from "../dax-expression";
import { Logger } from "../../../../shared/logger";

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
