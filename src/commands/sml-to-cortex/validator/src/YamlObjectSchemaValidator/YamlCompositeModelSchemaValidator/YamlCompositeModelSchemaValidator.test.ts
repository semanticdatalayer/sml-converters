import YamlCompositeModelBuilder from "models/src/builders/YamlObjectBuilders/YamlCompositeModelBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import { IYamlCompositeModel } from "models/src/yaml/IYamlCompositeModel";
import { ObjectInvalidSchemaGenerator } from "utils/ObjectInvalidSchemaGenerator";

import { IYamlObjectSchemaValidatorResponse } from "../IYamlObjectSchemaValidatorResponse";
import { SchemaValidatorWrapper } from "../SchemaValidatorWrapper/SchemaValidatorWrapper";
import YamlCompositeModelSchemaValidator from "./YamlCompositeModelSchemaValidator";

const getCompositeModel = (model: Partial<IYamlCompositeModel> = {}): IYamlParsedFile<IYamlCompositeModel> => {
  return YamlCompositeModelBuilder.create().with(model).buildYamlFile();
};

const validateAML = (parsedFile: IYamlParsedFile<IYamlCompositeModel>): IYamlObjectSchemaValidatorResponse => {
  const schemaValidator = new SchemaValidatorWrapper({ allErrors: true });
  return new YamlCompositeModelSchemaValidator(schemaValidator).validateAML(parsedFile);
};

describe("YamlCompositeModelSchemaValidator", () => {
  it("Should return true if the json is valid", () => {
    const parsedFile = getCompositeModel({ object_type: ObjectType.CompositeModel, models: ["model1"] });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(true);
    expect(result.errors?.length).toBe(0);
  });

  it("Should return false if object_type is not Model", () => {
    const parsedFile = getCompositeModel({ object_type: ObjectType.Connection, models: ["model1"] });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(false);
    expect(result.errors?.length).toBe(1);
  });

  it("Should return true if models are valid", () => {
    const parsedFile = YamlCompositeModelBuilder.create().addModel("model1").addModel("model2").buildYamlFile();
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(true);
    expect(result.errors?.length).toBe(0);
  });

  it("Should return an error if models are empy list", () => {
    const parsedFile = YamlCompositeModelBuilder.create().with({ models: [] }).buildYamlFile();
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(false);
    expect(result.errors?.length).toBe(1);
  });

  it("Should return an error if models are not unique items", () => {
    const parsedFile = YamlCompositeModelBuilder.create()
      .addModel("model1")
      .addModel("model1")
      .addModel("model2")
      .buildYamlFile();
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(false);
    expect(result.errors?.length).toBe(1);
  });

  it("Should return true if metrics are valid", () => {
    const parsedFile = YamlCompositeModelBuilder.create()
      .addModel("model1")
      .addMetric("metric1")
      .addMetric("metric2")
      .buildYamlFile();
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(true);
    expect(result.errors?.length).toBe(0);
  });

  ObjectInvalidSchemaGenerator.for(YamlCompositeModelBuilder.create().addModel("model1").build())
    .generateCases()
    .forEach((testCase) => {
      it(`${testCase.condition} should be invalid`, () => {
        const parsedFile = getCompositeModel(testCase.data);
        const result = validateAML(parsedFile);

        expect(result.isValid).toBe(false);
        expect(result.errors?.length).toBe(1);
      });
    });
});
