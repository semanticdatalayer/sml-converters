import YamlMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlMeasureBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import measureSchema from "models/src/schemas/measure.schema.json";
import { IYamlMeasure, IYamlMeasureSemiAdditive } from "models/src/yaml/IYamlMeasure";
import { ObjectInvalidSchemaGenerator } from "utils/ObjectInvalidSchemaGenerator";

import { IYamlObjectSchemaValidatorResponse } from "../IYamlObjectSchemaValidatorResponse";
import { SchemaValidatorWrapper } from "../SchemaValidatorWrapper/SchemaValidatorWrapper";
import YamlMeasureSchemaValidator, { yamlMeasureSchemaErrors } from "./YamlMeasureSchemaValidator";

const getMeasure = (measure: Partial<IYamlMeasure> = {}): IYamlParsedFile<IYamlMeasure> => {
  return YamlMeasureBuilder.create().with(measure).buildYamlFile();
};

const validateAML = (parsedFile: IYamlParsedFile<IYamlMeasure>): IYamlObjectSchemaValidatorResponse => {
  const schemaValidator = new SchemaValidatorWrapper({ allErrors: true });
  return new YamlMeasureSchemaValidator(schemaValidator, measureSchema).validateAML(parsedFile);
};

describe("YamlMeasureSchemaValidator", () => {
  it("Should return true if the json is valid", () => {
    const parsedFile = getMeasure({ object_type: ObjectType.Measure });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(true);
    expect(result.errors?.length).toBe(0);
  });

  it("Should return false if object_type is not Measure", () => {
    const parsedFile = getMeasure({ object_type: ObjectType.Connection });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(false);
    expect(result.errors?.length).toBe(1);
  });

  ObjectInvalidSchemaGenerator.for(YamlMeasureBuilder.create().build())
    .generateCases()
    .forEach((testCase) => {
      it(`${testCase.condition} should be invalid`, () => {
        const parsedFile = getMeasure(testCase.data);
        const result = validateAML(parsedFile);

        expect(result.isValid).toBe(false);
        expect(result.errors?.length).toBe(1);
      });
    });

  describe("SemiAdditive", () => {
    const defaultSemiAdditive: IYamlMeasureSemiAdditive = {
      position: "string",
    };

    it("Should return true if all required props are valid", () => {
      const parsedFile = YamlMeasureBuilder.create().addSemiAdditive({}).buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(true);
      expect(result.errors?.length).toBe(0);
    });

    it("Should return false if neither degenerate dimensions nor relationships are set", async () => {
      const parsedFile = YamlMeasureBuilder.create()
        .with({
          semi_additive: {
            position: "first",
          },
        })
        .buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(false);
      expect(result.errors?.length).toBe(1);
      expect(result.errors[0]).toBe(
        "semi_additive There should be at least one attribute in the semi-additive. Please define either 'relationships' or 'degenerate_dimensions'."
      );
    });

    it("Should return true if degenerate dimensions is set and relationships is not", async () => {
      const parsedFile = YamlMeasureBuilder.create()
        .with({
          semi_additive: {
            position: "first",
            degenerate_dimensions: [{ name: "dim_1", level: "level_1" }],
          },
        })
        .buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(true);
      expect(result.errors?.length).toBe(0);
    });

    it("Should return false if relationships are set and degenerate dimensions are not", async () => {
      const parsedFile = YamlMeasureBuilder.create()
        .with({
          semi_additive: {
            position: "first",
            relationships: ["relationship_1"],
          },
        })
        .buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(true);
      expect(result.errors?.length).toBe(0);
    });

    it("Should return false if legacy schema containing dimension, level or hierarchy is found", async () => {
      const parsedFile = YamlMeasureBuilder.create()
        .with({
          semi_additive: {
            position: "first",
            dimension: "test_dimension",
            hierarchy: "test_hierarchy",
            level: "test_level",
          } as IYamlMeasureSemiAdditive & { dimension: string; level: string; hierarchy: string },
        })
        .buildYamlFile();

      const result = validateAML(parsedFile);

      console.log(result.errors);

      expect(result.isValid).toBe(false);
      expect(result.errors?.length).toBe(1);
      expect(result.errors).toContain(yamlMeasureSchemaErrors.legacySchemaNotAllowed());
    });

    ObjectInvalidSchemaGenerator.for(defaultSemiAdditive)
      .generateCases()
      .forEach((testCase) => {
        it(`${testCase.condition} should be invalid`, () => {
          const parsedFile = YamlMeasureBuilder.create().addSemiAdditive(testCase.data).buildYamlFile();
          const result = validateAML(parsedFile);

          expect(result.isValid).toBe(false);
          expect(result.errors?.length).toBe(1);
        });
      });
  });
});
