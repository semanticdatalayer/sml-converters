import {
  DEFAULT_LEVEL_ALIAS,
  DEFAULT_METRIC,
  DEFAULT_PARALLEL_PERIOD,
  DEFAULT_SECONDARY_ATTRIBUTE,
} from "models/builders/constants/YamlDimensionConstants";
import YamlDimensionBuilder from "models/src/builders/YamlObjectBuilders/YamlDimensionBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import dimensionSchema from "models/src/schemas/dimension.schema.json";
import { IYamlDimensionCalculationGroup } from "models/src/yaml/IYamlCalculationGroups";
import {
  IYamlDimension,
  IYamlDimensionHierarchy,
  IYamlDimensionLevel,
  IYamlDimensionLevelAttribute,
  IYamlDimensionType,
  IYamlSnowflakeRelationship,
  YamlDimensionRelationType,
} from "models/src/yaml/IYamlDimension";
import EnumUtil from "utils/enum.util";
import { ObjectInvalidSchemaGenerator } from "utils/ObjectInvalidSchemaGenerator";

import { IYamlObjectSchemaValidatorResponse } from "../IYamlObjectSchemaValidatorResponse";
import { SchemaValidatorWrapper } from "../SchemaValidatorWrapper/SchemaValidatorWrapper";
import YamlDimensionSchemaValidator from "./YamlDimensionSchemaValidator";

const getDimension = (dimension: Partial<IYamlDimension> = {}): IYamlParsedFile<IYamlDimension> => {
  return YamlDimensionBuilder.create().with(dimension).buildYamlFile();
};

const validateAML = (parsedFile: IYamlParsedFile<IYamlDimension>): IYamlObjectSchemaValidatorResponse => {
  const schemaValidator = new SchemaValidatorWrapper({ allErrors: true });
  return new YamlDimensionSchemaValidator(schemaValidator, dimensionSchema).validateAML(parsedFile);
};

