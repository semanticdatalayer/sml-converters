import IYamlParsedFile from "models/src/IYamlParsedFile";
import { IYamlMeasure } from "models/src/yaml/IYamlMeasure";

import { IYamlObjectSchemaValidatorResponse } from "../IYamlObjectSchemaValidatorResponse";
import { ISchemaObject, ISchemaValidatorWrapper } from "../SchemaValidatorWrapper/ISchemaValidatorWrapper";
import YamlObjectSchemaValidatorBase from "../YamlObjectSchemaValidatorBase";

export const yamlMeasureSchemaErrors = {
  legacySchemaNotAllowed: () =>
    `semi_additive Unsupported properties in definition. ('dimension', 'hierarchy', and 'level' are not allowed.)`,
};

export default class YamlMeasureSchemaValidator extends YamlObjectSchemaValidatorBase {
  constructor(
    protected readonly schemaValidator: ISchemaValidatorWrapper,
    protected readonly jsonSchema: ISchemaObject
  ) {
    super(schemaValidator, jsonSchema);
  }

  validateAML(parsedFile: IYamlParsedFile<IYamlMeasure>): IYamlObjectSchemaValidatorResponse {
    const validationResult = super.validateAML(parsedFile);

    if (parsedFile.data.semi_additive) {
      if (
        "dimension" in parsedFile.data.semi_additive ||
        "hierarchy" in parsedFile.data.semi_additive ||
        "level" in parsedFile.data.semi_additive
      ) {
        // If there is an existing schema error, remove it to keep the custom error message only
        const missingAttributeMessage =
          "There should be at least one attribute in the semi-additive. Please define either 'relationships' or 'degenerate_dimensions'.";

        validationResult.errors = [
          ...validationResult.errors.filter((e) => e.indexOf(missingAttributeMessage) === -1),
          yamlMeasureSchemaErrors.legacySchemaNotAllowed(),
        ];
      }
    }

    return validationResult;
  }
}
