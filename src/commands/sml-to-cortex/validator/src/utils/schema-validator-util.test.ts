import YamlDimensionBuilder from "models/src/builders/YamlObjectBuilders/YamlDimensionBuilder";
import { YamlDimensionRelationBuilder } from "models/src/builders/YamlObjectBuilders/YamlDimensionRelationBuilder";
import YamlModelBuilder from "models/src/builders/YamlObjectBuilders/YamlModelBuilder";
import YamlModelRelationBuilder from "models/src/builders/YamlObjectBuilders/YamlModelRelationBuilder";
import { IParsedFile } from "models/src/IParsedFile";
import { ObjectType } from "models/src/ObjectType";
import { IYamlDimension, IYamlDimensionRelationship } from "models/src/yaml/IYamlDimension";
import { IYamlModel, IYamlModelRelationship } from "models/src/yaml/IYamlModel";
import { ITestCase } from "utils/ObjectInvalidSchemaGenerator";

import { globalModelsErrors } from "../CompilerValidator/Validators/GlobalValidators/YamlGlobalModelsValidator/YamlGlobalModelsValidator";
import { IYamlObjectSchemaValidatorResponse } from "../YamlObjectSchemaValidator/IYamlObjectSchemaValidatorResponse";
import { applyRelationshipErrors, getOrphanError } from "./schema-validator-util";

