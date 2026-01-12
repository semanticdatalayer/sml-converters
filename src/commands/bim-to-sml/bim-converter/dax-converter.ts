import { Constants } from "../bim-models/constants";
import { isSimpleCountRowsFunction } from "./expression-parser";
import { lowerNoSpace, noQuotes } from "./tools";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { BimRoot } from "../bim-models/bim-model";
import {
  AttributeMaps,
  ExtractedMeasure,
} from "../bim-models/types-and-interfaces";
import { MeasureConverter } from "./measure-converter";

export enum TokenType {
  FUNCTION = "FUNCTION",
  TABLE_REFERENCE = "TABLE_REFERENCE",
  COLUMN_REFERENCE = "COLUMN_REFERENCE",
  MEASURE_REFERENCE = "MEASURE_REFERENCE",
  LITERAL = "LITERAL",
  OPERATOR = "OPERATOR",
  PARENTHESIS = "PARENTHESIS",
  BRACKET = "BRACKET",
  COMMA = "COMMA",
  IDENTIFIER = "IDENTIFIER",
  VAR = "VAR",
  RETURN = "RETURN",
}

export let daxFunctionCalls: Map<
  string,
  { count: number; expressions: string[] }
> = new Map<string, { count: number; expressions: string[] }>();

export abstract class DaxToken {
  constructor(
    public type: TokenType,
    public value: string,
    public position: number,
  ) {}

  abstract toMdx(info: any): string;

  abstract toString(): string;
}

export class FunctionToken extends DaxToken {
  constructor(
    public functionAgg: string,
    public args: DaxToken[],
    position: number,
  ) {
    super(TokenType.FUNCTION, functionAgg, position);
  }

  toMdx(info: {
    bim: BimRoot;
    expr: string;
    tableName: string;
    result: SmlConverterResult;
    attrMaps: AttributeMaps;
    unusedTables: Set<string>;
    measureConverter: MeasureConverter;
  }): string {
    // Note: Removed old AGG_FNS special handling (SUM, MAX, etc.)
    // Those functions are now properly handled by the direct function converter
    // in the conversion pipeline, which preserves the function wrapper.

    switch (this.functionAgg.replace(" ", "").toLowerCase()) {
      case "round":
        return `ROUND(${this.args[0].toMdx(info)}, ${this.args[2].toMdx(
          info,
        )})`;
      default:
        // args array includes CommaTokens, so join with "" not ", "
        return `${this.functionAgg.toUpperCase()}(${this.args
          .map((arg) => arg.toMdx(info))
          .join("")})`;
    }
  }

  toString(): string {
    return `${this.functionAgg}(${this.argsToString()})`;
  }
  argsToString(): string {
    return this.args.map((arg) => arg.toString()).join("");
  }
}

export class IdentifierToken extends DaxToken {
  constructor(
    public functionName: string,
    public value: string,
    position: number,
  ) {
    super(TokenType.IDENTIFIER, functionName, position);
  }

  toMdx(info?: any): string {
    return this.value; // Return the identifier as is
  }

  toString(): string {
    return this.value; // Return the identifier as is
  }
}

export class ParenToken extends DaxToken {
  constructor(public args: DaxToken[], position: number) {
    super(TokenType.PARENTHESIS, "(", position);
  }

  setArgs(args: DaxToken[]) {
    this.args = args;
  }

  toMdx(info?: any): string {
    return `(${this.args.map((arg) => arg.toMdx(info)).join("")})`;
  }

  toString(): string {
    return `(${this.args.map((arg) => arg.toString()).join("")})`;
  }
}

/**
 * Represents a DAX brace expression { val1, val2, ... }
 * Used for IN operator: column IN {val1, val2}
 */
export class BraceToken extends DaxToken {
  constructor(public args: DaxToken[], position: number) {
    super(TokenType.BRACKET, "{", position);
  }

  toMdx(info?: any): string {
    return `{ ${this.args.map((arg) => arg.toMdx(info)).join("")} }`;
  }

  toString(): string {
    return `{ ${this.args.map((arg) => arg.toString()).join("")} }`;
  }
}

