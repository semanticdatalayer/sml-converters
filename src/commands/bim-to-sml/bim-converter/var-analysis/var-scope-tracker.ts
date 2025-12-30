import { VarToken } from "../dax-converter";

/**
 * Information about a variable in scope
 */
export interface VarInfo {
  /** Variable name (case-insensitive key) */
  name: string;
  /** Original variable name as declared */
  originalName: string;
  /** VarToken containing the variable definition */
  token: VarToken;
  /** Number of times this variable is referenced */
  usageCount: number;
  /** Scope depth (0 = root scope) */
  scopeDepth: number;
}

/**
 * VarScopeTracker tracks variable definitions and usage within DAX expressions.
 *
 * DAX measure expressions typically have flat scope (single level), but this
 * tracker supports nested scopes for potential future extensions.
 *
 * Usage:
 * 1. registerVar() when VAR declaration encountered
 * 2. incrementUsage() when variable referenced
 * 3. getVarInfo() to query variable information
 */
export class VarScopeTracker {
  /** Map of variable name (uppercase) to VarInfo */
  private vars: Map<string, VarInfo> = new Map();

  /** Current scope depth (0 = root) */
  private currentDepth: number = 0;

  /**
   * Register a variable declaration
   * @param varToken - VarToken containing variable definition
   */
  public registerVar(varToken: VarToken): void {
    const key = varToken.varName.toUpperCase();

    // Check for duplicate variable names (DAX disallows this)
    if (this.vars.has(key)) {
      throw new Error(
        `Duplicate variable name: ${varToken.varName}. ` +
        `Variable already declared as ${this.vars.get(key)!.originalName}`
      );
    }

    this.vars.set(key, {
      name: key,
      originalName: varToken.varName,
      token: varToken,
      usageCount: 0,
      scopeDepth: this.currentDepth,
    });
  }

  /**
   * Increment usage count for a variable reference
   * @param varName - Variable name (case-insensitive)
   * @returns true if variable exists, false otherwise
   */
  public incrementUsage(varName: string): boolean {
    const key = varName.toUpperCase();
    const varInfo = this.vars.get(key);

    if (!varInfo) {
      return false;
    }

    varInfo.usageCount++;
    varInfo.token.incrementUsage();
    return true;
  }

  /**
   * Get information about a variable
   * @param varName - Variable name (case-insensitive)
   * @returns VarInfo or undefined if not found
   */
  public getVarInfo(varName: string): VarInfo | undefined {
    return this.vars.get(varName.toUpperCase());
  }

  /**
   * Check if a variable is defined in current scope
   * @param varName - Variable name (case-insensitive)
   * @returns true if variable exists
   */
  public hasVar(varName: string): boolean {
    return this.vars.has(varName.toUpperCase());
  }

  /**
   * Get all registered variables
   * @returns Array of VarInfo for all variables
   */
  public getAllVars(): VarInfo[] {
    return Array.from(this.vars.values());
  }

  /**
   * Get variables sorted by declaration order
   * @returns Array of VarInfo sorted by token position
   */
  public getVarsByDeclarationOrder(): VarInfo[] {
    return Array.from(this.vars.values()).sort(
      (a, b) => a.token.position - b.token.position
    );
  }

  /**
   * Get unused variables (usage count = 0)
   * @returns Array of VarInfo for unused variables
   */
  public getUnusedVars(): VarInfo[] {
    return Array.from(this.vars.values()).filter(
      (varInfo) => varInfo.usageCount === 0
    );
  }

  /**
   * Get variables used more than once
   * @returns Array of VarInfo for multi-use variables
   */
  public getMultiUseVars(): VarInfo[] {
    return Array.from(this.vars.values()).filter(
      (varInfo) => varInfo.usageCount > 1
    );
  }

  /**
   * Enter a new scope level (for future nested scope support)
   */
  public enterScope(): void {
    this.currentDepth++;
  }

  /**
   * Exit current scope level (for future nested scope support)
   */
  public exitScope(): void {
    if (this.currentDepth > 0) {
      this.currentDepth--;

      // Remove variables from the exited scope
      for (const [key, varInfo] of this.vars.entries()) {
        if (varInfo.scopeDepth > this.currentDepth) {
          this.vars.delete(key);
        }
      }
    }
  }

  /**
   * Get current scope depth
   * @returns Current scope depth (0 = root)
   */
  public getCurrentDepth(): number {
    return this.currentDepth;
  }

  /**
   * Reset tracker to initial state
   */
  public reset(): void {
    this.vars.clear();
    this.currentDepth = 0;
  }

  /**
   * Get statistics about variable usage
   */
  public getStats(): {
    totalVars: number;
    unusedVars: number;
    singleUseVars: number;
    multiUseVars: number;
  } {
    const allVars = this.getAllVars();

    return {
      totalVars: allVars.length,
      unusedVars: allVars.filter((v) => v.usageCount === 0).length,
      singleUseVars: allVars.filter((v) => v.usageCount === 1).length,
      multiUseVars: allVars.filter((v) => v.usageCount > 1).length,
    };
  }
}
