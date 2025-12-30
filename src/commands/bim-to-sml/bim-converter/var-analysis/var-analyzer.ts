import { VarToken, DaxToken, TableColumnReference } from "../dax-converter";
import { VarScopeTracker, VarInfo } from "./var-scope-tracker";

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
