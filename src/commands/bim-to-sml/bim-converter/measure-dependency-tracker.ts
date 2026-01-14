import { BimMeasure, BimRoot, BimTable } from "../bim-models/bim-model";

/**
 * Tracks measure dependencies by parsing [MeasureName] references in DAX expressions.
 * Used to identify transitive calculation group dependencies.
 */
export class MeasureDependencyTracker {
  // Map of measure name → Set of referenced measure names
  private dependencies: Map<string, Set<string>> = new Map();

  // All measure names in the model
  private allMeasureNames: Set<string> = new Set();

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
}