export class TableColumnReference extends DaxToken {
  constructor(
    public tableName: string,
    public columnRef: ColumnReference,
    position: number,
  ) {
    super(
      TokenType.TABLE_REFERENCE,
      `'${tableName}'[${columnRef.columnName}]`,
      position,
    );
  }

  toMdx(info?: any): string {
    // Convert DAX 'table'[column] to MDX [Measures].[actual_metric_name]
    const columnName = this.columnRef.columnName;

    // If columnName is empty, this is a bare table reference (e.g., 'TDA Cost' without column)
    // Bare table references are not convertible to MDX - they're used in FILTER, CALCULATE, etc.
    // Return the table name as a placeholder that will be caught in validation
    if (!columnName || columnName.trim() === "") {
      return `'${this.tableName}'`;
    }

    // Need to find or create a base metric for this table+column combination
    if (info && info.attrMaps && info.bim && info.measureConverter) {
      // Check if a base metric already exists for this table+column
      // The key format in metricLookup is: aggFn + lowerNoSpace(tableName + "[" + columnName + "]")
      // For a column reference without explicit aggregation, we need to search for any metric
      // that matches this table+column combination
      for (const [key, metricInfo] of info.attrMaps.metricLookup.entries()) {
        if (metricInfo.table === this.tableName && metricInfo.colName === columnName) {
          return `[Measures].[${metricInfo.uniqueName}]`;
        }
      }

      // Base metric doesn't exist - need to create it
      // Find the table and column in BIM model
      const bimTable = info.bim.model?.tables.find(
        (t: any) => t.name === this.tableName
      );

      if (bimTable) {
        const bimColumn = bimTable.columns?.find(
          (c: any) => c.name === columnName
        );

        if (bimColumn) {
          // Determine aggregation function from column's summarizeBy property, default to sum
          const aggFn = bimColumn.summarizeBy?.toLowerCase() || 'sum';

          const measureUniqueName = info.measureConverter.createAndAddMeasureFromColumn(
            bimColumn,
            this.tableName,
            aggFn,
            info.result,
            info.attrMaps,
            info.unusedTables,
          );

          if (measureUniqueName) {
            return `[Measures].[${measureUniqueName}]`;
          }
        }
      }
    }

    // Fallback: use column name as-is (may cause validation error)
    return this.columnRef.toMdx(info);
  }

  toString(): string {
    return `'${this.tableName}'${this.columnRef.toString()}`;
  }
}

export class ColumnReference extends DaxToken {
  constructor(public columnName: string, position: number) {
    super(TokenType.COLUMN_REFERENCE, columnName, position);
  }

  toMdx(info?: any): string {
    // DAX column/measure reference [Name] → MDX [Measures].[actual_unique_name]
    // Need to look up the actual SML unique_name that was created for this measure
    if (info && info.attrMaps && info.bim) {
      // First, try to find if this is a reference to a BIM measure that was converted to a calc
      // Search all tables for a measure with this name
      for (const table of info.bim.model?.tables || []) {
        const bimMeasure = table.measures?.find(
          (m: any) => m.name === this.columnName
        );
        if (bimMeasure) {
          // Found the BIM measure - look up the calc that was created for it
          // The calc unique_name is stored in attrNameMap
          const calcKey = `calculation.${table.name}.${this.columnName}`.toLowerCase();
          const lookupResult = info.attrMaps.attrNameMap.get(calcKey);
          if (lookupResult && lookupResult.length > 0) {
            // Found the calc unique_name
            return `[Measures].[${lookupResult[0]}]`;
          }
        }
      }

      // Not a BIM measure - might be a column reference
      // Check if a base metric was already created for this column
      // Search metricLookup for any metric with this column name
      for (const [key, metricInfo] of info.attrMaps.metricLookup.entries()) {
        if (metricInfo.colName === this.columnName) {
          return `[Measures].[${metricInfo.uniqueName}]`;
        }
      }
    }

    // Fallback: use column name as-is (will likely cause validation error)
    return `[Measures].[${this.columnName}]`;
  }

  toString(): string {
    return `[${this.columnName}]`;
  }
}

export class LiteralToken extends DaxToken {
  constructor(
    public literalValue: string | number | boolean,
    position: number,
  ) {
    super(TokenType.LITERAL, literalValue.toString(), position);
  }

