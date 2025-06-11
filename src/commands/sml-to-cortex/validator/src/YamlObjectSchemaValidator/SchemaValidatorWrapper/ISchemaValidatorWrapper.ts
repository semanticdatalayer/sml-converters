import { IParsedFile } from "models/src/IParsedFile";

export interface ISchemaObject {
  id?: string;
  $id?: string;
  $schema?: string;
}

export interface ISchemaValidatorWrapper {
  compileSchema(schemaObj: ISchemaObject): ISchemaValidatorWrapper;
  validate(parsedFile: IParsedFile): ISchemaValidatorWrapper;
}
