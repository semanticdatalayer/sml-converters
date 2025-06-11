import { YamlModelSettingsBuilder } from "models/src/builders/YamlObjectBuilders/YamlModelSettingsBuilder";
import { IParsedFile } from "models/src/IParsedFile";
import { ObjectType } from "models/src/ObjectType";
import { ISetting, IYamlModelSettings } from "models/src/yaml/IYamlModelSettings";

import { IYamlObjectSchemaValidatorResponse } from "../IYamlObjectSchemaValidatorResponse";
import { SchemaValidatorWrapper } from "../SchemaValidatorWrapper/SchemaValidatorWrapper";
import YamlModelSettingsSchemaValidator from "./YamlModelSettingsSchemaValidator";

const getModelSettings = (modelSettings: Partial<IYamlModelSettings> = {}): IParsedFile<IYamlModelSettings> => {
  return YamlModelSettingsBuilder.create().with(modelSettings).buildYamlFile();
};

const validateAML = (parsedFile: IParsedFile<IYamlModelSettings>): IYamlObjectSchemaValidatorResponse => {
  const schemaValidator = new SchemaValidatorWrapper({ allErrors: true });
  return new YamlModelSettingsSchemaValidator(schemaValidator).validateAML(parsedFile);
};

describe("YamlModelSettingsSchemaValidator", () => {
  it("Should return true if the json is valid and overrides is undefined", () => {
    const parsedFile = getModelSettings({ object_type: ObjectType.ModelSettings });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(true);
    expect(result.errors?.length).toBe(0);
  });

  it("Should return true if the json is valid and is valid and overrides is an object", () => {
    const parsedFile = getModelSettings({
      object_type: ObjectType.ModelSettings,
      overrides: {
        model1: {
          "query.factless.ignoreIncidentalFilter": "string",
          "query.factless.useIncidentalFacts": 8,
          "AGGREGATES.CREATE.JOINS.ENABLED": true,
        },
      },
    });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(true);
    expect(result.errors?.length).toBe(0);
  });

  it("Should return false if the json is invalid object type", () => {
    const parsedFile = getModelSettings({ object_type: ObjectType.Dataset });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(false);
    expect(result.errors?.length).toBe(1);
  });

  it("Should return false overrides has invalid property", () => {
    const parsedFile = getModelSettings({
      object_type: ObjectType.ModelSettings,
      overrides: {
        model1: "string" as unknown as ISetting,
      },
    });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(false);
    expect(result.errors?.length).toBe(1);
  });

  it("Should return false overrides.model1 has invalid property", () => {
    const parsedFile = getModelSettings({
      object_type: ObjectType.ModelSettings,
      overrides: {
        model1: {
          "query.factless.ignoreIncidentalFilter": "string",
          "query.factless.useIncidentalFacts": 8,
          "AGGREGATES.CREATE.JOINS.ENABLED": {} as string,
        },
      },
    });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(false);
    expect(result.errors?.length).toBe(1);
  });
});
