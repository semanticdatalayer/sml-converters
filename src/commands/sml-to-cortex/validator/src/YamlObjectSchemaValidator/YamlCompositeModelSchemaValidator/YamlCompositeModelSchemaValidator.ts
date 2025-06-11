import compositeModelSchema from "models/src/schemas/compositeModel.schema.json";

import { ISchemaValidatorWrapper } from "../SchemaValidatorWrapper/ISchemaValidatorWrapper";
import YamlObjectSchemaValidatorBase from "../YamlObjectSchemaValidatorBase";

export default class YamlCompositeModelSchemaValidator extends YamlObjectSchemaValidatorBase {
  constructor(protected readonly schemaValidator: ISchemaValidatorWrapper) {
    super(schemaValidator, compositeModelSchema);
  }
}
