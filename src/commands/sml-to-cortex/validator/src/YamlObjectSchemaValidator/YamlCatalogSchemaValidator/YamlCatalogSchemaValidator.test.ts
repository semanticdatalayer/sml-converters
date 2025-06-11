import YamlCatalogBuilder from "models/src/builders/YamlObjectBuilders/YamlCatalogBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import catalogSchema from "models/src/schemas/catalog.schema.json";
import { IYamlCatalog } from "models/src/yaml/IYamlCatalog";
import { ObjectInvalidSchemaGenerator } from "utils/ObjectInvalidSchemaGenerator";

import { IYamlObjectSchemaValidatorResponse } from "../IYamlObjectSchemaValidatorResponse";
import { SchemaValidatorWrapper } from "../SchemaValidatorWrapper/SchemaValidatorWrapper";
import YamlCatalogSchemaValidator from "./YamlCatalogSchemaValidator";

const getCatalogSettings = (catalog: Partial<IYamlCatalog> = {}): IYamlParsedFile<IYamlCatalog> => {
  return YamlCatalogBuilder.create().with(catalog).buildYamlFile();
};

const validateAML = (parsedFile: IYamlParsedFile<IYamlCatalog>): IYamlObjectSchemaValidatorResponse => {
  const schemaValidator = new SchemaValidatorWrapper({ allErrors: true });

  return new YamlCatalogSchemaValidator(schemaValidator, catalogSchema).validateAML(parsedFile);
};

describe("YamlCatalogSchemaValidator", () => {
  it("Should return true if the json is valid", () => {
    const parsedFile = getCatalogSettings({ object_type: ObjectType.Catalog });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(true);
    expect(result.errors?.length).toBe(0);
  });

  it(`Should return false if object_type is not ${ObjectType.Catalog}`, () => {
    const parsedFile = getCatalogSettings({ object_type: ObjectType.Dataset });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(false);
    expect(result.errors?.length).toBe(1);
  });

  ObjectInvalidSchemaGenerator.for(YamlCatalogBuilder.create().build())
    .generateCases()
    .forEach((testCase) => {
      it(`${testCase.condition} should be invalid`, () => {
        const parsedFile = getCatalogSettings(testCase.data);
        const result = validateAML(parsedFile);

        expect(result.isValid).toBe(false);
        expect(result.errors?.length).toBe(1);
      });
    });
});
