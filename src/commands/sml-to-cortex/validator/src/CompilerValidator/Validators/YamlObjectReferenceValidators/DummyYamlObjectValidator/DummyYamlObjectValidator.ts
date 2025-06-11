import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import { IYamlObjectValidator } from "../../IYamlObjectValidator";

export class DummyYamlObjectValidator implements IYamlObjectValidator {
  validateObject(): ValidatorOutput {
    const validatorOutput = ValidatorOutput.create();

    return validatorOutput;
  }
}
