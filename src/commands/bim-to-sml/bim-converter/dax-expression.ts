import { DaxToken, DaxTokenizer, VarToken, ReturnToken } from "./dax-converter";
import {
  VarScopeTracker,
  VarInfo,
  VarAnalyzer,
  VarDependency,
  CircularDependencyResult,
} from "./var-analysis/var-analysis";

/**
 * DaxExpression wraps a DAX expression with analyzed metadata.
 *
 * Provides high-level access to:
 * - Tokenized expression
 * - Variable definitions and usage
 * - Dependency graph
 * - Circular dependency detection
 *
 * Usage:
 * ```typescript
 * const expr = DaxExpression.parse("VAR x = 1 VAR y = x + 2 RETURN y");
 * const vars = expr.getVariables();
 * const order = expr.getInliningOrder();
 * const hasCircular = expr.hasCircularDependencies();
 * ```
 */
export class DaxExpression {
  private tokens: DaxToken[];
  private scopeTracker: VarScopeTracker;
  private analyzer: VarAnalyzer;
  private analyzed: boolean = false;

  private constructor(
    private originalExpression: string,
    tokens: DaxToken[],
  ) {
    this.tokens = tokens;
    this.scopeTracker = new VarScopeTracker();
    this.analyzer = new VarAnalyzer(this.scopeTracker);
  }

  /**
   * Parse a DAX expression and create DaxExpression wrapper
   * @param daxExpression - DAX expression string
   * @returns DaxExpression instance
   */
  public static parse(daxExpression: string): DaxExpression {
    const tokenizer = new DaxTokenizer();
    const tokens = tokenizer.tokenize(daxExpression);
    const expr = new DaxExpression(daxExpression, tokens);
    expr.analyze();
    return expr;
  }

  /**
   * Create DaxExpression from pre-tokenized tokens
   * @param tokens - Array of DaxToken
   * @param originalExpression - Original DAX expression string (optional)
   * @returns DaxExpression instance
   */
  public static fromTokens(
    tokens: DaxToken[],
    originalExpression: string = "",
  ): DaxExpression {
    const expr = new DaxExpression(originalExpression, tokens);
    expr.analyze();
    return expr;
  }

  /**
   * Analyze the expression to build variable scope and dependency graph
   */
  private analyze(): void {
    if (this.analyzed) {
      return;
    }

    // Register all VAR declarations
    for (const token of this.tokens) {
      if (token instanceof VarToken) {
        try {
          this.scopeTracker.registerVar(token);
        } catch (error) {
          // Duplicate variable name - will be caught during analysis
          throw error;
        }
      }
    }

    // Build dependency graph
    this.analyzer.analyze();

    this.analyzed = true;
  }

  /**
   * Get all tokens in the expression
   */
  public getTokens(): DaxToken[] {
    return this.tokens;
  }

  /**
   * Get original expression string
   */
  public getOriginalExpression(): string {
    return this.originalExpression;
  }

  /**
   * Get all variable information
   * @returns Array of VarInfo for all variables
   */
  public getVariables(): VarInfo[] {
    return this.scopeTracker.getAllVars();
  }

  /**
   * Get specific variable information
   * @param varName - Variable name (case-insensitive)
   * @returns VarInfo or undefined if not found
   */
  public getVariable(varName: string): VarInfo | undefined {
    return this.scopeTracker.getVarInfo(varName);
  }

  /**
   * Check if expression contains variables
   * @returns true if any VAR declarations exist
   */
  public hasVariables(): boolean {
    return this.scopeTracker.getAllVars().length > 0;
  }

  /**
   * Get dependency information for all variables
   * @returns Array of VarDependency
   */
  public getDependencies(): VarDependency[] {
    return this.analyzer.getAllDependencies();
  }

  /**
   * Get dependency information for a specific variable
   * @param varName - Variable name (case-insensitive)
   * @returns VarDependency or undefined if not found
   */
  public getDependency(varName: string): VarDependency | undefined {
    return this.analyzer.getDependency(varName);
  }

  /**
   * Check for circular dependencies
   * @returns CircularDependencyResult with cycle path if found
   */
  public hasCircularDependencies(): CircularDependencyResult {
    return this.analyzer.hasCircularDependency();
  }

  /**
   * Get topological ordering for safe variable inlining
   * Variables with no dependencies come first
   * @returns Array of variable names in safe inlining order
   */
  public getInliningOrder(): string[] {
    return this.analyzer.getTopologicalOrder();
  }

  /**
   * Get variables that have no dependencies (leaf nodes)
   * @returns Array of variable names
   */
  public getLeafVariables(): string[] {
    return this.analyzer.getLeafVariables();
  }

  /**
   * Get variables that are not used by other variables (root nodes)
   * @returns Array of variable names
   */
  public getRootVariables(): string[] {
    return this.analyzer.getRootVariables();
  }

  /**
   * Get unused variables
   * @returns Array of VarInfo for variables with usage count = 0
   */
  public getUnusedVariables(): VarInfo[] {
    return this.scopeTracker.getUnusedVars();
  }

  /**
   * Get variables used more than once
   * @returns Array of VarInfo for multi-use variables
   */
  public getMultiUseVariables(): VarInfo[] {
    return this.scopeTracker.getMultiUseVars();
  }

  /**
   * Get the RETURN statement token if it exists
   * @returns ReturnToken or undefined
   */
  public getReturnStatement(): ReturnToken | undefined {
    return this.tokens.find((token) => token instanceof ReturnToken) as
      | ReturnToken
      | undefined;
  }

  /**
   * Get all VAR tokens
   * @returns Array of VarToken
   */
  public getVarTokens(): VarToken[] {
    return this.tokens.filter((token) => token instanceof VarToken) as VarToken[];
  }

  /**
   * Get comprehensive statistics about the expression
   */
  public getStats(): {
    totalTokens: number;
    varStats: {
      totalVars: number;
      unusedVars: number;
      singleUseVars: number;
      multiUseVars: number;
    };
    dependencyStats: {
      totalVars: number;
      leafVars: number;
      rootVars: number;
      maxDepth: number;
      avgDependencies: number;
    };
    hasReturn: boolean;
    hasCircularDependency: boolean;
  } {
    const circularResult = this.hasCircularDependencies();

    return {
      totalTokens: this.tokens.length,
      varStats: this.scopeTracker.getStats(),
      dependencyStats: this.analyzer.getStats(),
      hasReturn: this.getReturnStatement() !== undefined,
      hasCircularDependency: circularResult.hasCircular,
    };
  }

  /**
   * Get a summary string for debugging
   */
  public toString(): string {
    const stats = this.getStats();
    return (
      `DaxExpression {\n` +
      `  Tokens: ${stats.totalTokens}\n` +
      `  Variables: ${stats.varStats.totalVars} ` +
      `(${stats.varStats.unusedVars} unused, ${stats.varStats.multiUseVars} multi-use)\n` +
      `  Dependencies: max depth ${stats.dependencyStats.maxDepth}, ` +
      `avg ${stats.dependencyStats.avgDependencies.toFixed(1)} deps/var\n` +
      `  Has RETURN: ${stats.hasReturn}\n` +
      `  Circular deps: ${stats.hasCircularDependency}\n` +
      `}`
    );
  }
}
