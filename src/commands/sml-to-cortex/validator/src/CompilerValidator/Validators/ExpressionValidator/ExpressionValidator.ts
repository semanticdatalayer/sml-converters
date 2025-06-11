import { ParenthesisType } from "./IExpressionValidator";

export default class ExpressionValidator {
  private readonly parentheses: { [key: string]: string } = {
    [ParenthesisType.circleOpen]: ParenthesisType.circleClose,
    [ParenthesisType.squareOpen]: ParenthesisType.squareClose,
  };

  private readonly ignoredSymbolsInSquareParenthesis: Set<string> = new Set<string>([
    ParenthesisType.circleClose,
    ParenthesisType.circleOpen,
  ]);

  areParenthesesValid(expression: string): boolean {
    const stack: string[] = [];

    for (const char of expression) {
      const isInSquareParenthesis = stack[stack.length - 1] === ParenthesisType.squareOpen;

      if (isInSquareParenthesis && this.ignoredSymbolsInSquareParenthesis.has(char)) {
        continue;
      }

      if (char in this.parentheses) {
        stack.push(char);
      } else if (this.isClosingParenthesis(char)) {
        const lastParenthesis = stack.pop();
        if (lastParenthesis === undefined || this.parentheses[lastParenthesis] !== char) {
          return false;
        }
      }
    }

    return !stack.length;
  }

  private isClosingParenthesis(char: string): boolean {
    return Object.values(this.parentheses).some((value) => value === char);
  }
}
