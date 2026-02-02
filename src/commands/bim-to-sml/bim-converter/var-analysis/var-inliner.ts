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
import {
  VarSafetyChecker,
  SafetyCheckResult,
  SafetyConfig,
} from "./var-safety-checker";
import { Logger } from "../../../../shared/logger";

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