type Case = {
  label: string;
  test: (result: IYamlObjectSchemaValidatorResponse) => void;
  payload: {
    result: IYamlObjectSchemaValidatorResponse;
    orphanRelationships?: Partial<IYamlModelRelationship>[];
    file: IParsedFile<IYamlModel>;
  };
};
const UNIQUE_NAME = "UNIQUE_NAME";
const UNIQUE_NAME_DATASET = "UNIQUE_NAME_DATASET";
const EMPTY_STRING = "";
const TEST_LABELS = {
  test1: "test1",
  test2: "test2",
};
``;
const APPLY_RELATIONSHIP_TEST_CASES: { cases: Case[]; testFunction: typeof applyRelationshipErrors } = {
  testFunction: applyRelationshipErrors,
  cases: [
    {
      label: "should attach one error",
      test: (result: IYamlObjectSchemaValidatorResponse) => {
        expect(result).toStrictEqual({
          errors: Array(1).fill(
            globalModelsErrors.getRelationshipInModelError({
              object: UNIQUE_NAME_DATASET,
              orphanType: ObjectType.Dataset,
            })
          ),
          isValid: false,
        });
      },
      payload: {
        result: { errors: [], isValid: true },
        orphanRelationships: [
          {
            unique_name: EMPTY_STRING,
            from: { dataset: UNIQUE_NAME_DATASET, join_columns: [] },
            to: { dimension: EMPTY_STRING, level: EMPTY_STRING },
          },
        ],
        file: YamlModelBuilder.create().buildYamlFile(),
      },
    },
    {
      payload: {
        file: YamlModelBuilder.create()
          .with({ unique_name: UNIQUE_NAME_DATASET, object_type: ObjectType.Dimension })
          .buildYamlFile(),
        result: {
          isValid: true,
          errors: [],
        },
      },
      label: "Should attach no errors if none are passed",
      test: (result: IYamlObjectSchemaValidatorResponse) => {
        expect(result).toStrictEqual({ errors: [], isValid: true });
      },
    },
    {
      label: "Should attach the errors if some are passed",
      payload: {
        file: YamlModelBuilder.create()
          .with({ unique_name: UNIQUE_NAME, object_type: ObjectType.Model })
          .buildYamlFile(),

        orphanRelationships: [
          {
            unique_name: TEST_LABELS.test1,
            from: { dataset: UNIQUE_NAME_DATASET, join_columns: [] },
            to: { dimension: EMPTY_STRING, level: EMPTY_STRING },
          },
          {
            unique_name: TEST_LABELS.test2,
            from: { dataset: UNIQUE_NAME_DATASET, join_columns: [] },
            to: { dimension: EMPTY_STRING, level: EMPTY_STRING },
          },
        ],

        result: {
          isValid: true,
          errors: [],
        },
      },
      test: (result: IYamlObjectSchemaValidatorResponse) => {
        expect(result).toStrictEqual({
          errors: Array(2).fill(
            globalModelsErrors.getRelationshipInModelError({
              object: UNIQUE_NAME_DATASET,
              orphanType: ObjectType.Dataset,
            })
          ),
          isValid: false,
        });
      },
    },
    {
      label: "Should attach appropriate errors for invalid invalid objects as string",
      payload: {
        file: YamlModelBuilder.create()
          .with({
            unique_name: UNIQUE_NAME,
            object_type: ObjectType.Model,
            relationships: "string" as unknown as IYamlModelRelationship[],
          })
          .buildYamlFile(),
        result: { errors: [], isValid: true },
        orphanRelationships: [],
      },
      test: (result) => {
        expect(result).toStrictEqual({ errors: [], isValid: true });
      },
    },
    {
      label: "Should attach appropriate errors for invalid objects as undefined",
      payload: {
        file: YamlModelBuilder.create()
          .with({
            unique_name: UNIQUE_NAME,
            object_type: ObjectType.Model,
            relationships: undefined as unknown as IYamlModelRelationship[],
          })
          .buildYamlFile(),
        result: { errors: [], isValid: true },
        orphanRelationships: [],
      },
      test: (result) => {
        expect(result).toStrictEqual({ errors: [], isValid: true });
      },
    },
    {
      label: "Should attach appropriate errors for invalid objects as nested invalid object",
      payload: {
        file: YamlModelBuilder.create()
          .with({
            unique_name: UNIQUE_NAME,
            object_type: ObjectType.Model,
            relationships: { relationships: [] } as unknown as IYamlModelRelationship[],
          })
          .buildYamlFile(),
        result: { errors: [], isValid: true },
        orphanRelationships: [],
      },
      test: (result) => {
        expect(result).toStrictEqual({ errors: [], isValid: true });
      },
    },
  ],
};
const ORPHAN_ERROR_CASES: ITestCase<{
  relationship: IYamlDimensionRelationship | IYamlModelRelationship;
  file: IParsedFile<IYamlDimension | IYamlModel>;
}>[] = [
  {
    condition: "YamlModelBuilder should return appropriate error",
    data: {
      file: {
        data: YamlModelBuilder.create().addRelationship({ unique_name: UNIQUE_NAME }).build(),
        compilationOutput: [],
        rawContent: "",
        relativePath: "",
      },
      relationship: YamlModelRelationBuilder.create()
        .addFrom({ dataset: UNIQUE_NAME_DATASET, join_columns: [] })
        .build(),
    },
  },
  {
    condition: "YamlDimensionBuilder should return appropriate error",
    data: {
      file: {
        data: YamlDimensionBuilder.create().build(),
        compilationOutput: [],
        rawContent: "",
        relativePath: "",
      },
      relationship: YamlDimensionRelationBuilder.create().withDataset(UNIQUE_NAME_DATASET).build(),
    },
  },
];

describe("Testing applyRelationshipErrors with manual bad input", () => {
  APPLY_RELATIONSHIP_TEST_CASES.cases.forEach((testCase) => {
    it(testCase.label, async () => {
      const result = APPLY_RELATIONSHIP_TEST_CASES.testFunction(
        testCase.payload as (typeof APPLY_RELATIONSHIP_TEST_CASES)["testFunction"]["arguments"]
      );

      if (testCase.test) testCase.test(result);
      expect(result).toBeDefined();
    });
  });
});

describe("Testing getOrphan error with manual bad input", () => {
  ORPHAN_ERROR_CASES.forEach((testCase) => {
    it(`${testCase.condition}`, () => {
      console.log(getOrphanError(testCase.data.file, testCase.data.relationship));
      expect(
        [
          `There is an unrelated dataset in the dimension - "${UNIQUE_NAME_DATASET}".`,
          `There is an unrelated dataset in the model - "${UNIQUE_NAME_DATASET}".`,
        ].some((message) => message === getOrphanError(testCase.data.file, testCase.data.relationship))
      ).toBe(true);
    });
  });
});