  toMdx(info?: any): string {
    return this.value;
  }

  toString(): string {
    return this.value; // Return the literal value as a string
  }
}

export class CommaToken extends DaxToken {
  constructor(position: number) {
    super(TokenType.COMMA, ",", position);
  }

  toMdx(info?: any): string {
    return ",";
  }

  toString(): string {
    return ","; // Return the comma as a string
  }
}

export class OperatorToken extends DaxToken {
  constructor(operator: string, position: number) {
    super(TokenType.OPERATOR, operator, position);
  }

  toMdx(info?: any): string {
    // Convert DAX operators to AtScale MDX operators
    // Per CLAUDE.md: Use valid AtScale MDX syntax
    switch (this.value) {
      case "&&":
        return " AND ";
      case "||":
        return " OR ";
      case "!=":
        return "<>";
      default:
        return this.value;
    }
  }
  toString(): string {
    return this.value; // Return the operator as a string
  }
}

/**
 * Represents a DAX VAR declaration.
 * Format: VAR <varName> = <expression>
 */
export class VarToken extends DaxToken {
  constructor(
    public varName: string,
    public expression: DaxToken[],
    public usageCount: number = 0,
    position: number,
  ) {
    super(TokenType.VAR, varName, position);
  }

  toMdx(info: any): string {
    // VARs cannot be directly converted to MDX
    // They need to be inlined at usage sites
    return `/* VAR ${this.varName} = ... */`;
  }

  toString(): string {
    return `VAR ${this.varName} = [${this.expression.length} tokens]`;
  }

  /**
   * Gets the expression tokens for this variable
   */
  getExpressionTokens(): DaxToken[] {
    return this.expression;
  }

  /**
   * Increments the usage count for this variable
   */
  incrementUsage(): void {
    this.usageCount++;
  }
}

/**
 * Represents a DAX RETURN statement.
 * Format: RETURN <expression>
 */
export class ReturnToken extends DaxToken {
  constructor(
    public expression: DaxToken[],
    position: number,
  ) {
    super(TokenType.RETURN, "RETURN", position);
  }

  toMdx(info: any): string {
    // Convert the return expression tokens to MDX
    return this.expression.map((token) => token.toMdx(info)).join("");
  }

  toString(): string {
    return `RETURN [${this.expression.length} tokens]`;
  }

  /**
   * Gets the expression tokens in the RETURN statement
   */
  getExpressionTokens(): DaxToken[] {
    return this.expression;
  }
}

export class DaxTokenizer {
  private position = 0;
  private tokens: DaxToken[] = [];

  convertToMdx(info: any) {
    return this.tokens.map((token) => token.toMdx(info)).join(" ");
  }

  tokenize(daxExpression: string): DaxToken[] {
    while (this.position < daxExpression.length) {
      this.skipWhitespace(daxExpression);

      if (this.position >= daxExpression.length) break;

      const char = daxExpression[this.position];
      if (this.isLetterOrUnderscore(char)) {
        this.parseIdentifierOrFunction(daxExpression);
      } else if (char === "'") {
        this.parseQuotedTableName(daxExpression);
      } else if (char === "[") {
        this.parseColumnReferenceSingular(daxExpression);
      } else if (char === "(") {
        this.parseFunction(daxExpression);
      } else if (char === "{") {
        this.parseBraceExpression(daxExpression);
      } else if (char === ",") {
        this.tokens.push(new CommaToken(this.position));
        this.position++;
      } else if (this.isDigit(char)) {
        this.parseNumber(daxExpression.substring(this.position));
      } else if (this.isOperator(daxExpression[this.position])) {
        this.parseOperator(daxExpression);
        // this.position++;
      } else {
        // Handle other characters (etc.)
        this.position++;
      }
    }

    return this.tokens;
  }

