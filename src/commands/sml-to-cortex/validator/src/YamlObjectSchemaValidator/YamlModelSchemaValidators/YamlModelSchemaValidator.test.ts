import YamlModelBuilder from "models/src/builders/YamlObjectBuilders/YamlModelBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import modelSchema from "models/src/schemas/model.schema.json";
import {
  IYamlModel,
  IYamlModelAggregate,
  IYamlModelDrillThrough,
  IYamlModelOverride,
  IYamlModelPartition,
  IYamlModelPerspective,
  IYamlModelRelationship,
  PartitionType,
} from "models/src/yaml/IYamlModel";
import { ObjectInvalidSchemaGenerator } from "utils/ObjectInvalidSchemaGenerator";

import { IYamlObjectSchemaValidatorResponse } from "../IYamlObjectSchemaValidatorResponse";
import { SchemaValidatorWrapper } from "../SchemaValidatorWrapper/SchemaValidatorWrapper";
import YamlModelSchemaValidator from "./YamlModelSchemaValidator";

const getModel = (model: Partial<IYamlModel> = {}): IYamlParsedFile<IYamlModel> => {
  return YamlModelBuilder.create().with(model).buildYamlFile();
};

const builder = YamlModelBuilder.create().addMetric("customer_count");

const validateAML = (parsedFile: IYamlParsedFile<IYamlModel>): IYamlObjectSchemaValidatorResponse => {
  const schemaValidator = new SchemaValidatorWrapper({ allErrors: true });
  return new YamlModelSchemaValidator(schemaValidator, modelSchema).validateAML(parsedFile);
};

const arrayWithUndefined: string[] = [undefined as unknown as string];

