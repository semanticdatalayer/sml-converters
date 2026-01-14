import { BimMeasure, BimRoot, BimTable } from "../bim-models/bim-model";
import { Logger } from "../../../shared/logger";

/**
 * Tracks measure dependencies by parsing [MeasureName] references in DAX expressions.
 * Used to identify transitive calculation group dependencies.
 */
export class MeasureDependencyTracker {
  // Map of measure name → Set of referenced measure names
  private dependencies: Map<string, Set<string>> = new Map();

  // All measure names in the model
  private allMeasureNames: Set<string> = new Set();

  // Measures that directly use calculation groups (name → reason)
  private calcGroupMeasures: Map<string, string> = new Map();

  // Cache for usesCalculationGroup results (name → [usesCalcGroup, reason])
  private calcGroupCache: Map<string, [boolean, string | undefined]> = new Map();

  private logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
  }

  /**
   * Build dependency graph from BIM model.
   * Scans all measures and extracts [MeasureName] references.
   */
  buildFromBim(bim: BimRoot): void {
    // First pass: collect all measure names
    for (const table of bim.model?.tables || []) {
      for (const measure of table.measures || []) {
        this.allMeasureNames.add(measure.name);
      }
    }

    // Second pass: parse expressions to find dependencies
    for (const table of bim.model?.tables || []) {
      for (const measure of table.measures || []) {
        const refs = this.extractMeasureReferences(measure);
        this.dependencies.set(measure.name, refs);
      }
    }
  }

  /**
   * Extract [MeasureName] references from a measure's DAX expression.
   * Only includes references to actual measures (not column references).
   */
  private extractMeasureReferences(measure: BimMeasure): Set<string> {
    const refs = new Set<string>();

    const expression = this.getExpressionString(measure.expression);
    if (!expression) return refs;

    // Match [Name] pattern - measure references without table prefix
    // Regex: [ followed by non-bracket chars followed by ]
    // Must NOT be preceded by table name (e.g., 'Table'[col] or Table[col])
    const regex = /(?<!')(?<!\w)\[([^\]]+)\]/g;
    let match;

    while ((match = regex.exec(expression)) !== null) {
      const refName = match[1];
      // Only include if it's a known measure name
      if (this.allMeasureNames.has(refName)) {
        refs.add(refName);
      }
    }

    return refs;
  }

  /**
   * Convert expression to string (handles string | string[] | undefined)
   */
  private getExpressionString(expr: string | string[] | undefined): string {
    if (!expr) return "";
    if (Array.isArray(expr)) return expr.join("\n");
    return expr;
  }

  /**
   * Get direct dependencies of a measure.
   * Returns the set of measure names directly referenced by this measure.
   */
  getDependencies(measureName: string): Set<string> {
    return this.dependencies.get(measureName) || new Set();
  }

  /**
   * Check if a measure name exists in the model.
   */
  hasMeasure(measureName: string): boolean {
    return this.allMeasureNames.has(measureName);
  }

  /**
   * Get all measure names in the model.
   */
  getAllMeasureNames(): Set<string> {
    return new Set(this.allMeasureNames);
  }

  /**
   * Mark a measure as directly using calculation groups.
   * Called by MeasureConverter when it detects calc group usage.
   */
  markAsCalcGroupDependent(measureName: string, reason: string): void {
    this.calcGroupMeasures.set(measureName, reason);
    // Invalidate cache since dependencies may have changed
    this.calcGroupCache.clear();
  }

  /**
   * Check if a measure directly uses calculation groups.
   */
  isDirectCalcGroupMeasure(measureName: string): boolean {
    return this.calcGroupMeasures.has(measureName);
  }

  /**
   * Get the reason a measure directly uses calculation groups.
   */
  getDirectCalcGroupReason(measureName: string): string | undefined {
    return this.calcGroupMeasures.get(measureName);
  }

  /**
   * Check if a measure uses calculation groups (directly or transitively).
   * Returns [usesCalcGroup, reason] where reason explains the dependency chain.
   */
  usesCalculationGroup(measureName: string): [boolean, string | undefined] {
    // Check cache first
    const cached = this.calcGroupCache.get(measureName);
    if (cached !== undefined) {
      return cached;
    }

    // Use visited set to detect circular references
    const visited = new Set<string>();
    const result = this.checkCalcGroupDependency(measureName, visited);

    // Cache the result
    this.calcGroupCache.set(measureName, result);
    return result;
  }

  /**
   * Internal recursive check for calc group dependency.
   */
  private checkCalcGroupDependency(
    measureName: string,
    visited: Set<string>
  ): [boolean, string | undefined] {
    // Check for direct calc group usage
    if (this.calcGroupMeasures.has(measureName)) {
      const reason = this.calcGroupMeasures.get(measureName);
      return [true, reason];
    }

    // Circular reference detection
    if (visited.has(measureName)) {
      this.logger?.warn?.(
        `Circular reference detected in measure dependencies involving '${measureName}'`
      );
      return [false, undefined];
    }

    // Mark as visited before checking dependencies
    visited.add(measureName);

    // Check transitive dependencies
    const deps = this.dependencies.get(measureName);
    if (deps) {
      for (const dep of deps) {
        const [usesCalcGroup, depReason] = this.checkCalcGroupDependency(dep, visited);
        if (usesCalcGroup) {
          // Return reason referencing the immediate dependency only
          return [true, `references [${dep}] which uses calculationgroup`];
        }
      }
    }

    return [false, undefined];
  }
}
