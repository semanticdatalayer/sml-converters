import IYamlParsedFile from "models/src/IYamlParsedFile";
import { IYamlMeasureCalculated } from "models/src/yaml/IYamlMeasure";
import { IYamlObject } from "models/src/yaml/IYamlObject";

import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import IExpressionValidator from "../../ExpressionValidator/IExpressionValidator";
import { IYamlObjectValidator } from "../../IYamlObjectValidator";
import MeasureFormatValidator from "../MeasureFormatValidator";

export class YamlMeasureCalcValidator implements IYamlObjectValidator {
  private readonly expressionValidator: IExpressionValidator;

  constructor(expressionValidator: IExpressionValidator) {
    this.expressionValidator = expressionValidator;
  }

  validateObject(item: IYamlParsedFile<IYamlObject>): ValidatorOutput {
    const measureCalc = item.data as IYamlMeasureCalculated;
    const validatorOutput = ValidatorOutput.create();

    if (measureCalc.expression && !this.expressionValidator.areParenthesesValid(measureCalc.expression)) {
      validatorOutput.file(item).addError(`Invalid metric expression: ${measureCalc.expression}`);
    }

    if (measureCalc.format) {
      MeasureFormatValidator.validate(measureCalc.format, item, validatorOutput);
    }

    return validatorOutput;
  }
}
