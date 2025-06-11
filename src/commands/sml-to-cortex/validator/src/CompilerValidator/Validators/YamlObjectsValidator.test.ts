import YamlDatasetBuilder from "models/src/builders/YamlObjectBuilders/YamlDatasetBuilder";
import { ObjectType } from "models/src/ObjectType";

import ValidatorOutput from "../../ValidatorOutput/ValidatorOutput";
import { IYamlObjectValidator } from "./IYamlObjectValidator";
import { YamlObjectsValidator } from "./YamlObjectsValidator";

describe("validateDimensionReferences", () => {
  it("Should call the provided validator validate", () => {
    const parsedFile = YamlDatasetBuilder.create().buildYamlFile();
    const validator = new YamlObjectsValidator();
    const validate = jest.fn().mockReturnValue(ValidatorOutput.create());
    validator.getObjectValidator = jest.fn<IYamlObjectValidator, ObjectType[]>().mockReturnValue({
      validateObject: validate,
    });

    validator.validate([parsedFile]);

    expect(validate).toHaveBeenCalledTimes(1);
    expect(validate).toHaveBeenCalledWith(parsedFile, expect.anything(), expect.anything());
  });
});
