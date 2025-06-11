import YamlConnectionBuilder from "models/src/builders/YamlObjectBuilders/YamlConnectionBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import connectionSchema from "models/src/schemas/connection.schema.json";
import { IYamlConnection } from "models/src/yaml/IYamlConnection";
import { ObjectInvalidSchemaGenerator } from "utils/ObjectInvalidSchemaGenerator";

import { IYamlObjectSchemaValidatorResponse } from "../IYamlObjectSchemaValidatorResponse";
import { SchemaValidatorWrapper } from "../SchemaValidatorWrapper/SchemaValidatorWrapper";
import YamlConnectionSchemaValidator from "./YamlConnectionSchemaValidator";

const getConnection = (connection: Partial<IYamlConnection> = {}): IYamlParsedFile<IYamlConnection> => {
  return YamlConnectionBuilder.create().with(connection).buildYamlFile();
};

const validateAML = (parsedFile: IYamlParsedFile<IYamlConnection>): IYamlObjectSchemaValidatorResponse => {
  const schemaValidator = new SchemaValidatorWrapper({ allErrors: true });

  return new YamlConnectionSchemaValidator(schemaValidator, connectionSchema).validateAML(parsedFile);
};

describe("YamlConnectionSchemaValidator", () => {
  it("Should return true if the json is valid", () => {
    const parsedFile = getConnection({ object_type: ObjectType.Connection });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(true);
    expect(result.errors?.length).toBe(0);
  });

  it("Should return false if object_type is not Connection", () => {
    const parsedFile = getConnection({ object_type: ObjectType.Dataset });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(false);
    expect(result.errors?.length).toBe(1);
  });

  ObjectInvalidSchemaGenerator.for(YamlConnectionBuilder.create().build())
    .generateCases()
    .forEach((testCase) => {
      it(`${testCase.condition} should be invalid`, () => {
        const parsedFile = getConnection(testCase.data);
        const result = validateAML(parsedFile);

        expect(result.isValid).toBe(false);
        expect(result.errors?.length).toBe(1);
      });
    });
});
