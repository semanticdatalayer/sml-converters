import { VarToken, DaxToken, TableColumnReference } from "../dax-converter";

// ============================================================================
// VAR SCOPE TRACKER
// ============================================================================

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

// ============================================================================
// VAR ANALYZER
// ============================================================================

/**
 * Dependency information for a variable
 */
export interface VarDependency {
  /** Variable name */
  varName: string;
  /** Variables that this variable depends on */
  dependsOn: string[];
  /** Variables that depend on this variable */
  dependedBy: string[];
  /** Depth in dependency tree (0 = no dependencies) */
  depth: number;
}

/**
 * Result of circular dependency detection
 */
export interface CircularDependencyResult {
  /** Whether circular dependency exists */
  hasCircular: boolean;
  /** Cycle path if circular dependency found */
  cycle?: string[];
}

/**
 * VarAnalyzer builds dependency graphs for DAX variables and provides
 * topological sorting for safe inlining.
 *
 * Usage:
 * 1. analyze() to build dependency graph
 * 2. hasCircularDependency() to check for cycles
 * 3. getTopologicalOrder() to get safe inlining order (leaves first)
 */
export class VarAnalyzer {
  private scopeTracker: VarScopeTracker;
  private dependencies: Map<string, VarDependency> = new Map();

  constructor(scopeTracker: VarScopeTracker) {
    this.scopeTracker = scopeTracker;
  }

  /**
   * Analyze all variables and build dependency graph
   */
  public analyze(): void {
    this.dependencies.clear();

    const allVars = this.scopeTracker.getAllVars();

    // Initialize dependency entries
    for (const varInfo of allVars) {
      const key = varInfo.name;
      this.dependencies.set(key, {
        varName: varInfo.originalName,
        dependsOn: [],
        dependedBy: [],
        depth: 0,
      });
    }

    // Build dependency graph
    for (const varInfo of allVars) {
      const referencedVars = this.findVariableReferences(varInfo.token);
      const key = varInfo.name;
      const dependency = this.dependencies.get(key)!;

      for (const refVarName of referencedVars) {
        const refKey = refVarName.toUpperCase();

        // Only track dependencies on other VARs (not table columns)
        if (this.dependencies.has(refKey)) {
          dependency.dependsOn.push(refKey);

          const refDependency = this.dependencies.get(refKey)!;
          refDependency.dependedBy.push(key);
        }
      }
    }

    // Calculate depths
    this.calculateDepths();
  }

  /**
   * Find all variable references in a VAR's expression
   * @param varToken - VarToken to analyze
   * @returns Array of referenced variable names
   */
  private findVariableReferences(varToken: VarToken): string[] {
    const references: string[] = [];
    const tokens = varToken.getExpressionTokens();

    for (const token of tokens) {
      // Check if token is a table column reference
      if (token instanceof TableColumnReference) {
        // Check if this is actually a variable reference
        // In DAX, variables are referenced as bare identifiers
        // We check if the "table" part matches a variable name
        const possibleVarName = token.tableName;
        if (this.scopeTracker.hasVar(possibleVarName)) {
          references.push(possibleVarName);
        }
      }
    }

    return references;
  }

  /**
   * Calculate dependency depth for each variable
   * Depth = longest path to a leaf node (variable with no dependencies)
   */
  private calculateDepths(): void {
    const visited = new Set<string>();
    const stack = new Set<string>();

    for (const [varName] of this.dependencies) {
      if (!visited.has(varName)) {
        this.calculateDepthDFS(varName, visited, stack);
      }
    }
  }

  /**
   * DFS-based depth calculation
   */
  private calculateDepthDFS(
    varName: string,
    visited: Set<string>,
    stack: Set<string>
  ): number {
    // Check for circular dependency
    if (stack.has(varName)) {
      return 0; // Circular dependency - will be caught by hasCircularDependency
    }

    // Already calculated
    if (visited.has(varName)) {
      return this.dependencies.get(varName)!.depth;
    }

    visited.add(varName);
    stack.add(varName);

    const dependency = this.dependencies.get(varName)!;
    let maxDepth = 0;

    // Calculate depth based on dependencies
    for (const depVarName of dependency.dependsOn) {
      const depDepth = this.calculateDepthDFS(depVarName, visited, stack);
      maxDepth = Math.max(maxDepth, depDepth + 1);
    }

    dependency.depth = maxDepth;
    stack.delete(varName);

    return maxDepth;
  }

