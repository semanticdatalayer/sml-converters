/**
 * Type inference module for MDX expression analysis.
 * Used to detect usage context (numeric vs boolean) for TODO stub generation.
 */

/**
 * MDX expression types for type inference.
 */
export enum MdxType {
  BOOLEAN = 'BOOLEAN',
  NUMERIC = 'NUMERIC',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Tracks measure usage types across all expressions.
 * Maps measure names to the set of contexts they're used in.
 */
export interface UsageContext {
  /** Map of measure name → set of types it's used in */
  measureTypes: Map<string, Set<MdxType>>;
}

/**
 * Creates a new empty UsageContext for tracking measure types.
 */
export function createUsageContext(): UsageContext {
  return {
    measureTypes: new Map(),
  };
}

/**
 * Records a type usage for a measure.
 * @param context - The usage context to update
 * @param measureName - Name of the measure being used
 * @param type - The type context it's used in
 */
export function recordUsage(context: UsageContext, measureName: string, type: MdxType): void {
  const existing = context.measureTypes.get(measureName);
  if (existing) {
    existing.add(type);
  } else {
    context.measureTypes.set(measureName, new Set([type]));
  }
}

/**
 * Gets all types a measure is used in.
 * @param context - The usage context to query
 * @param measureName - Name of the measure
 * @returns Array of types the measure is used in, or empty array if not found
 */
export function getUsageTypes(context: UsageContext, measureName: string): MdxType[] {
  const types = context.measureTypes.get(measureName);
  return types ? Array.from(types) : [];
}

/**
 * Returns the type that an operator expects its arguments to be.
 * @param op - The operator (AND, OR, NOT, +, -, *, /, ^, >, <, =, <>, >=, <=)
 * @returns The expected argument type for the operator
 */
export function getOperatorExpectedType(op: string): MdxType {
  const normalized = op.toUpperCase().trim();

  // Boolean operators expect boolean arguments
  if (normalized === 'AND' || normalized === 'OR' || normalized === 'NOT') {
    return MdxType.BOOLEAN;
  }

  // Arithmetic operators expect numeric arguments
  if (['+', '-', '*', '/', '^'].includes(normalized)) {
    return MdxType.NUMERIC;
  }

  // Comparison operators expect numeric arguments
  if (['>', '<', '=', '<>', '>=', '<='].includes(normalized)) {
    return MdxType.NUMERIC;
  }

  return MdxType.UNKNOWN;
}

/**
 * Returns the type that an operator returns.
 * @param op - The operator (AND, OR, NOT, +, -, *, /, ^, >, <, =, <>, >=, <=)
 * @returns The return type of the operator
 */
export function getOperatorReturnType(op: string): MdxType {
  const normalized = op.toUpperCase().trim();

  // Boolean operators return boolean
  if (normalized === 'AND' || normalized === 'OR' || normalized === 'NOT') {
    return MdxType.BOOLEAN;
  }

  // Arithmetic operators return numeric
  if (['+', '-', '*', '/', '^'].includes(normalized)) {
    return MdxType.NUMERIC;
  }

  // Comparison operators return boolean
  if (['>', '<', '=', '<>', '>=', '<='].includes(normalized)) {
    return MdxType.BOOLEAN;
  }

  return MdxType.UNKNOWN;
}
