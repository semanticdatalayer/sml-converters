import YamlConnectionBuilder from "models/src/builders/YamlObjectBuilders/YamlConnectionBuilder";
import { ObjectType } from "models/src/ObjectType";

import { IYamlObjectSchemaValidator } from "./IYamlObjectSchemaValidator";
import YamlObjectSchemaValidator from "./YamlObjectSchemaValidator";

describe("YamlObjectValidator.validate", () => {
  it("Should call the provided validator validate", () => {
    const parsedFile = YamlConnectionBuilder.create()
      .with({
        unique_name: "",
        object_type: ObjectType.Connection,
        label: "",
      })
      .buildYamlFile();
    const validator = new YamlObjectSchemaValidator();
    const validate = jest.fn();
    validator.getValidator = jest.fn<IYamlObjectSchemaValidator, ObjectType[]>().mockReturnValue({
      validateAML: validate,
    });

    validator.getValidator(parsedFile.data.object_type).validateAML(parsedFile);

    expect(validate).toHaveBeenCalledWith(parsedFile);
  });
});
