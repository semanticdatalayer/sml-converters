import YamlCalculatedMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlCalculatedMeasureBuilder";

import IExpressionValidator from "../../ExpressionValidator/IExpressionValidator";
import { YamlMeasureCalcValidator } from "./YamlMeasureCalcValidator";

const expressionValidator: IExpressionValidator = { areParenthesesValid: jest.fn() };
const measureRefValidator = new YamlMeasureCalcValidator(expressionValidator);
const measureBuilder = YamlCalculatedMeasureBuilder.create();

describe("YamlMeasureCalculatedValidator", () => {
  it("Should call expressionValidator.areParenthesesValid", () => {
    const measureFile = measureBuilder.with({ expression: "[Valid].[Expression]" }).buildYamlFile();

    measureRefValidator.validateObject(measureFile);

    expect(expressionValidator.areParenthesesValid).toBeCalledTimes(1);
  });
});
