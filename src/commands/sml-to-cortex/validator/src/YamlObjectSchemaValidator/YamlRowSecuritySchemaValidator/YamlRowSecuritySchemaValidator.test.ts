import YamlRowSecurityBuilder from "models/src/builders/YamlObjectBuilders/YamlRowSecurityBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import rowSecurity from "models/src/schemas/rowSecurity.schema.json";
import { IYamlRowSecurity } from "models/src/yaml/IYamlRowSecurity";
import { ObjectInvalidSchemaGenerator } from "utils/ObjectInvalidSchemaGenerator";

import { IYamlObjectSchemaValidatorResponse } from "../IYamlObjectSchemaValidatorResponse";
import { SchemaValidatorWrapper } from "../SchemaValidatorWrapper/SchemaValidatorWrapper";
import YamlRowSecuritySchemaValidator from "./YamlRowSecuritySchemaValidator";

const getRowSecurity = (rowSecurity: Partial<IYamlRowSecurity> = {}): IYamlParsedFile<IYamlRowSecurity> => {
  return YamlRowSecurityBuilder.create().with(rowSecurity).buildYamlFile();
};

const validateSML = (parsedFile: IYamlParsedFile<IYamlRowSecurity>): IYamlObjectSchemaValidatorResponse => {
  const schemaValidator = new SchemaValidatorWrapper({ allErrors: true });
  return new YamlRowSecuritySchemaValidator(schemaValidator, rowSecurity).validateAML(parsedFile);
};

describe("YamlRowSecuritySchemaValidator", () => {
  it("Should return true if the json is valid", () => {
    const parsedFile = getRowSecurity({ object_type: ObjectType.RowSecurity });
    const result = validateSML(parsedFile);

    expect(result.isValid).toBe(true);
    expect(result.errors?.length).toBe(0);
  });

  it("Should return false if object_type is not ObjectType.RowSecurity", () => {
    const parsedFile = getRowSecurity({ object_type: ObjectType.Measure });
    const result = validateSML(parsedFile);

    expect(result.isValid).toBe(false);
    expect(result.errors?.length).toBe(1);
  });

  ObjectInvalidSchemaGenerator.for(YamlRowSecurityBuilder.create().build())
    .generateCases()
    .forEach((testCase) => {
      it(`${testCase.condition} should be invalid`, () => {
        const parsedFile = getRowSecurity(testCase.data);
        const result = validateSML(parsedFile);

        expect(result.isValid).toBe(false);
        expect(result.errors?.length).toBe(1);
      });
    });
});
