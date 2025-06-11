import globalSettingsSchema from "models/src/schemas/globalSettings.schema.json";

import { ISchemaValidatorWrapper } from "../SchemaValidatorWrapper/ISchemaValidatorWrapper";
import YamlObjectSchemaValidatorBase from "../YamlObjectSchemaValidatorBase";

export default class YamlGlobalSettingsSchemaValidator extends YamlObjectSchemaValidatorBase {
  constructor(protected readonly schemaValidator: ISchemaValidatorWrapper) {
    super(schemaValidator, globalSettingsSchema);
  }
}
