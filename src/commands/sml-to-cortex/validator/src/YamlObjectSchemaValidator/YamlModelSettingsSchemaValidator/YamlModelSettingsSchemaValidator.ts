import modelSettingsSchema from "models/src/schemas/modelSettings.schema.json";

import { ISchemaValidatorWrapper } from "../SchemaValidatorWrapper/ISchemaValidatorWrapper";
import YamlObjectSchemaValidatorBase from "../YamlObjectSchemaValidatorBase";

export default class YamlModelSettingsSchemaValidator extends YamlObjectSchemaValidatorBase {
  constructor(protected readonly schemaValidator: ISchemaValidatorWrapper) {
    super(schemaValidator, modelSettingsSchema);
  }
}