describe("YamlModelSchemaValidator", () => {
  it("Should return true if the json is valid", () => {
    const parsedFile = builder.buildYamlFile();
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(true);
    expect(result.errors?.length).toBe(0);
  });

  it("Should return false if object_type is not Model", () => {
    const parsedFile = builder.with({ object_type: ObjectType.Connection }).buildYamlFile();
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(false);
    expect(result.errors?.length).toBe(1);
  });

  describe("Relationships", () => {
    const defaultRelationship: IYamlModelRelationship = {
      unique_name: "default relationship unique name",
      from: {
        dataset: "testDataset",
        join_columns: ["testJoinColumn"],
      },
      to: {
        dimension: "testDim",
        level: "testAttr",
      },
    };

    it("Should return true if all required props are valid", () => {
      const parsedFile = builder.addRelationship({}).buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(true);
      expect(result.errors?.length).toBe(0);
    });

    ObjectInvalidSchemaGenerator.for(defaultRelationship)
      .generateCases()
      .forEach((testCase) => {
        it(`${testCase.condition} should be invalid`, () => {
          const parsedFile = builder.addRelationship(testCase.data).buildYamlFile();
          const result = validateAML(parsedFile);

          expect(result.isValid).toBe(false);
          expect(result.errors?.length).toBeGreaterThanOrEqual(1);
        });
      });

    describe("Left", () => {
      ObjectInvalidSchemaGenerator.for(defaultRelationship.from)
        .generateCases()
        .forEach((testCase) => {
          it(`${testCase.condition} should be invalid`, () => {
            const parsedFile = builder
              .addRelationship({
                from: { ...testCase.data },
                to: {
                  ...defaultRelationship.to,
                },
              })
              .buildYamlFile();
            const result = validateAML(parsedFile);

            expect(result.isValid).toBe(false);
            expect(result.errors?.length).toBe(1);
          });
        });
    });

    describe("Right", () => {
      ObjectInvalidSchemaGenerator.for(defaultRelationship.to)
        .generateCases()
        .forEach((testCase) => {
          it(`${testCase.condition} should be invalid`, () => {
            const parsedFile = builder
              .addRelationship({
                from: { ...defaultRelationship.from },
                to: {
                  ...testCase.data,
                },
              })
              .buildYamlFile();
            const result = validateAML(parsedFile);

            expect(result.isValid).toBe(false);
            expect(result.errors?.length).toBeGreaterThanOrEqual(1);
          });
        });
    });
  });

  it("Should return true if dimensions are valid", () => {
    const parsedFile = builder.addDegenerateDimension("dim1").addDegenerateDimension("dim2").buildYamlFile();
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(true);
    expect(result.errors?.length).toBe(0);
  });

  it("Should return an error if degenerate dimensions are not unique items", () => {
    const parsedFile = builder
      .addDegenerateDimension("dim1")
      .addDegenerateDimension("dim1")
      .addDegenerateDimension("dim2")
      .buildYamlFile();
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(false);
    expect(result.errors?.length).toBe(1);
  });

  it("Should return true if metrics are valid", () => {
    const parsedFile = builder.addMetric("metric1").addMetric("metric2").buildYamlFile();
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(true);
    expect(result.errors?.length).toBe(0);
  });

  describe("Partitions", () => {
    const defaultPartitionValues: IYamlModelPartition = {
      unique_name: "name",
      dimension: "dim",
      attribute: "attr",
      type: PartitionType.name,
    };

    it("Should return true if all required props are valid", () => {
      const parsedFile = builder.addPartition({}).buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(true);
      expect(result.errors?.length).toBe(0);
    });

    ObjectInvalidSchemaGenerator.for(defaultPartitionValues)
      .generateCases()
      .forEach((testCase) => {
        it(`${testCase.condition} should be invalid`, () => {
          const parsedFile = builder.addPartition(testCase.data).buildYamlFile();
          const result = validateAML(parsedFile);

          expect(result.isValid).toBe(false);
          expect(result.errors?.length).toBe(1);
        });
      });
  });

  describe("Perspectives", () => {
    const defaultPerspective: IYamlModelPerspective = {
      unique_name: "no uniqueName",
    };

    it("Should return true if all required props are valid", () => {
      const parsedFile = builder.addPerspective({}).buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(true);
      expect(result.errors?.length).toBe(0);
    });

    ObjectInvalidSchemaGenerator.for(defaultPerspective)
      .generateCases()
      .forEach((testCase) => {
        it(`${testCase.condition} should be invalid`, () => {
          const parsedFile = builder.addPerspective(testCase.data).buildYamlFile();
          const result = validateAML(parsedFile);

          expect(result.isValid).toBe(false);
          expect(result.errors?.length).toBe(1);
        });
      });

    it("Measures return false if array elements are invalid", () => {
      const parsedFile = builder.addPerspective({ metrics: arrayWithUndefined }).buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(false);
      expect(result.errors?.length).toBe(1);
    });
  });

  describe("Drillthroughs", () => {
    const defaultDrillthrough: IYamlModelDrillThrough = {
      metrics: ["metric"],
      unique_name: "no uniqueName",
    };

    it("Should return true if all required props are valid", () => {
      const parsedFile = builder.addDrillthrough().buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(true);
      expect(result.errors?.length).toBe(0);
    });

    ObjectInvalidSchemaGenerator.for(defaultDrillthrough)
      .generateCases()
      .forEach((testCase) => {
        it(`${testCase.condition} should be invalid`, () => {
          const parsedFile = builder.addDrillthrough(testCase.data).buildYamlFile();
          const result = validateAML(parsedFile);

          expect(result.isValid).toBe(false);
          expect(result.errors?.length).toBe(1);
        });
      });

    describe("Metrics", () => {
      it("Prefixes return false if array elements are invalid", () => {
        const parsedFile = builder
          .addDrillthrough({
            metrics: arrayWithUndefined,
          })
          .buildYamlFile();
        const result = validateAML(parsedFile);

        expect(result.isValid).toBe(false);
        expect(result.errors?.length).toBe(1);
      });
    });
  });

  describe("Aggregates", () => {
    const defaultAggregate: IYamlModelAggregate = {
      label: "perspective name",
      unique_name: "no uniqueName",
    };

    it("Should return true if all required props are valid", () => {
      const parsedFile = builder.addAggregate({}).buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(true);
      expect(result.errors?.length).toBe(0);
    });

    ObjectInvalidSchemaGenerator.for(defaultAggregate)
      .generateCases()
      .forEach((testCase) => {
        it(`${testCase.condition} should be invalid`, () => {
          const parsedFile = builder.addAggregate(testCase.data).buildYamlFile();
          const result = validateAML(parsedFile);

          expect(result.isValid).toBe(false);
          expect(result.errors?.length).toBe(1);
        });
      });

    describe("Attributes", () => {
      const attributes = [{ name: "dim name", dimension: "dim" }];
      ObjectInvalidSchemaGenerator.for(attributes[0])
        .generateCases()
        .forEach((testCase) => {
          it(`${testCase.condition} should be invalid`, () => {
            const parsedFile = builder
              .addAggregate({
                attributes: [{ ...testCase.data }],
              })
              .buildYamlFile();
            const result = validateAML(parsedFile);

            expect(result.isValid).toBe(false);
            expect(result.errors?.length).toBe(1);
          });
        });

      it("Relationship paths return false if array elements are invalid", () => {
        const parsedFile = builder
          .addAggregate({
            attributes: [
              {
                ...attributes[0],
                relationships_path: arrayWithUndefined,
              },
            ],
          })
          .buildYamlFile();
        const result = validateAML(parsedFile);

        expect(result.isValid).toBe(false);
        expect(result.errors?.length).toBe(1);
      });
    });

    it("Metrics return false if array elements are invalid", () => {
      const parsedFile = builder
        .addAggregate({
          ...defaultAggregate,
          metrics: arrayWithUndefined,
        })
        .buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(false);
      expect(result.errors?.length).toBe(1);
    });
  });

  ObjectInvalidSchemaGenerator.for(builder.build())
    .generateCases()
    .forEach((testCase) => {
      it(`${testCase.condition} should be invalid`, () => {
        const parsedFile = YamlModelBuilder.create().with(testCase.data).buildYamlFile();
        const result = validateAML(parsedFile);

        expect(result.isValid).toBe(false);
        expect(result.errors?.length).toBe(1);
      });
    });

  it(`When metrics is empty array should be invalid`, () => {
    const parsedFile = getModel();
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(false);
    expect(result.errors?.length).toBe(1);
  });
});

describe("Overrides", () => {
  it("Should be valid if overrides prop has one random key and query_name has length", () => {
    const overrides: IYamlModelOverride = {
      randomKey: { query_name: "t" },
    };

    const parsedFile = builder.withOverrides(overrides).buildYamlFile();
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(true);
    expect(result.errors?.length).toBe(0);
  });

  it("Should be valid if overrides prop has more than one random key and query_name has length", () => {
    const overrides: IYamlModelOverride = {
      randomKey1: { query_name: "test1" },
      randomKey2: { query_name: "test2" },
    };

    const parsedFile = builder.withOverrides(overrides).buildYamlFile();
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(true);
    expect(result.errors?.length).toBe(0);
  });

  it("Should NOT be valid if query_name is empty string", () => {
    const overrides: IYamlModelOverride = {
      randomKey: { query_name: "" },
    };

    const parsedFile = builder.withOverrides(overrides).buildYamlFile();
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(1);
  });

  it("Should NOT be valid if query_name is not defined", () => {
    const overrides = { randomKey: {} } as unknown as IYamlModelOverride;

    const parsedFile = builder.withOverrides(overrides).buildYamlFile();
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(1);
  });
});
