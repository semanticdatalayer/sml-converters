export default interface IExpressionValidator {
  areParenthesesValid(expression: string): boolean;
}

export enum ParenthesisType {
  squareOpen = "[",
  squareClose = "]",
  circleOpen = "(",
  circleClose = ")",
}