  /**
   * Check if circular dependency exists
   * @returns CircularDependencyResult with cycle path if found
   */
  public hasCircularDependency(): CircularDependencyResult {
    const visited = new Set<string>();
    const stack = new Set<string>();
    const path: string[] = [];

    for (const [varName] of this.dependencies) {
      if (!visited.has(varName)) {
        const cycle = this.detectCycleDFS(varName, visited, stack, path);
        if (cycle) {
          return {
            hasCircular: true,
            cycle,
          };
        }
      }
    }

    return { hasCircular: false };
  }

  /**
   * DFS-based cycle detection
   */
  private detectCycleDFS(
    varName: string,
    visited: Set<string>,
    stack: Set<string>,
    path: string[]
  ): string[] | null {
    visited.add(varName);
    stack.add(varName);
    path.push(varName);

    const dependency = this.dependencies.get(varName);
    if (!dependency) {
      path.pop();
      stack.delete(varName);
      return null;
    }

    for (const depVarName of dependency.dependsOn) {
      if (!visited.has(depVarName)) {
        const cycle = this.detectCycleDFS(depVarName, visited, stack, path);
        if (cycle) {
          return cycle;
        }
      } else if (stack.has(depVarName)) {
        // Found cycle - extract cycle path
        const cycleStart = path.indexOf(depVarName);
        return [...path.slice(cycleStart), depVarName];
      }
    }

    path.pop();
    stack.delete(varName);
    return null;
  }

  /**
   * Get topological ordering of variables (leaves first)
   * Variables with no dependencies come first, then variables that depend on them
   * @returns Array of variable names in safe inlining order
   */
  public getTopologicalOrder(): string[] {
    // Sort by depth (ascending) - leaves (depth 0) first
    const sortedDeps = Array.from(this.dependencies.values()).sort(
      (a, b) => a.depth - b.depth
    );

    return sortedDeps.map((dep) => dep.varName);
  }

  /**
   * Get dependency information for a variable
   * @param varName - Variable name (case-insensitive)
   * @returns VarDependency or undefined if not found
   */
  public getDependency(varName: string): VarDependency | undefined {
    return this.dependencies.get(varName.toUpperCase());
  }

  /**
   * Get all dependencies
   * @returns Array of all VarDependency entries
   */
  public getAllDependencies(): VarDependency[] {
    return Array.from(this.dependencies.values());
  }

  /**
   * Get variables with no dependencies (leaf nodes)
   * @returns Array of variable names with no dependencies
   */
  public getLeafVariables(): string[] {
    return Array.from(this.dependencies.values())
      .filter((dep) => dep.dependsOn.length === 0)
      .map((dep) => dep.varName);
  }

  /**
   * Get variables that no other variables depend on (root nodes)
   * @returns Array of variable names that are not dependencies
   */
  public getRootVariables(): string[] {
    return Array.from(this.dependencies.values())
      .filter((dep) => dep.dependedBy.length === 0)
      .map((dep) => dep.varName);
  }

  /**
   * Get dependency statistics
   */
  public getStats(): {
    totalVars: number;
    leafVars: number;
    rootVars: number;
    maxDepth: number;
    avgDependencies: number;
  } {
    const allDeps = this.getAllDependencies();
    const totalDeps = allDeps.reduce((sum, dep) => sum + dep.dependsOn.length, 0);

    return {
      totalVars: allDeps.length,
      leafVars: this.getLeafVariables().length,
      rootVars: this.getRootVariables().length,
      maxDepth: Math.max(0, ...allDeps.map((dep) => dep.depth)),
      avgDependencies: allDeps.length > 0 ? totalDeps / allDeps.length : 0,
    };
  }
}