  private parseIdentifierOrFunction(expression: string): void {
    const start = this.position;
    while (
      this.position < expression.length &&
      (this.isLetterOrUnderscore(expression[this.position]) ||
        this.isDigit(expression[this.position]) ||
        expression[this.position] === "_")
    ) {
      this.position++;
    }

    const identifier = expression.substring(start, this.position);

    // Check for VAR keyword
    if (identifier.toUpperCase() === "VAR") {
      this.parseVarDeclaration(expression);
      return;
    }

    // Check for RETURN keyword
    if (identifier.toUpperCase() === "RETURN") {
      this.parseReturnStatement(expression);
      return;
    }

    // Check if next non-whitespace character is '(' to determine if it's a function
    let nextPos = this.position;
    while (nextPos < expression.length && expression[nextPos] === " ") {
      nextPos++;
    }

    if (nextPos < expression.length && expression[nextPos] === "(") {
      // It's a function
      daxFunctionCalls.set(identifier.toLowerCase(), {
        count: (daxFunctionCalls.get(identifier.toLowerCase())?.count || 0) + 1,
        expressions: [
          ...(daxFunctionCalls.get(identifier.toLowerCase())?.expressions ||
            []),
          expression,
        ],
      });
      const args = this.parseFunctionArguments(expression, nextPos + 1);
      this.tokens.push(new FunctionToken(identifier, args, start));
    } else if (nextPos < expression.length && expression[nextPos] === "[") {
      // It's a table
      this.tokens.push(
        new TableColumnReference(
          identifier,
          this.parseColumnReference(expression),
          start,
        ),
      );
    } else {
      // It's an identifier (could be a measure, column, or variable reference)
      this.tokens.push(
        new IdentifierToken(TokenType.IDENTIFIER, identifier, start),
      );
    }
  }

  /**
   * Parse VAR declaration: VAR <varName> = <expression>
   * The expression continues until we hit RETURN or another VAR
   */
  private parseVarDeclaration(expression: string): void {
    const start = this.position;

    // Skip whitespace after VAR
    this.skipWhitespace(expression);

    // Parse variable name
    const varNameStart = this.position;
    while (
      this.position < expression.length &&
      (this.isLetterOrUnderscore(expression[this.position]) ||
        this.isDigit(expression[this.position]) ||
        expression[this.position] === "_")
    ) {
      this.position++;
    }
    const varName = expression.substring(varNameStart, this.position);

    // Skip whitespace
    this.skipWhitespace(expression);

    // Expect '='
    if (this.position >= expression.length || expression[this.position] !== "=") {
      throw new Error(`Expected '=' after VAR ${varName}`);
    }
    this.position++; // Skip '='

    // Skip whitespace after '='
    this.skipWhitespace(expression);

    // Find end of expression (next VAR, RETURN, or end of string)
    const exprStart = this.position;
    const exprEnd = this.findVarExpressionEnd(expression, exprStart);

    // Tokenize the variable expression
    const tokenizer = new DaxTokenizer();
    const varExpression = expression.substring(exprStart, exprEnd);
    const exprTokens = tokenizer.tokenize(varExpression);

    // Update position to end of expression
    this.position = exprEnd;

    // Create and add VarToken
    this.tokens.push(new VarToken(varName, exprTokens, 0, start));
  }

  /**
   * Find the end of a VAR expression (stops at RETURN or next VAR)
   */
  private findVarExpressionEnd(expression: string, start: number): number {
    let pos = start;
    let depth = 0; // Track parenthesis depth

    while (pos < expression.length) {
      const char = expression[pos];

      // Track parenthesis depth to avoid matching keywords inside function calls
      if (char === "(") {
        depth++;
      } else if (char === ")") {
        depth--;
      }

      // Only check for keywords at depth 0
      if (depth === 0) {
        // Check if we're at the start of RETURN or VAR keyword
        const remaining = expression.substring(pos);
        if (/^RETURN\b/i.test(remaining) || /^VAR\b/i.test(remaining)) {
          // Trim trailing whitespace
          while (pos > start && /\s/.test(expression[pos - 1])) {
            pos--;
          }
          return pos;
        }
      }

      pos++;
    }

    return pos; // End of string
  }

  /**
   * Parse RETURN statement: RETURN <expression>
   * The expression is everything after RETURN
   */
  private parseReturnStatement(expression: string): void {
    const start = this.position;

    // Skip whitespace after RETURN
    this.skipWhitespace(expression);

    // Parse the return expression (everything remaining)
    const exprStart = this.position;
    const returnExpression = expression.substring(exprStart);

    // Tokenize the return expression
    const tokenizer = new DaxTokenizer();
    const exprTokens = tokenizer.tokenize(returnExpression);

    // Update position to end of expression
    this.position = expression.length;

    // Create and add ReturnToken
    this.tokens.push(new ReturnToken(exprTokens, start));
  }

