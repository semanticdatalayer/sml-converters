import { ISchemaObject, ISchemaValidatorWrapper } from "../SchemaValidatorWrapper/ISchemaValidatorWrapper";
import YamlObjectSchemaValidatorBase from "../YamlObjectSchemaValidatorBase";

export default class YamlCatalogSchemaValidator extends YamlObjectSchemaValidatorBase {
  constructor(
    protected readonly schemaValidator: ISchemaValidatorWrapper,
    protected readonly jsonSchema: ISchemaObject
  ) {
    super(schemaValidator, jsonSchema);
  }
}
