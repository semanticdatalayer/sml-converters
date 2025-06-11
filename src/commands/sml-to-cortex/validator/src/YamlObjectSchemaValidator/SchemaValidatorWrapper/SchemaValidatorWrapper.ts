import ajvErrors from "ajv-errors";
import Ajv2020, { Options } from "ajv/dist/2020";
import Ajv, { AnySchemaObject, ValidateFunction } from "ajv/dist/core";
import { IParsedFile } from "models/src/IParsedFile";
import { IYamlObject } from "models/src/yaml/IYamlObject";
import Guard from "utils/Guard";

import YamlObjectSchemaError from "../YamlObjectSchemaError";
import { ISchemaValidatorWrapper } from "./ISchemaValidatorWrapper";
import { SchemaValidatorErrorFormatter } from "./SchemaValidatorErrorFormatter";

export class SchemaValidatorWrapper implements ISchemaValidatorWrapper {
  private ajv: Ajv;
  private compiledValidate: ValidateFunction | undefined;

  constructor(
    options: Options,
    private readonly errorFormatter: SchemaValidatorErrorFormatter = new SchemaValidatorErrorFormatter()
  ) {
    this.ajv = new Ajv2020(options);
    ajvErrors(this.ajv);
  }

  public compileSchema(schemaObj: AnySchemaObject) {
    const isSchemaExist = this.ajv.getSchema(schemaObj.$id as string);

    if (!isSchemaExist) {
      this.ajv.addMetaSchema(schemaObj);
    }

    this.compiledValidate = this.ajv.compile(schemaObj);
    return this;
  }

  public validate(parsedFile: IParsedFile) {
    this.compiledValidate = Guard.ensure(this.compiledValidate, "Add compile schema before validating");

    const isValid = this.compiledValidate(parsedFile.data);
    if (!isValid) {
      const ajvErrors = Guard.ensure(this.compiledValidate.errors, "AJV validation must contains errors");
      const smlErrors = this.errorFormatter.formatErrors(ajvErrors, parsedFile.data as IYamlObject);
      throw new YamlObjectSchemaError(smlErrors);
    }

    return this;
  }
}
