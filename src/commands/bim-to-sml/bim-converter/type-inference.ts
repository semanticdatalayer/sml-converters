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
 * Check if a measure is used in both BOOLEAN and NUMERIC contexts (dual-context).
 * @param context - The usage context to query
 * @param measureName - Name of the measure
 * @returns true if measure is used in both contexts
 */
export function isDualContext(context: UsageContext, measureName: string): boolean {
  const types = context.measureTypes.get(measureName);
  if (!types) return false;
  return types.has(MdxType.BOOLEAN) && types.has(MdxType.NUMERIC);
}

/**
 * Get all measures that are used in dual context (both BOOLEAN and NUMERIC).
 * @param context - The usage context to query
 * @returns Array of measure names that have dual-context usage
 */
export function getDualContextMeasures(context: UsageContext): string[] {
  const dualContext: string[] = [];
  for (const [measureName, types] of context.measureTypes) {
    if (types.has(MdxType.BOOLEAN) && types.has(MdxType.NUMERIC)) {
      dualContext.push(measureName);
    }
  }
  return dualContext;
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

/**
 * Result of rewriting measure references in an expression.
 */
export interface RewriteResult {
  /** The modified expression with split measure references */
  expression: string;
  /** Whether any references were rewritten */
  modified: boolean;
  /** Original expression preserved for comment */
  originalExpression: string;
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

/**
 * Position tracking for measure reference context.
 */
interface MeasureRefPosition {
  /** Measure name */
  measureName: string;
  /** Start position in expression */
  start: number;
  /** End position in expression */
  end: number;
  /** Expected type at this reference */
  expectedType: MdxType;
}

/**
 * Rewrites references to split measures in an MDX expression.
 * Replaces [MeasureName] with [MeasureName_num] or [MeasureName_bool] based on context.
 *
 * @param mdxExpression - The MDX expression to rewrite
 * @param splitMeasures - Set of measure names that were split (without suffixes)
 * @param originalDaxExpression - Original DAX expression for type inference
 * @returns RewriteResult with modified expression and metadata
 */
export function rewriteSplitMeasureReferences(
  mdxExpression: string,
  splitMeasures: Set<string>,
  originalDaxExpression: string,
): RewriteResult {
  if (splitMeasures.size === 0) {
    return {
      expression: mdxExpression,
      modified: false,
      originalExpression: mdxExpression,
    };
  }

  // First, run type inference on the original DAX to get context for each reference
  const context = createUsageContext();
  inferTypes(originalDaxExpression, context);

  // Now find all [Measures].[Name] patterns in the MDX
  // and determine which need to be replaced
  const measureRefPattern = /\[Measures\]\.\[([^\]]+)\]/g;
  let modified = false;
  const originalExpression = mdxExpression;

  // We need to analyze the MDX expression to determine context at each reference point
  // Since MDX and DAX have similar operator semantics, we can use the same approach
  const result = mdxExpression.replace(measureRefPattern, (match, measureName, offset) => {
    // Check if this measure was split
    if (!splitMeasures.has(measureName)) {
      return match; // Not a split measure, leave unchanged
    }

    // Determine context at this position in the expression
    // Look for surrounding operators to determine type context
    const contextType = inferContextAtPosition(mdxExpression, offset, measureName);

    modified = true;

    if (contextType === MdxType.BOOLEAN) {
      return `[Measures].[${measureName}_bool]`;
    } else {
      // NUMERIC or UNKNOWN defaults to numeric
      return `[Measures].[${measureName}_num]`;
    }
  });

  return {
    expression: result,
    modified,
    originalExpression,
  };
}

/**
 * Infer the type context at a specific position in an MDX expression.
 * Looks for nearby operators to determine if the context is boolean or numeric.
 *
 * @param expression - The MDX expression
 * @param position - The character position of the measure reference
 * @param measureName - The measure name being analyzed
 * @returns The inferred MdxType for this position
 */
function inferContextAtPosition(expression: string, position: number, measureName: string): MdxType {
  // Look at surrounding text to determine context
  // Search backwards and forwards for operators

  // Get text before and after the measure reference
  const before = expression.substring(0, position).toUpperCase();
  const after = expression.substring(position).toUpperCase();

  // Check for boolean operators nearby
  // AND, OR, NOT operators indicate boolean context
  const booleanOperators = [' AND ', ' OR ', 'NOT '];

  for (const op of booleanOperators) {
    // Check if there's a boolean operator immediately before (with possible whitespace)
    const trimmedBefore = before.trimEnd();
    if (trimmedBefore.endsWith(op.trimEnd())) {
      return MdxType.BOOLEAN;
    }

    // Check if there's a boolean operator after the measure reference
    // Find where this reference ends
    const refEnd = after.indexOf(']', after.indexOf(']') + 1);
    if (refEnd >= 0) {
      const afterRef = after.substring(refEnd + 1).trimStart();
      if (afterRef.startsWith(op.trimStart())) {
        return MdxType.BOOLEAN;
      }
    }
  }

  // Check for arithmetic operators which indicate numeric context
  const arithmeticOperators = ['+', '-', '*', '/', '^'];

  for (const op of arithmeticOperators) {
    // Check if there's an arithmetic operator immediately before
    const trimmedBefore = before.trimEnd();
    if (trimmedBefore.endsWith(op)) {
      return MdxType.NUMERIC;
    }

    // Check after the reference
    const refEnd = after.indexOf(']', after.indexOf(']') + 1);
    if (refEnd >= 0) {
      const afterRef = after.substring(refEnd + 1).trimStart();
      if (afterRef.startsWith(op)) {
        return MdxType.NUMERIC;
      }
    }
  }

  // Check for IIF/IF condition position (first argument is boolean)
  // Pattern: IIF( ... [Measures].[Name] ...AND/OR... , ...)
  // If we're inside the first argument of IIF/IF and there's a boolean op, it's boolean
  const iifMatch = before.match(/\bI?IF\s*\(\s*$/);
  if (iifMatch) {
    // We're right after IIF(, so this could be in the condition - check for comma
    const afterComma = after.indexOf(',');
    const afterClose = after.indexOf(')');
    // If no comma before close paren or if we're in first section, check for boolean ops
    if (afterComma === -1 || afterComma > afterClose) {
      return MdxType.BOOLEAN;
    }
  }

  // Default to NUMERIC if we can't determine context
  return MdxType.NUMERIC;
}