describe("YamlDimensionSchemaValidator", () => {
  it("Should return true if the json is valid", () => {
    const parsedFile = getDimension({ object_type: ObjectType.Dimension });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(true);
    expect(result.errors?.length).toBe(0);
  });

  it("Should return false if object_type is not Dimension", () => {
    const parsedFile = getDimension({ object_type: ObjectType.Connection });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(false);
    expect(result.errors?.length).toBe(1);
  });

  describe("Attributes", () => {
    const defaultAttribute: IYamlDimensionLevelAttribute = {
      dataset: "no dataset",
      key_columns: [],
      label: "no name",
      unique_name: " no unique_name",
      name_column: "no name_column",
    };

    it("Should return true if all required props are valid", () => {
      const parsedFile = YamlDimensionBuilder.create().addAttribute({}).buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(true);
      expect(result.errors?.length).toBe(0);
    });

    ObjectInvalidSchemaGenerator.for(defaultAttribute)
      .generateCases()
      .forEach((testCase) => {
        it(`${testCase.condition} should be invalid`, () => {
          const parsedFile = YamlDimensionBuilder.create().addAttribute(testCase.data).buildYamlFile();
          const result = validateAML(parsedFile);

          expect(result.isValid).toBe(false);
          expect(result.errors?.length).toBe(1);
        });
      });
  });

  describe("Hierarchies", () => {
    const defaultHierarchy: IYamlDimensionHierarchy = {
      unique_name: "no unique name",
      label: "name",
      levels: [{ unique_name: "level name" }],
    };
    describe("DefaultMembers", () => {
      it("Should return false if default_member.expression is empty string", () => {
        const parsedFile = YamlDimensionBuilder.create()
          .addHierarchy({ default_member: { expression: "" } })
          .buildYamlFile();
        const result = validateAML(parsedFile);

        expect(result.isValid).toBe(false);
        expect(result.errors?.length).toBe(1);
      });

      it("Should return false if default_member missing expression property", () => {
        const parsedFile = YamlDimensionBuilder.create()
          .addHierarchy({
            default_member: {},
          } as unknown as Partial<IYamlDimensionHierarchy>)
          .buildYamlFile();
        const result = validateAML(parsedFile);

        expect(result.isValid).toBe(false);
        expect(result.errors?.length).toBe(1);
      });
    });
    it("Should return true if all required props are valid", () => {
      const parsedFile = YamlDimensionBuilder.create().addHierarchy({}).buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(true);
      expect(result.errors?.length).toBe(0);
    });

    it("Should return false, if filter_empty value is not correct", () => {
      const parsedFile = YamlDimensionBuilder.create()
        .addHierarchy({ filter_empty: "test123" } as unknown as Partial<IYamlDimensionHierarchy>)
        .buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(false);
      expect(result.errors?.length).toBe(1);
    });

    ObjectInvalidSchemaGenerator.for(defaultHierarchy)
      .generateCases()
      .forEach((testCase) => {
        it(`${testCase.condition} should be invalid`, () => {
          const parsedFile = YamlDimensionBuilder.create().addHierarchy(testCase.data).buildYamlFile();
          const result = validateAML(parsedFile);

          expect(result.isValid).toBe(false);
          expect(result.errors?.length).toBe(1);
        });
      });

    describe("Levels", () => {
      const defaultDimensionLevel: IYamlDimensionLevel = {
        unique_name: "level name",
      };

      ObjectInvalidSchemaGenerator.for(defaultDimensionLevel)
        .generateCases()
        .forEach((testCase) => {
          it(`${testCase.condition} should be invalid`, () => {
            const parsedFile = YamlDimensionBuilder.create()
              .addHierarchy({
                label: "hierarchy name",
                unique_name: "hierarchy unique name",
                levels: [...[testCase.data]],
              })
              .buildYamlFile();

            const result = validateAML(parsedFile);

            expect(result.isValid).toBe(false);
            expect(result.errors?.length).toBe(1);
          });
        });
      describe("Secondary Attribute", () => {
        it("Should return true if all required props are valid", () => {
          const parsedFile = YamlDimensionBuilder.create()
            .addHierarchy({})
            .addSecondaryAttribute({ key_columns: ["key_column"] })
            .buildYamlFile();
          const result = validateAML(parsedFile);

          expect(result.isValid).toBe(true);
          expect(result.errors?.length).toBe(0);
        });

        it("Should return error if key_columns are NOT defined", () => {
          const parsedFile = YamlDimensionBuilder.create()
            .addHierarchy({})
            .addSecondaryAttribute({ key_columns: undefined })
            .buildYamlFile();
          const result = validateAML(parsedFile);

          expect(result.isValid).toBe(false);
          expect(result.errors?.length).toBe(1);
        });

        ObjectInvalidSchemaGenerator.for(DEFAULT_SECONDARY_ATTRIBUTE)
          .generateCases()
          .forEach((testCase) => {
            it(`${testCase.condition} should be invalid`, () => {
              const parsedFile = YamlDimensionBuilder.create()
                .addHierarchy({})
                .addSecondaryAttribute({ ...testCase.data, key_columns: ["key_column"] })
                .buildYamlFile();
              const result = validateAML(parsedFile);

              expect(result.isValid).toBe(false);
              expect(result.errors?.length).toBe(1);
            });
          });
      });

      describe("Level Alias", () => {
        it("Should return true if all required props are valid", () => {
          const parsedFile = YamlDimensionBuilder.create().addHierarchy({}).addLevelAlias({}).buildYamlFile();
          const result = validateAML(parsedFile);

          expect(result.isValid).toBe(true);
          expect(result.errors?.length).toBe(0);
        });

        ObjectInvalidSchemaGenerator.for(DEFAULT_LEVEL_ALIAS)
          .generateCases()
          .forEach((testCase) => {
            it(`${testCase.condition} should be invalid`, () => {
              const parsedFile = YamlDimensionBuilder.create()
                .addHierarchy({})
                .addLevelAlias(testCase.data)
                .buildYamlFile();
              const result = validateAML(parsedFile);

              expect(result.isValid).toBe(false);
              expect(result.errors?.length).toBe(1);
            });
          });
      });

      describe("Metrics", () => {
        it("Should return true if all required props are valid", () => {
          const parsedFile = YamlDimensionBuilder.create().addHierarchy({}).addMetric({}).buildYamlFile();
          const result = validateAML(parsedFile);

          expect(result.isValid).toBe(true);
          expect(result.errors?.length).toBe(0);
        });

        ObjectInvalidSchemaGenerator.for(DEFAULT_METRIC)
          .generateCases()
          .forEach((testCase) => {
            it(`${testCase.condition} should be invalid`, () => {
              const parsedFile = YamlDimensionBuilder.create().addMetric(testCase.data).buildYamlFile();
              const result = validateAML(parsedFile);

              expect(result.isValid).toBe(false);
              expect(result.errors?.length).toBe(1);
            });
          });
      });

      describe("Parallel period", () => {
        it("Should return true if all required props are valid", () => {
          const parsedFile = YamlDimensionBuilder.create().addHierarchy({}).addParallelPeriod({}).buildYamlFile();
          const result = validateAML(parsedFile);

          expect(result.isValid).toBe(true);
          expect(result.errors?.length).toBe(0);
        });

        ObjectInvalidSchemaGenerator.for(DEFAULT_PARALLEL_PERIOD)
          .generateCases()
          .forEach((testCase) => {
            it(`${testCase.condition} should be invalid`, () => {
              const parsedFile = YamlDimensionBuilder.create().addParallelPeriod(testCase.data).buildYamlFile();
              const result = validateAML(parsedFile);

              expect(result.isValid).toBe(false);
              expect(result.errors?.length).toBe(1);
            });
          });
      });
    });
  });

  describe("Relationships", () => {
    const defaultRelationship: IYamlSnowflakeRelationship = {
      from: {
        dataset: "testDataset",
        join_columns: ["testJoinColumn"],
      },
      to: {
        level: "testAttr",
      },
      type: YamlDimensionRelationType.Snowflake,
    };

    it("Should return true if all required props are valid", () => {
      const parsedFile = YamlDimensionBuilder.create().addRelationship({}).buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(true);
      expect(result.errors?.length).toBe(0);
    });

    ObjectInvalidSchemaGenerator.for(defaultRelationship)
      .generateCases()
      .forEach((testCase) => {
        it(`${testCase.condition} should be invalid`, () => {
          const parsedFile = YamlDimensionBuilder.create().addRelationship(testCase.data).buildYamlFile();
          const result = validateAML(parsedFile);

          expect(result.isValid).toBe(false);
          expect(result.errors?.length).toBeGreaterThanOrEqual(1);
        });
      });

    it("Should return error if relation type is not YamlDimensionRelationType", () => {
      const parsedFile = YamlDimensionBuilder.create()
        .addRelationship({ type: "invalid" as YamlDimensionRelationType })
        .buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(false);
      expect(result.errors?.length).toBe(1);
    });

    EnumUtil.getAllValues(YamlDimensionRelationType).forEach((t) => {
      it(`Should return NO error if relation type is "${t}"`, () => {
        const parsedFile = YamlDimensionBuilder.create()
          .addRelationship({ type: t as YamlDimensionRelationType })
          .buildYamlFile();
        const result = validateAML(parsedFile);

        expect(result.isValid).toBe(true);
        expect(result.errors?.length).toBe(0);
      });
    });

    describe("Left", () => {
      ObjectInvalidSchemaGenerator.for(defaultRelationship.from)
        .generateCases()
        .forEach((testCase) => {
          it(`${testCase.condition} should be invalid`, () => {
            const parsedFile = YamlDimensionBuilder.create()
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
            const parsedFile = YamlDimensionBuilder.create()
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

  describe("calculation_groups", () => {
    const defaultCalculationGroup: IYamlDimensionCalculationGroup = {
      calculated_members: [
        {
          expression: "no expression",
          unique_name: "no name",
        },
      ],
      unique_name: "no name",
      label: "no label",
    };

    it("Should return true if all required props are valid", () => {
      const parsedFile = YamlDimensionBuilder.create().addCalculationGroup().buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(true);
      expect(result.errors?.length).toBe(0);
    });

    ObjectInvalidSchemaGenerator.for(defaultCalculationGroup)
      .generateCases()
      .forEach((testCase) => {
        it(`${testCase.condition} should be invalid`, () => {
          const parsedFile = YamlDimensionBuilder.create().addCalculationGroup(testCase.data).buildYamlFile();
          const result = validateAML(parsedFile);

          expect(result.isValid).toBe(false);
          expect(result.errors?.length).toBe(1);
        });
      });

    describe("calculated_members", () => {
      ObjectInvalidSchemaGenerator.for(defaultCalculationGroup.calculated_members[0])
        .generateCases()
        .forEach((testCase) => {
          it(`${testCase.condition} should be invalid`, () => {
            const parsedFile = YamlDimensionBuilder.create()
              .addCalcGroupAndCalculatedMembers([
                {
                  ...testCase.data,
                },
              ])
              .buildYamlFile();
            const result = validateAML(parsedFile);

            expect(result.isValid).toBe(false);
            expect(result.errors?.length).toBe(1);
          });
        });
    });
  });

  describe("type", () => {
    it("Should not return error if type is valid", () => {
      const parsedFile = YamlDimensionBuilder.create().with({ type: IYamlDimensionType.Time }).buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(true);
    });

    it("Should return an error if type is invalid", () => {
      const parsedFile = YamlDimensionBuilder.create()
        .with({ type: "invalid" as IYamlDimensionType })
        .buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(false);
    });
  });

  it("Should return true if type is valid", () => {
    const parsedFile = getDimension({
      type: IYamlDimensionType.Time,
    });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(true);
    expect(result.errors?.length).toBe(0);
  });

  ObjectInvalidSchemaGenerator.for(YamlDimensionBuilder.create().build())
    .generateCases()
    .forEach((testCase) => {
      it(`${testCase.condition} should be invalid`, () => {
        const parsedFile = getDimension(testCase.data);
        const result = validateAML(parsedFile);

        expect(result.isValid).toBe(false);
        expect(result.errors?.length).toBe(1);
      });
    });
});
