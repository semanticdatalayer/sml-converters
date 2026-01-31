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

/**
 * Returns the type that a function expects for its arguments.
 * @param funcName - The function name (IF, IIF, NOT, AND, OR, etc.)
 * @param argIndex - The argument index (0-based)
 * @returns The expected type for that argument
 */
export function getFunctionArgExpectedType(funcName: string, argIndex: number): MdxType {
  const normalized = funcName.toUpperCase().trim();

  // IF/IIF: first arg is condition (boolean), others are result values (inherit from context)
  if (normalized === 'IF' || normalized === 'IIF') {
    if (argIndex === 0) return MdxType.BOOLEAN;
    return MdxType.UNKNOWN; // True/false branches inherit context
  }

  // SWITCH: first arg is expression, then pairs of value/result
  if (normalized === 'SWITCH') {
    if (argIndex === 0) return MdxType.UNKNOWN;
    return MdxType.UNKNOWN;
  }

  // Boolean functions expect boolean arguments
  if (normalized === 'NOT' || normalized === 'AND' || normalized === 'OR') {
    return MdxType.BOOLEAN;
  }

  // Numeric functions expect numeric arguments
  const numericFunctions = [
    'SUM', 'MIN', 'MAX', 'AVG', 'AVERAGE', 'COUNT', 'ROUND', 'ABS',
    'FLOOR', 'CEILING', 'INT', 'DIVIDE', 'MOD', 'POWER', 'SQRT',
  ];
  if (numericFunctions.includes(normalized)) {
    return MdxType.NUMERIC;
  }

  return MdxType.UNKNOWN;
}

/**
 * Returns the type that a function returns.
 * @param funcName - The function name
 * @returns The return type of the function
 */
export function getFunctionReturnType(funcName: string): MdxType {
  const normalized = funcName.toUpperCase().trim();

  // Boolean-returning functions
  const booleanFunctions = [
    'NOT', 'AND', 'OR', 'ISBLANK', 'ISERROR', 'ISEMPTY',
    'HASONEVALUE', 'HASONEFILTER', 'ISFILTERED', 'ISCROSSFILTERED',
    'CONTAINS', 'CONTAINSROW', 'SELECTEDVALUE',
  ];
  if (booleanFunctions.includes(normalized)) {
    return MdxType.BOOLEAN;
  }

  // Numeric-returning functions
  const numericFunctions = [
    'SUM', 'MIN', 'MAX', 'AVG', 'AVERAGE', 'COUNT', 'COUNTROWS',
    'DISTINCTCOUNT', 'ROUND', 'ABS', 'FLOOR', 'CEILING', 'INT',
    'DIVIDE', 'MOD', 'POWER', 'SQRT', 'LEN', 'YEAR', 'MONTH', 'DAY',
  ];
  if (numericFunctions.includes(normalized)) {
    return MdxType.NUMERIC;
  }

  // IF/IIF return type depends on branch types (handled separately)
  if (normalized === 'IF' || normalized === 'IIF') {
    return MdxType.UNKNOWN;
  }

  return MdxType.UNKNOWN;
}

// Import token types for type inference tree walking
import {
  DaxToken,
  DaxTokenizer,
  FunctionToken,
  OperatorToken,
  ColumnReference,
  TableColumnReference,
  ParenToken,
  VarToken,
  ReturnToken,
  CommaToken,
  LiteralToken,
} from './dax-converter';

/**
 * Infers types through an expression tree and records measure usages.
 * Parses the expression, walks the tree passing expected types downward,
 * and records measure references with their expected types in the context.
 *
 * @param expression - The DAX expression string to analyze
 * @param context - The UsageContext to record measure types in
 */
export function inferTypes(expression: string, context: UsageContext): void {
  try {
    const tokenizer = new DaxTokenizer();
    const tokens = tokenizer.tokenize(expression);

    // Walk each top-level token with UNKNOWN expected type
    // (outer context determines actual expectation)
    for (const token of tokens) {
      inferTokenType(token, MdxType.UNKNOWN, context);
    }
  } catch {
    // If parsing fails, skip type inference for this expression
    // The conversion will handle errors separately
  }
}

