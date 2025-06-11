import YamlCalculatedMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlCalculatedMeasureBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import measureCalcSchema from "models/src/schemas/measureCalc.schema.json";
import { IYamlMeasureCalculated } from "models/src/yaml/IYamlMeasure";
import { ObjectInvalidSchemaGenerator } from "utils/ObjectInvalidSchemaGenerator";

import { IYamlObjectSchemaValidatorResponse } from "../IYamlObjectSchemaValidatorResponse";
import { SchemaValidatorWrapper } from "../SchemaValidatorWrapper/SchemaValidatorWrapper";
import YamlMeasureCalcSchemaValidator from "./YamlMeasureSchemaValidator";

const getMeasure = (measureCalc: Partial<IYamlMeasureCalculated> = {}): IYamlParsedFile<IYamlMeasureCalculated> => {
  return YamlCalculatedMeasureBuilder.create().with(measureCalc).buildYamlFile();
};

const validateAML = (parsedFile: IYamlParsedFile<IYamlMeasureCalculated>): IYamlObjectSchemaValidatorResponse => {
  const schemaValidator = new SchemaValidatorWrapper({ allErrors: true });
  return new YamlMeasureCalcSchemaValidator(schemaValidator, measureCalcSchema).validateAML(parsedFile);
};

describe("YamlMeasureCalcSchemaValidator", () => {
  it("Should return true if the json is valid", () => {
    const parsedFile = getMeasure({ object_type: ObjectType.MeasureCalc });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(true);
    expect(result.errors?.length).toBe(0);
  });

  it("Should return false if object_type is not MeasureCalc", () => {
    const parsedFile = getMeasure({ object_type: ObjectType.Measure });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(false);
    expect(result.errors?.length).toBe(1);
  });

  ObjectInvalidSchemaGenerator.for(YamlCalculatedMeasureBuilder.create().build())
    .generateCases()
    .forEach((testCase) => {
      it(`${testCase.condition} should be invalid`, () => {
        const parsedFile = getMeasure(testCase.data);
        const result = validateAML(parsedFile);

        expect(result.isValid).toBe(false);
        expect(result.errors?.length).toBe(1);
      });
    });
});
