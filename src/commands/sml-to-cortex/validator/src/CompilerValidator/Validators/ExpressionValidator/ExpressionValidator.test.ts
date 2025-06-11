import ExpressionValidator from "./ExpressionValidator";

const expressionValidator = new ExpressionValidator();

describe("areParenthesisValid", () => {
  it.each([
    [true, "()"],
    [true, "[]"],
    [true, "([][][])"],
    [true, "([Test])"],
    [true, "[Test].[Te)st]"],
    [true, "[Te))st].[Test)(( ( ]"],
    [true, "([test].[test] / [test].[test])"],
    [true, "TestMethod(Test([Test].[Test].[Test], [Test].[Test].Test),[Test].test)"],
    [false, "]["],
    [false, ")("],
    [false, "(()"],
    [false, "())"],
    [false, "[[]"],
    [false, "[[]]]"],
    [false, "[}"],
    [false, "{]"],
    [false, "(]"],
    [false, "[)"],
    [false, "[Te]st].[Te[st]"],
  ])("should return '%s' for expression: '%s'", (isValid, expression) => {
    expect(expressionValidator.areParenthesesValid(expression)).toBe(isValid);
  });
});