  private parseQuotedTableName(expression: string): void {
    const start = this.position;
    this.position++; // Skip opening quote

    while (
      this.position < expression.length &&
      expression[this.position] !== "'"
    ) {
      this.position++;
    }

    if (this.position < expression.length) {
      this.position++; // Skip closing quote
    }

    const tableName = expression.substring(start + 1, this.position - 1);
    let columnName: ColumnReference = new ColumnReference("", start);

    // Check if followed by [columnName]
    if (
      this.position < expression.length &&
      expression[this.position] === "["
    ) {
      columnName = this.parseColumnReference(expression);
    }
    this.tokens.push(new TableColumnReference(tableName, columnName, start));
  }

  private parseColumnReferenceSingular(expression: string): void {
    this.tokens.push(this.parseColumnReference(expression));
  }

  private parseColumnReference(expression: string): ColumnReference {
    const start = this.position;
    this.position++; // Skip [

    while (
      this.position < expression.length &&
      expression[this.position] !== "]"
    ) {
      this.position++;
    }

    if (this.position < expression.length) {
      this.position++; // Skip ]
    }

    const columnName = expression.substring(start + 1, this.position - 1);
    return new ColumnReference(columnName, start);
  }

  private parseFunction(expression: string): void {
    // This method is called when we encounter a '(' that's not part of a function name
    const token = new ParenToken(
      this.parseFunctionArguments(expression, this.position + 1),
      this.position,
    );
    this.tokens.push(token);
  }

  /**
   * Parse brace expression { val1, val2, ... }
   * Used for IN operator sets
   */
  private parseBraceExpression(expression: string): void {
    const start = this.position;
    const endBrace = this.findMatchingCloseBrace(expression, start);
    const innerExpression = expression.slice(start + 1, endBrace);
    const tokenizer = new DaxTokenizer();
    const innerTokens = tokenizer.tokenize(innerExpression);
    this.position = endBrace + 1; // Move past closing brace
    this.tokens.push(new BraceToken(innerTokens, start));
  }

  /**
   * Find matching closing brace for an opening brace
   */
  private findMatchingCloseBrace(expression: string, openPos: number): number {
    let count = 1;
    let pos = openPos + 1;

    while (pos < expression.length && count > 0) {
      if (expression[pos] === "{") count++;
      else if (expression[pos] === "}") count--;
      pos++;
    }

    return pos - 1;
  }

  private parseFunctionArguments(
    expression: string,
    startPos: number,
  ): DaxToken[] {
    // This would recursively parse the function arguments
    const endParen = this.findMatchingCloseParen(expression, startPos - 1);
    const tokenizer = new DaxTokenizer();
    const newExpression = expression.slice(startPos, endParen);
    this.position = endParen + 1; // Move position past the closing parenthesis
    return tokenizer.tokenize(newExpression);
  }

  private findMatchingCloseParen(expression: string, openPos: number): number {
    // Starts after the opening parenthesis
    let count = 1;
    let pos = openPos + 1;

    while (pos < expression.length && count > 0) {
      if (expression[pos] === "(") count++;
      else if (expression[pos] === ")") count--;
      pos++;
    }

    return pos - 1;
  }

  parseNumber(expression: string) {
    const numberPattern = /^\d+(\.\d+)?/;
    const match = expression.match(numberPattern);
    if (match) {
      const value = parseFloat(match[0]);
      this.tokens.push(new LiteralToken(value, this.position));
      this.position += match[0].length;
    } else {
      throw new Error("Invalid number format");
    }
  }