/**
 * Recursively infers types for a token and its children.
 * Records measure references with their expected type.
 *
 * @param token - The token to process
 * @param expectedType - The type expected by the parent context
 * @param context - The UsageContext to record measure types in
 */
function inferTokenType(token: DaxToken, expectedType: MdxType, context: UsageContext): void {
  if (token instanceof ColumnReference) {
    // Column/measure reference - record the expected type
    const measureName = token.columnName;
    if (measureName && measureName.trim() !== '') {
      recordUsage(context, measureName, expectedType);
    }
  } else if (token instanceof TableColumnReference) {
    // Table[Column] reference - record the expected type
    const measureName = token.columnRef.columnName;
    if (measureName && measureName.trim() !== '') {
      recordUsage(context, measureName, expectedType);
    }
  } else if (token instanceof FunctionToken) {
    inferFunctionType(token, expectedType, context);
  } else if (token instanceof OperatorToken) {
    // Operators themselves don't have children in this token structure
    // Children are at the same level, handled by parent iteration
  } else if (token instanceof ParenToken) {
    // Parentheses pass through the expected type to their contents
    inferTokenListWithOperators(token.args, expectedType, context);
  } else if (token instanceof VarToken) {
    // VAR expressions - infer types in the variable's expression
    for (const t of token.expression) {
      inferTokenType(t, MdxType.UNKNOWN, context);
    }
  } else if (token instanceof ReturnToken) {
    // RETURN expression - infer types with outer expected type
    for (const t of token.expression) {
      inferTokenType(t, expectedType, context);
    }
  }
  // LiteralToken, CommaToken, IdentifierToken - no children, no measure refs
}

/**
 * Infers types for a function token and its arguments.
 *
 * @param funcToken - The function token to process
 * @param expectedType - The type expected by the parent context
 * @param context - The UsageContext to record measure types in
 */
function inferFunctionType(funcToken: FunctionToken, expectedType: MdxType, context: UsageContext): void {
  const funcName = funcToken.functionAgg.toUpperCase();

  // Filter out CommaTokens to get actual arguments
  const actualArgs = funcToken.args.filter(arg => !(arg instanceof CommaToken));

  // Special handling for IF/IIF - condition is boolean, branches inherit context
  if (funcName === 'IF' || funcName === 'IIF') {
    // First arg (condition) expects BOOLEAN
    if (actualArgs.length > 0) {
      inferTokenListWithOperators([actualArgs[0]], MdxType.BOOLEAN, context);
    }
    // Second arg (true branch) inherits expected type
    if (actualArgs.length > 1) {
      inferTokenListWithOperators([actualArgs[1]], expectedType, context);
    }
    // Third arg (false branch) inherits expected type
    if (actualArgs.length > 2) {
      inferTokenListWithOperators([actualArgs[2]], expectedType, context);
    }
    return;
  }

  // For other functions, use the function's expected arg types
  for (let i = 0; i < actualArgs.length; i++) {
    const argExpectedType = getFunctionArgExpectedType(funcName, i);
    // If function expects UNKNOWN for this arg, inherit from parent context
    const typeToUse = argExpectedType !== MdxType.UNKNOWN ? argExpectedType : expectedType;
    inferTokenType(actualArgs[i], typeToUse, context);
  }
}

/**
 * Infers types for a list of tokens, handling operators that determine context.
 * Operators like AND/OR expect BOOLEAN operands, arithmetic expects NUMERIC.
 *
 * @param tokens - The list of tokens
 * @param defaultType - The default expected type if no operator context
 * @param context - The UsageContext to record measure types in
 */
function inferTokenListWithOperators(tokens: DaxToken[], defaultType: MdxType, context: UsageContext): void {
  // First pass: find operators and determine the expected type for operands
  let operatorExpectedType = defaultType;

  for (const token of tokens) {
    if (token instanceof OperatorToken) {
      const opType = getOperatorExpectedType(token.value);
      if (opType !== MdxType.UNKNOWN) {
        operatorExpectedType = opType;
        break; // Use first operator's expectation
      }
    }
  }

  // Second pass: infer types for all tokens using the determined expected type
  for (const token of tokens) {
    if (!(token instanceof OperatorToken) && !(token instanceof CommaToken)) {
      inferTokenType(token, operatorExpectedType, context);
    }
  }
}