  parseOperator(expression: string) {
    // Define multi-character operators first
    const operators = [
      ">=",
      "<=",
      "<>",
      "!=",
      "&&",
      "||",
      "+",
      "-",
      "*",
      "/",
      "=",
      ">",
      "<",
      "&",
    ];

    let potentialOperator = "";
    for (let i = this.position; i < expression.length; i++) {
      const currentChar = expression[i];
      potentialOperator += currentChar;

      // If no operator starts with this sequence, we've found our operator
      if (!operators.some((op) => op.startsWith(potentialOperator))) {
        potentialOperator = potentialOperator.slice(0, -1); // Remove last char
        break;
      }
    }

    if (operators.includes(potentialOperator)) {
      this.tokens.push(new OperatorToken(potentialOperator, this.position));
      this.position += potentialOperator.length;
      return;
    }

    throw new Error("Invalid operator format");
  }

  private skipWhitespace(expression: string): void {
    while (
      this.position < expression.length &&
      /\s/.test(expression[this.position])
    ) {
      this.position++;
    }
  }

  private isLetterOrUnderscore(char: string): boolean {
    return /[a-zA-Z_]/.test(char);
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isOperator(char: string): boolean {
    // Check if this character could start an operator
    return ["+", "-", "*", "/", "=", ">", "<", "!", "&", "|"].includes(char);
  }

  getAllFunctions(tokens?: DaxToken[]): FunctionToken[] {
    const functionTokens: FunctionToken[] = [];
    if (!tokens) {
      tokens = this.tokens;
    }
    tokens.forEach((token) => {
      if (token instanceof ParenToken || token instanceof FunctionToken) {
        functionTokens.push(...this.getAllFunctions(token.args));
      }
      if (token instanceof BraceToken) {
        functionTokens.push(...this.getAllFunctions(token.args));
      }
      if (token instanceof FunctionToken) {
        functionTokens.push(token);
      }
    });
    return functionTokens;
  }

  getAllInstanceOf<T extends DaxToken>(
    type: new (...args: any[]) => T,
    tokens?: DaxToken[],
  ): T[] {
    const typeTokens: T[] = [];
    if (!tokens) {
      tokens = this.tokens;
    }
    tokens.forEach((token) => {
      if (token instanceof ParenToken || token instanceof FunctionToken) {
        typeTokens.push(...this.getAllInstanceOf(type, token.args));
      }
      // Search inside brace expressions { val1, val2 }
      if (token instanceof BraceToken) {
        typeTokens.push(...this.getAllInstanceOf(type, token.args));
      }
      // Search inside VAR expressions to detect unconvertible functions
      if (token instanceof VarToken) {
        typeTokens.push(...this.getAllInstanceOf(type, token.expression));
      }
      if (token instanceof type) {
        typeTokens.push(token as T);
      }
    });
    return typeTokens;
  }

  /**
   * Checks if expression contains any unconvertible DAX functions.
   * Uses DirectFunctionConverter registry to identify unconvertible functions.
   * @param logger - Logger instance for DirectFunctionConverter
   * @returns true if any unconvertible functions found
   */
  public hasUnconvertibleFunctions(logger: any): boolean {
    const { DirectFunctionConverter } = require("./converters/direct-function-converter");
    const converter = DirectFunctionConverter.getInstance(logger);

    const functionTokens = this.getAllInstanceOf(FunctionToken);
    return functionTokens.some((token) =>
      converter.isUnconvertibleFunction(token.functionAgg),
    );
  }

  /**
   * Gets list of all DAX functions used in the expression
   * @returns Array of unique function names (uppercase)
   */
  public getFunctionNames(): string[] {
    const functionTokens = this.getAllInstanceOf(FunctionToken);
    const functionNames = new Set<string>();
    functionTokens.forEach((token) => {
      functionNames.add(token.functionAgg.toUpperCase());
    });
    return Array.from(functionNames);
  }

  /**
   * Categorizes functions in expression by type
   * @param logger - Logger instance for DirectFunctionConverter
   * @returns Object with arrays of direct, unconvertible, and complex functions
   */
  public categorizeFunctions(logger: any): {
    direct: string[];
    unconvertible: string[];
    complex: string[];
    unknown: string[];
  } {
    const { DirectFunctionConverter } = require("./converters/direct-function-converter");
    const converter = DirectFunctionConverter.getInstance(logger);

    const functionNames = this.getFunctionNames();
    const result = {
      direct: [] as string[],
      unconvertible: [] as string[],
      complex: [] as string[],
      unknown: [] as string[],
    };

    functionNames.forEach((funcName) => {
      if (converter.isSupportedFunction(funcName)) {
        result.direct.push(funcName);
      } else if (converter.isUnconvertibleFunction(funcName)) {
        result.unconvertible.push(funcName);
      } else if (converter.isComplexPattern(funcName)) {
        result.complex.push(funcName);
      } else {
        result.unknown.push(funcName);
      }
    });

    return result;
  }
}

export function convertDaxToMdx(daxExpression: string, info: any): string {
  const tokenizer = new DaxTokenizer();
  const tokens = tokenizer.tokenize(daxExpression);

  return tokens.map((token) => token.toMdx(info)).join("");
}

function isSimpleFunction(funcToken: FunctionToken): boolean {
  return (
    funcToken.args.length === 1 &&
    funcToken.args[0] instanceof TableColumnReference
  );
}

export function getMeasureName(
  bim: BimRoot,
  funcToken: FunctionToken,
  tableName: string,
  result: SmlConverterResult,
  attrMaps: AttributeMaps,
  unusedTables: Set<string>,
  measureConverter: MeasureConverter,
): ExtractedMeasure | undefined {
  const aggFn = lowerNoSpace(funcToken.functionAgg);
  const fnBlock = `(${funcToken.argsToString()})`;
  const e = noQuotes(lowerNoSpace(fnBlock));
  if (aggFn !== "none") {
    // ex: e == sum(pocvalues[toptaskid]) -> pocvalues[toptaskid]
    if (isSimpleFunction(funcToken)) {
      const simpleDef = lowerNoSpace(funcToken.argsToString());

      // Defensive check: ensure attrMaps.metricLookup exists
      if (!attrMaps || !attrMaps.metricLookup) {
        return undefined;
      }

      // Need to see if this metric exists, and if not create it
      const m = attrMaps.metricLookup.get(aggFn + simpleDef);
      if (m) {
        return {
          measName: `[Measures].[${m.uniqueName}]`,
          newExpr: "",
          tableName: m.table,
        };
      } else {
        // Create measure for simple aggregation
        const refColName = simpleDef.substring(
          simpleDef.indexOf("[") + 1,
          simpleDef.indexOf("]"),
        );
        const bimTable = bim.model.tables.find(
          (t) =>
            lowerNoSpace(t.name) ===
            noQuotes(simpleDef.substring(0, simpleDef.indexOf("["))),
        );
        if (bimTable) {
          const c = bimTable.columns.find(
            (c) => lowerNoSpace(c.name) === refColName,
          );
          if (c) {
            const measureUniqueName =
              measureConverter.createAndAddMeasureFromColumn(
                c,
                bimTable.name,
                aggFn,
                result,
                attrMaps,
                unusedTables,
              );
            if (!measureUniqueName) return undefined;

            const retVal = {
              measName: `[Measures].[${measureUniqueName}]`,
              newExpr: "",
              tableName: bimTable.name,
            };
            return retVal;
          }
        }
      }
    }
  } else if (isSimpleCountRowsFunction(e)) {
    const simpleDef = `${noQuotes(lowerNoSpace(funcToken.argsToString()))}[${
      Constants.ROW_COUNT_COLUMN_NAME
    }]`;

    // Defensive check: ensure attrMaps.metricLookup exists
    if (!attrMaps || !attrMaps.metricLookup) {
      return undefined;
    }

    const m = attrMaps.metricLookup.get(aggFn + simpleDef);
    if (m) {
      return {
        measName: `[Measures].[${m.uniqueName}]`,
        newExpr: "",
        tableName: m.table,
      };
    } else {
      // Create measure for simple aggregation
      for (const t of bim.model.tables) {
        if (
          lowerNoSpace(t.name) ===
          simpleDef.substring(0, simpleDef.indexOf("["))
        ) {
          const measureUniqueName =
            measureConverter.createAndAddCountRowsMeasure(
              t.name,
              result,
              attrMaps,
              unusedTables,
              true,
            );
          if (!measureUniqueName) return undefined;
          const retVal = {
            measName: `[Measures].[${measureUniqueName}]`,
            newExpr: "",
            tableName: t.name,
          };
          return retVal;
        }
      }
    }
  }
  return undefined;
}
