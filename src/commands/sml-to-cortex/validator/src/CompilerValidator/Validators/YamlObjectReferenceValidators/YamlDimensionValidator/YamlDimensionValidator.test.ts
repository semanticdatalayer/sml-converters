/* eslint-disable @typescript-eslint/no-explicit-any */
import { DEFAULT_METRIC } from "models/builders/constants/YamlDimensionConstants";
import YamlDatasetBuilder from "models/src/builders/YamlObjectBuilders/YamlDatasetBuilder";
import YamlDimensionBuilder from "models/src/builders/YamlObjectBuilders/YamlDimensionBuilder";
import { YamlDimensionRelationBuilder } from "models/src/builders/YamlObjectBuilders/YamlDimensionRelationBuilder";
import { OutputCompilationType } from "models/src/IFileCompilationOutputContext";
import { IYamlFile } from "models/src/IYamlFile";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import YamlDatasetTypeGuard from "models/src/yaml/guards/YamlDatasetTypeGuard";
import YamlDimensionTypeGuard from "models/src/yaml/guards/YamlDimensionTypeGuard";
import {
  IYamlDimensionCalculationGroup,
  IYamlDimensionCalculationMember,
} from "models/src/yaml/IYamlCalculationGroups";
import {
  FormatStringMap,
  INTEGRAL_FORMAT_STRINGS,
  IYamlDataset,
  IYamlDatasetColumnDerived,
  IYamlDatasetColumnSimple,
  YamlColumnDataType,
} from "models/src/yaml/IYamlDataset";
import {
  IYamlCustomEmptyMember,
  IYamlDimension,
  IYamlDimensionHierarchy,
  IYamlDimensionLevel,
  IYamlDimensionRelationship,
  IYamlDimensionSecondaryAttribute,
  IYamlDimensionType,
  IYamlLevelFromOneDataset,
  IYamlLevelParallelPeriod,
  IYamlLevelWithMultipleDatasets,
  YamlDimensionRelationType,
  YamlDimensionTimeUnit,
} from "models/src/yaml/IYamlDimension";
import { IYamlObject } from "models/src/yaml/IYamlObject";
import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import ValidatorOutput, { FileOutputAppender } from "../../../../ValidatorOutput/ValidatorOutput";
import IExpressionValidator from "../../ExpressionValidator/IExpressionValidator";
import IYamlErrorContextUtil from "../IYamlErrorContexUtil";
import IYamlCommonReferenceValidator from "../YamlCommonReferenceValidator/IYamlCommonReferenceValidator";
import YamlValidatorUtil from "../YamlValidatorUtil";
import { IYamlDimensionValidationInput } from "./IYamlDimensionValidator";
import {
  GetError,
  getErrorForDifferentColumnTypes,
  yamlDimensionErrors,
  YamlDimensionValidator,
} from "./YamlDimensionValidator";

const dataset_1 = "dataset1";
const dataset_2 = "dataset2";

const column = {
  col1: "column1",
  col2: "column2",
  col3: "column3",
  col4: "column4",
  col5: "column5",
  invalid: "invalid",
};

const format = {
  f: "format",
  f1: "format1",
  f2: "format2",
  custom: "custom",
};

const formatStringMappingMock = {
  [YamlColumnDataType.Int]: [format.f, format.f1],
  [YamlColumnDataType.Boolean]: [format.f, format.f2],
  [YamlColumnDataType.String]: [],
} as unknown as FormatStringMap;

const yamlCommonReferenceValidator: IYamlCommonReferenceValidator = {
  validateAndGetReferencedObject: jest.fn().mockReturnValue({
    data: YamlDatasetBuilder.create()
      .uniqueName(dataset_1)
      .addColumn(column.col1, YamlColumnDataType.Int)
      .addColumn(column.col2, YamlColumnDataType.Boolean)
      .addColumn(column.col3, YamlColumnDataType.String)
      .addColumn(column.col4, YamlColumnDataType.String)
      .addColumn(column.col5, YamlColumnDataType.String)
      .build(),
  }),
  validateRelationships: jest.fn().mockReturnValue(new ValidatorOutput()),
  validateRelationshipsReferences: jest.fn().mockReturnValue(new ValidatorOutput()),
  validateAttributesReferences: jest.fn(),
  validateMetricReferences: jest.fn(),
};

const yamlErrorContextUtil: IYamlErrorContextUtil = {
  getLevelContext: jest.fn(),
  getLevelAttributeContext: jest.fn(),
  getSecondaryAttributeContext: jest.fn(),
  getLevelAliasContext: jest.fn(),
};
const areParenthesesValid = jest.fn();
const expressionValidator: IExpressionValidator = { areParenthesesValid };
const dimensionValidator = new YamlDimensionValidator(
  yamlCommonReferenceValidator,
  expressionValidator,
  yamlErrorContextUtil,
  formatStringMappingMock
);
const dimensionBuilder = YamlDimensionBuilder.create();
const levelAttributeNames = {
  city: "City",
  state: "State",
  country: "Country",
};
const defaultElementsMap = new Map<string, IYamlParsedFile>();
let referencedObjectIds: Set<string> = new Set<string>();
const defaultValidationContext: [Map<string, IYamlParsedFile<IYamlObject>>, Set<string>] = [
  defaultElementsMap,
  referencedObjectIds,
];

const mockedDatasetAndKeyColumns = {
  combination1: { dataset: dataset_1, key_columns: [column.col1], name_column: "name_column_1" },
  combination2: { dataset: dataset_2, key_columns: [column.col2], name_column: "name_column_2" },
};

const shared_degenerate_columns = [
  {
    dataset: dataset_1,
    name_column: "name1",
    key_columns: ["key1"],
    sort_column: "sort1",
    is_unique_key: true,
  },
  {
    dataset: dataset_2,
    name_column: "name2",
    key_columns: ["key2"],
    sort_column: "sort2",
    is_unique_key: false,
  },
];

describe("YamlDimensionValidator", () => {
  beforeEach(() => {
    referencedObjectIds = new Set<string>();
    areParenthesesValid.mockReturnValue(false);
  });

  it("Should call object and type validation logic with the correct params and add uniqueId to the collection", () => {
    const dimensionYamlFile = dimensionBuilder
      .addAttribute({ dataset: dataset_1, name_column: column.col1 })
      .buildYamlFile();

    dimensionValidator.validateObject(dimensionYamlFile, new Map<string, IYamlParsedFile>(), referencedObjectIds);

    const datasetUniqueId = (dimensionYamlFile.data.level_attributes[0] as IYamlLevelFromOneDataset).dataset;
    expect(yamlCommonReferenceValidator.validateAndGetReferencedObject).toHaveBeenCalledWith(
      datasetUniqueId,
      expect.anything(),
      expect.anything(),
      ObjectType.Dataset,
      expect.anything()
    );
    expect(referencedObjectIds).toContain(datasetUniqueId);
  });

  it("Should validate attribute and add error if there is a dataset with the same unique name and dataset but without dataset column", () => {
    const dimensionYamlFile = dimensionBuilder.addAttribute({ name_column: "invalid" }).buildYamlFile();

    const validationOutput = dimensionValidator.validateObject(
      dimensionYamlFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validationOutput.hasErrors).toBe(true);
    expect(
      validationOutput.hasFileErrorMessage(
        yamlDimensionErrors.notExistingCol(column.invalid, mockedDatasetAndKeyColumns.combination1.dataset)
      )
    ).toBe(true);
    expect(referencedObjectIds.size).toBe(1);
  });

  it("Should validate attribute with multiple datasets and add error if there is a dataset with non-existing name column", () => {
    const dimensionYamlFile = YamlDimensionBuilder.create()
      .addIsDegenerate(true)
      .addLevelAttributeWithMultipleDatasets({
        unique_name: levelAttributeNames.country,
        shared_degenerate_columns: [{ ...mockedDatasetAndKeyColumns.combination1, name_column: column.invalid }],
      })
      .addLevelAttributeWithMultipleDatasets({
        unique_name: levelAttributeNames.state,
        shared_degenerate_columns: [{ ...mockedDatasetAndKeyColumns.combination2 }],
      })
      .buildYamlFile();
    const validationOutput = dimensionValidator.validateObject(
      dimensionYamlFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validationOutput.hasErrors).toBe(true);
    expect(
      validationOutput.hasFileErrorMessage(
        yamlDimensionErrors.notExistingCol(column.invalid, mockedDatasetAndKeyColumns.combination1.dataset)
      )
    ).toBe(true);
  });

  it("Should call yamlCommonValidator validateRelationships", async () => {
    const dimensionYamlFile = dimensionBuilder.buildYamlFile();
    dimensionValidator.validateObject(dimensionYamlFile, new Map<string, IYamlParsedFile>(), referencedObjectIds);

    expect(yamlCommonReferenceValidator.validateRelationships).toHaveBeenCalled();
  });

  it("Should have no errors if there are calculation groups and they are valid", () => {
    areParenthesesValid.mockReturnValue(true);

    const dimensionFile = dimensionBuilder.addCalcGroupAndCalculatedMembers().buildYamlFile();

    const validationOutput = dimensionValidator.validateObject(
      dimensionFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validationOutput.hasErrors).toBe(false);
  });

  it("Should add error if there is an invalid calculation member expression", () => {
    const dimensionFile = dimensionBuilder.addCalcGroupAndCalculatedMembers().buildYamlFile();

    const validationOutput = dimensionValidator.validateObject(
      dimensionFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(areParenthesesValid).toHaveBeenCalledTimes(1);
    expect(validationOutput.hasErrors).toBe(true);
  });

  it("Should add error if there are calculated members with duplicated names in the calculation group", () => {
    const calcMemberNameMock = "calcMemberNameTest";
    const calcMemberMock = {
      unique_name: calcMemberNameMock,
    } as IYamlDimensionCalculationMember;

    const calcMemberMock2 = {
      unique_name: calcMemberNameMock,
    } as IYamlDimensionCalculationMember;

    const calcGroupMock = {
      unique_name: "calcGroupNameTest",
      calculated_members: [calcMemberMock, calcMemberMock2],
    } as IYamlDimensionCalculationGroup;

    const dimensionFile = dimensionBuilder.addCalculationGroup(calcGroupMock).buildYamlFile();

    const validationOutput = dimensionValidator.validateObject(
      dimensionFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validationOutput.hasErrors).toBe(true);
    expect(
      validationOutput.hasFileErrorMessage(
        yamlDimensionErrors.duplicateCalcMemberNameInCalcGroup(calcGroupMock.unique_name)
      )
    ).toBeTruthy();
  });

  describe("hierarchy levels", () => {
    const hierarchyLevelDimension = dimensionBuilder
      .addAttribute({ unique_name: "City", dataset: dataset_1, name_column: column.col1 })
      .addAttribute({ unique_name: "State", dataset: dataset_1, name_column: column.col2 })
      .addAttribute({ unique_name: "Country", dataset: dataset_1, name_column: column.col3 });

    it("Should add error if there is missing level_attribute reference", () => {
      const dimensionFile = hierarchyLevelDimension
        .addHierarchy({
          unique_name: "h1",
          levels: [{ unique_name: "City" }, { unique_name: "State123" }],
        })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(
        dimensionFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      expect(validationOutput.hasErrors).toBe(true);
      expect(
        validationOutput.hasFileErrorMessage(
          yamlDimensionErrors.invalidLevelAttributeReference({ unique_name: "h1", label: "aa", index: 0 }, "State123")
        )
      ).toBe(true);
    });
  });

  describe("level_attributes", () => {
    it("Should add error if column is not found in the dataset", () => {
      const dimensionFile = dimensionBuilder
        .addAttribute({ dataset: dataset_1, name_column: column.invalid })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(
        dimensionFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      expect(validationOutput.hasFileErrorMessage(yamlDimensionErrors.notExistingCol(column.invalid, dataset_1))).toBe(
        true
      );
    });

    it("Should add NO error if format prop is compatible with the column data_type", () => {
      const dimensionFile = dimensionBuilder
        .addAttribute({ dataset: dataset_1, name_column: column.col1, format: format.f })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(
        dimensionFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("Should add NO error if format prop is custom- it is not predefined in the mapping", () => {
      const dimensionFile = dimensionBuilder
        .addAttribute({ dataset: dataset_1, name_column: column.col2, format: format.custom })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(
        dimensionFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("Should add error if format prop is not compatible with the column data_type", () => {
      const dimensionFile = dimensionBuilder
        .addAttribute({ dataset: dataset_1, name_column: column.col1, format: format.f2 })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(
        dimensionFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      const level = dimensionFile.data.level_attributes[0] as IYamlLevelFromOneDataset;

      expect(
        validationOutput.hasFileErrorMessage(
          yamlDimensionErrors.formatNotCompatibleWithColType(
            { attribute: level, colType: YamlColumnDataType.Int },
            formatStringMappingMock
          )
        )
      ).toBe(true);
    });

    it("Should add notApplicableFormat error if format prop is custom but is not applicable for a column data_type", () => {
      const dimensionFile = dimensionBuilder
        .addAttribute({ dataset: dataset_1, name_column: column.col3, format: format.custom })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(
        dimensionFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      const level = dimensionFile.data.level_attributes[0] as IYamlLevelFromOneDataset;
      expect(
        validationOutput.hasFileErrorMessage(
          yamlDimensionErrors.notApplicableFormatForColType({ attribute: level, colType: YamlColumnDataType.String })
        )
      ).toBe(true);
    });

    it("Should add notApplicableFormat error if format prop is not applicable for a column data_type", () => {
      const dimensionFile = dimensionBuilder
        .addAttribute({ dataset: dataset_1, name_column: column.col3, format: format.f })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(
        dimensionFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      const level = dimensionFile.data.level_attributes[0] as IYamlLevelFromOneDataset;
      expect(
        validationOutput.hasFileErrorMessage(
          yamlDimensionErrors.notApplicableFormatForColType({ attribute: level, colType: YamlColumnDataType.String })
        )
      ).toBe(true);
    });
  });

  describe("metrics", () => {
    it("should pass if there is valid format type", () => {
      const dimensionWithMetric = dimensionBuilder
        .addAttribute({ unique_name: levelAttributeNames.country, dataset: dataset_1, name_column: column.col1 })
        .addHierarchy({
          unique_name: "h1",
          levels: [
            {
              unique_name: levelAttributeNames.country,
              metrics: [Object.assign({}, DEFAULT_METRIC, { column: column.col1, format: INTEGRAL_FORMAT_STRINGS[0] })],
            },
          ],
        })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(
        dimensionWithMetric,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("should return an error if format property is not compatible with the measure", () => {
      const uniqueName = "dimensionMetric";
      const dimensionWithMetric = dimensionBuilder
        .addMetric({ unique_name: uniqueName, column: column.col1, format: format.f })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(
        dimensionWithMetric,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      expect(
        validationOutput.hasFileErrorMessage(yamlDimensionErrors.formatNotCompatibleWithMetric(uniqueName, format.f))
      ).toBe(true);
    });
  });

  describe("validateRelationshipHierarchy", () => {
    const hierarchyUniqueName = "hierarchy unique name";
    const relationBuilder = YamlDimensionRelationBuilder.create().with({
      from: {
        dataset: "dataset",
        hierarchy: hierarchyUniqueName,
        join_columns: ["column"],
        level: "level",
      },
      to: {
        level: "level",
        dimension: "dimension",
      },
      type: YamlDimensionRelationType.Embedded,
    });

    it("Should not return an error if the relationship hierarchy is the same as hierarchy unique name", () => {
      const relation = relationBuilder.build();
      const yamlFile = dimensionBuilder
        .addRelationship(relation)
        .addHierarchy({ unique_name: hierarchyUniqueName, levels: [] })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(
        yamlFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("Should return an error if the relationship hierarchy does not exist or match the label instead of unique name", () => {
      const relation = relationBuilder.build();
      const yamlFile = dimensionBuilder
        .addRelationship(relation)
        .addHierarchy({ label: hierarchyUniqueName })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(
        yamlFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      expect(
        validationOutput.hasFileErrorMessage(yamlDimensionErrors.missingRelationshipHierarchy(hierarchyUniqueName))
      ).toBe(true);
    });

    it("Should return an error if time_unit prop is detected in a level", () => {
      const relation = relationBuilder.build();
      const level = { unique_name: "level_name", time_unit: YamlDimensionTimeUnit.Day };
      const yamlFile = dimensionBuilder
        .addRelationship(relation)
        .addHierarchy({ unique_name: hierarchyUniqueName, levels: [level] })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(
        yamlFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      const errorMsg = yamlDimensionErrors.timeUnitPropDetectedInLevel(hierarchyUniqueName, level.unique_name);
      expect(validationOutput.hasFileErrorMessage(errorMsg)).toBe(true);
    });
  });

  describe("validateTimeUnitProperty", () => {
    let dimensionValidator: YamlDimensionValidator;
    beforeEach(() => {
      dimensionValidator = new YamlDimensionValidator(
        yamlCommonReferenceValidator,
        expressionValidator,
        yamlErrorContextUtil,
        formatStringMappingMock
      );
    });

    const hierarchy = "Day_Hour_Min Hierarchy";
    const getLevelAttrName = (name: string) => `${name}_attr`;
    const getLevel = (name: string): IYamlDimensionLevel => ({
      unique_name: getLevelAttrName(name),
      is_hidden: false,
    });

    const timeDimensionBuilder = dimensionBuilder.with({ type: IYamlDimensionType.Time });
    const timeDimensionWithAttributesBuilder = timeDimensionBuilder
      .addAttribute({
        unique_name: getLevelAttrName(YamlDimensionTimeUnit.Day),
        dataset: dataset_1,
        name_column: column.col1,
        time_unit: YamlDimensionTimeUnit.Day,
      })
      .addAttribute({
        unique_name: getLevelAttrName(YamlDimensionTimeUnit.Hour),
        dataset: dataset_1,
        name_column: column.col2,
        time_unit: YamlDimensionTimeUnit.Hour,
      })
      .addAttribute({
        unique_name: getLevelAttrName(YamlDimensionTimeUnit.Minute),
        dataset: dataset_1,
        name_column: column.col2,
        time_unit: YamlDimensionTimeUnit.Minute,
      });

    it("should add an error if the dimension type is Time and the level does not have a time_unit property", () => {
      const dimensionYamlFile = timeDimensionBuilder.addLevelAttribute().buildYamlFile();
      const dimension = dimensionYamlFile.data as IYamlDimension;
      const level = dimension.level_attributes[0];
      level.time_unit = undefined;

      const validationOutput = dimensionValidator.validateObject(
        dimensionYamlFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      expect(
        validationOutput.hasFileErrorMessage(yamlDimensionErrors.timeUnitMissingInTimeDimension(level.unique_name))
      ).toBe(true);
    });

    it("should not add an error if the dimension type is Time but all level attributes have a time_unit property", () => {
      const dimensionYamlFile = timeDimensionBuilder.addLevelAttribute().buildYamlFile();
      const dimension = dimensionYamlFile.data as IYamlDimension;
      const level = dimension.level_attributes[0];
      level.time_unit = YamlDimensionTimeUnit.Day;

      const validationOutput = dimensionValidator.validateObject(
        dimensionYamlFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      expect(
        validationOutput.hasFileErrorMessage(yamlDimensionErrors.timeUnitMissingInTimeDimension(level.unique_name))
      ).toBe(false);
    });

    it("should not add an error if the dimension type is not Time", () => {
      const dimensionYamlFile = dimensionBuilder
        .with({ type: IYamlDimensionType.Standard })
        .addLevelAttribute()
        .buildYamlFile();
      const dimension = dimensionYamlFile.data as IYamlDimension;
      const level = dimension.level_attributes[0];
      level.time_unit = YamlDimensionTimeUnit.Day;

      const validationOutput = dimensionValidator.validateObject(
        dimensionYamlFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      expect(
        validationOutput.hasFileErrorMessage(yamlDimensionErrors.timeUnitMissingInTimeDimension(level.unique_name))
      ).toBe(false);
    });

    it("should add NO error if levels are with descending time_units", () => {
      const dimensionYamlFile = timeDimensionWithAttributesBuilder
        .addHierarchy({
          unique_name: hierarchy,
          levels: [
            getLevel(YamlDimensionTimeUnit.Day),
            getLevel(YamlDimensionTimeUnit.Hour),
            getLevel(YamlDimensionTimeUnit.Minute),
          ],
        })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(
        dimensionYamlFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("should add NO error if adjacent level time_units are equal", () => {
      const dimensionYamlFile = timeDimensionBuilder
        .addAttribute({
          unique_name: getLevelAttrName(YamlDimensionTimeUnit.Day),
          dataset: dataset_1,
          name_column: column.col1,
          time_unit: YamlDimensionTimeUnit.Day,
        })
        .addAttribute({
          unique_name: getLevelAttrName("day_1"),
          dataset: dataset_1,
          name_column: column.col1,
          time_unit: YamlDimensionTimeUnit.Day,
        })
        .addHierarchy({
          unique_name: hierarchy,
          levels: [getLevel(YamlDimensionTimeUnit.Day), getLevel("day_1")],
        })

        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(
        dimensionYamlFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("should add NO error if level time_units are Undefined", () => {
      const dimensionYamlFile = timeDimensionBuilder
        .addAttribute({
          unique_name: getLevelAttrName(YamlDimensionTimeUnit.Undefined),
          dataset: dataset_1,
          name_column: column.col1,
          time_unit: YamlDimensionTimeUnit.Undefined,
        })
        .addAttribute({
          unique_name: getLevelAttrName(YamlDimensionTimeUnit.Minute),
          dataset: dataset_1,
          name_column: column.col1,
          time_unit: YamlDimensionTimeUnit.Minute,
        })
        .addHierarchy({
          unique_name: hierarchy,
          levels: [getLevel(YamlDimensionTimeUnit.Undefined), getLevel(YamlDimensionTimeUnit.Minute)],
        })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(
        dimensionYamlFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("should add an error if one level time_units are greater than the level above", () => {
      const dimensionYamlFile = timeDimensionWithAttributesBuilder
        .addHierarchy({
          unique_name: hierarchy,
          levels: [getLevel(YamlDimensionTimeUnit.Hour), getLevel(YamlDimensionTimeUnit.Day)],
        })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(
        dimensionYamlFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      const message = yamlDimensionErrors.invalidTimeUnitLevelOrder({
        hierarchyName: hierarchy,
        levelName: getLevelAttrName(YamlDimensionTimeUnit.Day),
      });

      expect(validationOutput.hasFileErrorMessage(message)).toBe(true);
    });

    it("should add two errors if the level time_units are greater than the level above", () => {
      const dimensionYamlFile = timeDimensionWithAttributesBuilder
        .addHierarchy({
          unique_name: hierarchy,
          levels: [
            getLevel(YamlDimensionTimeUnit.Minute),
            getLevel(YamlDimensionTimeUnit.Hour),
            getLevel(YamlDimensionTimeUnit.Day),
          ],
        })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(
        dimensionYamlFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      const message_1 = yamlDimensionErrors.invalidTimeUnitLevelOrder({
        hierarchyName: hierarchy,
        levelName: getLevelAttrName(YamlDimensionTimeUnit.Hour),
      });
      const message_2 = yamlDimensionErrors.invalidTimeUnitLevelOrder({
        hierarchyName: hierarchy,
        levelName: getLevelAttrName(YamlDimensionTimeUnit.Day),
      });

      expect(validationOutput.hasFileErrorMessage(message_1)).toBe(true);
      expect(validationOutput.hasFileErrorMessage(message_2)).toBe(true);
    });
  });

  describe("validateCustomEmptyMember", () => {
    let dimensionValidator: YamlDimensionValidator;
    beforeEach(() => {
      dimensionValidator = new YamlDimensionValidator(
        yamlCommonReferenceValidator,
        expressionValidator,
        yamlErrorContextUtil,
        formatStringMappingMock
      );
    });

    const customEmptyMemberCases = [
      {
        case: "should add error if the level or secondary attribute has sort_column and custom_empty_member is missing sort_name",
        inputDetails: {
          custom_empty_member: {
            name: "empty",
            key: ["key1", "key2"],
          },
          sortColumn: "test",
        },
        getErrorMsg: yamlDimensionErrors.customEmptyMemberSortNameMissing,
        result: true,
      },
      {
        case: "should not add error if the level or secondary attribute has no sort_column and custom_empty_member is missing sort_name",
        inputDetails: {
          custom_empty_member: {
            name: "empty",
            key: ["key1", "key2"],
          },
          sortColumn: undefined,
        },
        getErrorMsg: yamlDimensionErrors.customEmptyMemberSortNameMissing,
        result: false,
      },
      {
        case: "should not add error if the level or secondary attribute has  sort_column and custom_empty_member has sort_name",
        inputDetails: {
          custom_empty_member: {
            name: "empty",
            key: ["key1", "key2"],
            sort_name: "sort",
          },
          sortColumn: "sort",
        },
        getErrorMsg: yamlDimensionErrors.customEmptyMemberSortNameMissing,
        result: false,
      },
    ];

    // test cases for level attributes
    customEmptyMemberCases.forEach((testCase) => {
      it(`Level Attribute: ${testCase.case}`, () => {
        const dimensionYamlFile = dimensionBuilder
          .addLevelAttribute({
            sort_column: testCase.inputDetails.sortColumn,
            custom_empty_member: testCase.inputDetails.custom_empty_member as unknown as IYamlCustomEmptyMember,
          })
          .buildYamlFile();
        const dimension = dimensionYamlFile.data as IYamlDimension;
        const level = dimension.level_attributes[0];

        const validationOutput = dimensionValidator.validateObject(
          dimensionYamlFile,
          new Map<string, IYamlParsedFile>(),
          referencedObjectIds
        );

        expect(
          validationOutput.hasFileErrorMessage(testCase.getErrorMsg(level.unique_name, OutputCompilationType.Level))
        ).toBe(testCase.result);
      });
    });

    // test cases for secondary attributes
    customEmptyMemberCases.forEach((testCase) => {
      it(testCase.case, () => {
        const dimensionYamlFile = dimensionBuilder
          .addHierarchy()
          .addLevelAttribute()
          .addSecondaryAttribute({
            sort_column: testCase.inputDetails.sortColumn,
            custom_empty_member: testCase.inputDetails.custom_empty_member as unknown as IYamlCustomEmptyMember,
          })
          .buildYamlFile();
        const dimension = dimensionYamlFile.data as IYamlDimension;
        const level = dimension.hierarchies[0].levels[0];
        const secondaryAttribute = level.secondary_attributes
          ? level.secondary_attributes[0]
          : { unique_name: "mock secondary attribute" };

        const validationOutput = dimensionValidator.validateObject(
          dimensionYamlFile,
          new Map<string, IYamlParsedFile>(),
          referencedObjectIds
        );

        expect(
          validationOutput.hasFileErrorMessage(
            testCase.getErrorMsg(secondaryAttribute.unique_name, OutputCompilationType.SecondaryAttribute)
          )
        ).toBe(testCase.result);
      });
    });
  });

  describe("Validate Parallel periods", () => {
    describe("validateParallelPeriodIsOnlyInTimeDimension", () => {
      const mockHierarchy: IYamlDimensionHierarchy = {
        unique_name: "hierarchyName",
        label: "name",
        levels: [
          { unique_name: "level name 1" },
          { unique_name: "level name 2", parallel_periods: [{ level: "level name 1", key_columns: ["column1"] }] },
        ],
      };
      it("Should throw error when parallel period is not in time dimension", () => {
        const dimensionYamlFile = dimensionBuilder
          .with({ type: IYamlDimensionType.Standard })
          .addHierarchy(mockHierarchy)
          .buildYamlFile();

        const validationOutput = dimensionValidator.validateObject(
          dimensionYamlFile,
          new Map<string, IYamlParsedFile>(),
          referencedObjectIds
        );

        dimensionValidator.validateParallelPeriodIsOnlyInTimeDimension(
          dimensionYamlFile.data,
          mockHierarchy.levels,
          validationOutput.file(dimensionYamlFile)
        );
        expect(validationOutput.hasErrors).toBe(true);
        expect(
          validationOutput.hasFileErrorMessage(yamlDimensionErrors.parallelPeriodShouldBeUseOnlyInTimeDimensionError())
        ).toBe(true);
      });

      it("Should not throw error when parallel period is in time dimension", () => {
        const dimensionYamlFile = dimensionBuilder
          .with({ type: IYamlDimensionType.Time })
          .addHierarchy(mockHierarchy)
          .buildYamlFile();

        const validationOutput = dimensionValidator.validateObject(
          dimensionYamlFile,
          new Map<string, IYamlParsedFile>(),
          referencedObjectIds
        );

        dimensionValidator.validateParallelPeriodIsOnlyInTimeDimension(
          dimensionYamlFile.data,
          mockHierarchy.levels,
          validationOutput.file(dimensionYamlFile)
        );
        expect(
          validationOutput.hasFileErrorMessage(yamlDimensionErrors.parallelPeriodShouldBeUseOnlyInTimeDimensionError())
        ).toBe(false);
      });
    });

    describe("validateReferredLevelParallelPeriod()", () => {
      const DEFAULT_LEVEL_NAME = "test_level";

      const getMockLevel = (levelUName: string, parallelPeriodNames?: Array<string>) => {
        const mockLevel: IYamlDimensionLevel = {
          unique_name: levelUName,
        };

        if (!parallelPeriodNames) return mockLevel;

        parallelPeriodNames.forEach((PpName) => {
          const parallelPeriod = {
            level: PpName,
            key_columns: ["col1"],
          };

          if (!mockLevel.parallel_periods) {
            mockLevel.parallel_periods = [];
          }
          mockLevel.parallel_periods.push(parallelPeriod);
        });
        return mockLevel;
      };

      const buildValidationOutput = (currentLevel: IYamlDimensionLevel) => {
        const mockLevels = [{ unique_name: DEFAULT_LEVEL_NAME }];
        if (currentLevel) {
          mockLevels.push(currentLevel);
        }

        const mockHierarchy: IYamlDimensionHierarchy = {
          unique_name: "hierarchyName",
          label: "name",
          levels: mockLevels,
        };

        const dimensionYamlFile = dimensionBuilder
          .with({ type: IYamlDimensionType.Time })
          .addHierarchy(mockHierarchy)
          .buildYamlFile();

        const validationOutput = dimensionValidator.validateObject(
          dimensionYamlFile,
          new Map<string, IYamlParsedFile>(),
          referencedObjectIds
        );

        dimensionValidator.validateReferredLevelParallelPeriod(
          mockHierarchy,
          currentLevel,
          validationOutput.file(dimensionYamlFile)
        );

        return validationOutput;
      };

      it("Should throw an error when parallel period level name is equal to paren level name", () => {
        const mockParallelPeriodLevelName = "level_1";
        const mockCurrentLevel = getMockLevel("level_1", [mockParallelPeriodLevelName]);
        const validationOutput = buildValidationOutput(mockCurrentLevel);

        expect(validationOutput.hasErrors).toBe(true);
        expect(
          validationOutput.hasFileErrorMessage(
            yamlDimensionErrors.referredLevelNameIsEqualToParenLevelError(
              mockCurrentLevel.unique_name,
              mockParallelPeriodLevelName
            )
          )
        ).toBe(true);
      });

      it("Should not throw an error when parallel period level name is not equal to paren level name", () => {
        const mockParallelPeriodLevelName = "level_2";
        const mockCurrentLevel = getMockLevel("level_1", [mockParallelPeriodLevelName]);
        const validationOutput = buildValidationOutput(mockCurrentLevel);

        expect(
          validationOutput.hasFileErrorMessage(
            yamlDimensionErrors.referredLevelNameIsEqualToParenLevelError(
              mockCurrentLevel.unique_name,
              mockParallelPeriodLevelName
            )
          )
        ).toBe(false);
      });

      it("Should not throw an error, when there are two identical names at the parallel period level, and the level name is different from the parent level name.", () => {
        const mockParallelPeriodLevelName = "level_2";
        const mockCurrentLevel = getMockLevel("level_1", [mockParallelPeriodLevelName, mockParallelPeriodLevelName]);

        const validationOutput = buildValidationOutput(mockCurrentLevel);

        expect(
          validationOutput.hasFileErrorMessage(
            yamlDimensionErrors.referredLevelNameIsEqualToParenLevelError(
              mockCurrentLevel.unique_name,
              mockParallelPeriodLevelName
            )
          )
        ).toBe(false);
      });

      it("Should throw an error, when there is some parallel period level name, equal to the parent level name.", () => {
        const mockParallelPeriodLevelName = "level_1";
        const mockCurrentLevel = getMockLevel("level_1", [mockParallelPeriodLevelName, "level_2"]);
        const validationOutput = buildValidationOutput(mockCurrentLevel);

        expect(
          validationOutput.hasFileErrorMessage(
            yamlDimensionErrors.referredLevelNameIsEqualToParenLevelError(
              mockCurrentLevel.unique_name,
              mockParallelPeriodLevelName
            )
          )
        ).toBe(true);
      });

      it("Should throw correct errors, when there are two identical names at the parallel period level, and the level name is equal to the parent level name.", () => {
        const mockParallelPeriodLevelName = "level_1";
        const mockCurrentLevel = getMockLevel("level_1", [mockParallelPeriodLevelName, mockParallelPeriodLevelName]);
        const validationOutput = buildValidationOutput(mockCurrentLevel);

        expect(
          validationOutput.hasFileErrorMessage(
            yamlDimensionErrors.referredLevelNameIsEqualToParenLevelError(
              mockCurrentLevel.unique_name,
              mockParallelPeriodLevelName
            )
          )
        ).toBe(true);
        expect(
          validationOutput.hasFileErrorMessage(
            yamlDimensionErrors.referredLevelNameIsEqualToParenLevelError(
              mockCurrentLevel.unique_name,
              mockParallelPeriodLevelName
            )
          )
        ).toBe(true);
      });

      it("Should throw an error, when a parallel period level name is not in the hierarchy", () => {
        const mockParallelPeriodLevelName = "test";
        const mockCurrentLevel = getMockLevel("level_1", [mockParallelPeriodLevelName, mockParallelPeriodLevelName]);

        const validationOutput = buildValidationOutput(mockCurrentLevel);

        expect(
          validationOutput.hasFileErrorMessage(
            yamlDimensionErrors.referredLevelNameIsNotInTheSameHierarchyError(mockParallelPeriodLevelName)
          )
        ).toBe(true);
      });

      it("Should not throw an error, when a parallel period level name is in the hierarchy", () => {
        const mockParallelPeriodLevelName = "level_1";
        const mockCurrentLevel = getMockLevel("level_1", [mockParallelPeriodLevelName]);
        const validationOutput = buildValidationOutput(mockCurrentLevel);

        expect(
          validationOutput.hasFileErrorMessage(
            yamlDimensionErrors.referredLevelNameIsNotInTheSameHierarchyError(mockParallelPeriodLevelName)
          )
        ).toBe(false);
      });

      it("Should throw correct errors, when all Parallel period levels name are not in the current hierarchy!", () => {
        const mockParallelPeriodLevelName = "test1";
        const mockParallelPeriodLevelName2 = "test2";
        const mockCurrentLevel = getMockLevel("level_1", [mockParallelPeriodLevelName, mockParallelPeriodLevelName2]);

        const validationOutput = buildValidationOutput(mockCurrentLevel);

        expect(
          validationOutput.hasFileErrorMessage(
            yamlDimensionErrors.referredLevelNameIsNotInTheSameHierarchyError(mockParallelPeriodLevelName)
          )
        ).toBe(true);
        expect(
          validationOutput.hasFileErrorMessage(
            yamlDimensionErrors.referredLevelNameIsNotInTheSameHierarchyError(mockParallelPeriodLevelName2)
          )
        ).toBe(true);
      });

      it("Should throw correct errors, when some Parallel period level name are not in the current hierarchy", () => {
        const mockParallelPeriodLevelName = "test1";
        const mockParallelPeriodLevelName2 = DEFAULT_LEVEL_NAME;
        const mockCurrentLevel = getMockLevel("level_1", [mockParallelPeriodLevelName, mockParallelPeriodLevelName2]);
        const validationOutput = buildValidationOutput(mockCurrentLevel);

        expect(
          validationOutput.hasFileErrorMessage(
            yamlDimensionErrors.referredLevelNameIsNotInTheSameHierarchyError(mockParallelPeriodLevelName)
          )
        ).toBe(true);
      });

      it("Should throw correct errors, when some Parallel period level name are not in the current hierarchy and the other one is equal to parent level name", () => {
        const mockParallelPeriodLevelName = "test1";
        const mockParallelPeriodLevelName2 = "level_1";
        const mockCurrentLevel = getMockLevel("level_1", [mockParallelPeriodLevelName, mockParallelPeriodLevelName2]);
        const validationOutput = buildValidationOutput(mockCurrentLevel);

        expect(
          validationOutput.hasFileErrorMessage(
            yamlDimensionErrors.referredLevelNameIsNotInTheSameHierarchyError(mockParallelPeriodLevelName)
          )
        ).toBe(true);

        expect(
          validationOutput.hasFileErrorMessage(
            yamlDimensionErrors.referredLevelNameIsEqualToParenLevelError(
              mockCurrentLevel.unique_name,
              mockParallelPeriodLevelName2
            )
          )
        ).toBe(true);
      });
    });

    describe("validateParallelPeriodKeyColumnsAreExistInRelatedLevelDatasets", () => {
      const mockLevel1 = "level name 1";
      const mockLevel2 = "level name 2";
      const mockedExpectedDatasetColumnName = "testColumnName";

      const createMockHierarchyWithParallelPeriods = (parallelPeriods: IYamlLevelParallelPeriod[]) => ({
        unique_name: "hierarchyName",
        label: "name",
        levels: [{ unique_name: mockLevel1 }, { unique_name: mockLevel2, parallel_periods: parallelPeriods }],
      });

      const validateParallelPeriodKeyColumns = (
        hierarchy: IYamlDimensionHierarchy,
        dimensionFile: IYamlFile<IYamlDimension>
      ) => {
        const validationOutput = dimensionValidator.validateObject(
          dimensionFile,
          new Map<string, IYamlParsedFile>(),
          referencedObjectIds
        );

        dimensionValidator.validateParallelPeriodKeyColumnsExistsInTheRelatedLevelDatasets(
          dimensionFile.data,
          hierarchy.levels[1].parallel_periods as IYamlLevelParallelPeriod[],
          new Map(),
          referencedObjectIds,
          dimensionFile,
          validationOutput
        );

        return validationOutput;
      };

      it("Should not throw an error when parallel period key_column exist in datasets related to the parallel period level", () => {
        const mockHierarchy = createMockHierarchyWithParallelPeriods([
          { level: mockLevel1, key_columns: [column.col1] },
        ]);
        const dimensionYamlFile = dimensionBuilder
          .with({ type: IYamlDimensionType.Time })
          .addAttribute({ dataset: dataset_1, name_column: column.col1, unique_name: mockLevel1 })
          .addAttribute({ dataset: dataset_2, name_column: column.col1, unique_name: mockLevel2 })
          .addHierarchy(mockHierarchy)
          .buildYamlFile();

        const validationOutput = validateParallelPeriodKeyColumns(mockHierarchy, dimensionYamlFile);
        expect(
          validationOutput.hasFileErrorMessage(
            yamlDimensionErrors.parallelPeriodKeyColumnIsNotExistInRelatedLevelDatasets(column.col1, dataset_1)
          )
        ).toBeFalsy();
      });

      it("Should throw an error when parallel period key_column does not exist in datasets related to the parallel period level", () => {
        const mockHierarchy = createMockHierarchyWithParallelPeriods([
          { level: mockLevel1, key_columns: [mockedExpectedDatasetColumnName] },
        ]);
        const dimensionYamlFile = dimensionBuilder
          .with({ type: IYamlDimensionType.Time })
          .addAttribute({ dataset: dataset_1, name_column: column.col1, unique_name: mockLevel1 })
          .addAttribute({ dataset: dataset_2, name_column: column.col1, unique_name: mockLevel2 })
          .addHierarchy(mockHierarchy)
          .buildYamlFile();

        const validationOutput = validateParallelPeriodKeyColumns(mockHierarchy, dimensionYamlFile);
        expect(
          validationOutput.hasFileErrorMessage(
            yamlDimensionErrors.parallelPeriodKeyColumnIsNotExistInRelatedLevelDatasets(
              mockedExpectedDatasetColumnName,
              dataset_1
            )
          )
        ).toBeTruthy();
      });

      describe("degenerate dimension", () => {
        it("Should not throw an error when parallel period key_column exist in datasets related to the parallel period multiple level", () => {
          const mockHierarchy = createMockHierarchyWithParallelPeriods([
            { level: mockLevel1, key_columns: [column.col1] },
          ]);
          const dimensionYamlFile = dimensionBuilder
            .with({ type: IYamlDimensionType.Time })
            .addIsDegenerate(true)
            .addLevelAttributeWithMultipleDatasets({
              unique_name: mockLevel1,
              shared_degenerate_columns: [{ ...mockedDatasetAndKeyColumns.combination1 }],
            })
            .addAttribute({ dataset: dataset_1, name_column: column.col1, unique_name: mockLevel2 })
            .addHierarchy(mockHierarchy)
            .buildYamlFile();

          const validationOutput = validateParallelPeriodKeyColumns(mockHierarchy, dimensionYamlFile);
          expect(
            validationOutput.hasFileErrorMessage(
              yamlDimensionErrors.parallelPeriodKeyColumnIsNotExistInRelatedLevelDatasets(column.col1, dataset_1)
            )
          ).toBeFalsy();
        });

        it("Should throw an error when parallel period key_column does not exist in datasets related to the parallel period multiple level", () => {
          const mockHierarchy = createMockHierarchyWithParallelPeriods([
            { level: mockLevel1, key_columns: [mockedExpectedDatasetColumnName] },
          ]);
          const dimensionYamlFile = dimensionBuilder
            .with({ type: IYamlDimensionType.Time })
            .addIsDegenerate(true)
            .addLevelAttributeWithMultipleDatasets({
              unique_name: mockLevel1,
              shared_degenerate_columns: [{ ...mockedDatasetAndKeyColumns.combination1 }],
            })
            .addAttribute({ dataset: dataset_2, name_column: column.col1, unique_name: mockLevel2 })
            .addHierarchy(mockHierarchy)
            .buildYamlFile();

          const validationOutput = validateParallelPeriodKeyColumns(mockHierarchy, dimensionYamlFile);
          expect(
            validationOutput.hasFileErrorMessage(
              yamlDimensionErrors.parallelPeriodKeyColumnIsNotExistInRelatedLevelDatasets(
                mockedExpectedDatasetColumnName,
                dataset_1
              )
            )
          ).toBeTruthy();
        });

        it("Should not throw an error when parallel period key_column exist in datasets related to the parallel period level", () => {
          const mockHierarchy = createMockHierarchyWithParallelPeriods([
            { level: mockLevel1, key_columns: [column.col1] },
          ]);
          const dimensionYamlFile = dimensionBuilder
            .with({ type: IYamlDimensionType.Time })
            .addIsDegenerate(true)
            .addAttribute({ dataset: dataset_1, name_column: column.col1, unique_name: mockLevel1 })
            .addAttribute({ dataset: dataset_2, name_column: column.col1, unique_name: mockLevel2 })
            .addHierarchy(mockHierarchy)
            .buildYamlFile();

          const validationOutput = validateParallelPeriodKeyColumns(mockHierarchy, dimensionYamlFile);
          expect(
            validationOutput.hasFileErrorMessage(
              yamlDimensionErrors.parallelPeriodKeyColumnIsNotExistInRelatedLevelDatasets(column.col1, dataset_1)
            )
          ).toBeFalsy();
        });

        it("Should throw an error when parallel period key_column does not exist in datasets related to the parallel period level", () => {
          const mockHierarchy = createMockHierarchyWithParallelPeriods([
            { level: mockLevel1, key_columns: [mockedExpectedDatasetColumnName] },
          ]);
          const dimensionYamlFile = dimensionBuilder
            .with({ type: IYamlDimensionType.Time })
            .addIsDegenerate(true)
            .addAttribute({ dataset: dataset_1, name_column: column.col1, unique_name: mockLevel1 })
            .addAttribute({ dataset: dataset_2, name_column: column.col1, unique_name: mockLevel2 })
            .addHierarchy(mockHierarchy)
            .buildYamlFile();

          const validationOutput = validateParallelPeriodKeyColumns(mockHierarchy, dimensionYamlFile);
          expect(
            validationOutput.hasFileErrorMessage(
              yamlDimensionErrors.parallelPeriodKeyColumnIsNotExistInRelatedLevelDatasets(
                mockedExpectedDatasetColumnName,
                dataset_1
              )
            )
          ).toBeTruthy();
        });
      });
    });
  });

  describe("Validate Secondary Attributes", () => {
    const dimensionBuilderWithAttr = dimensionBuilder.addHierarchy().addLevelAttribute();

    it("should add an error if the name_column does not exist", () => {
      const dimensionYamlFile = dimensionBuilderWithAttr
        .addSecondaryAttribute({ name_column: column.invalid })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(dimensionYamlFile, ...defaultValidationContext);

      const errorMessage = yamlDimensionErrors.notExistingCol(column.invalid, dataset_1);
      expect(validationOutput.hasFileErrorMessage(errorMessage)).toBe(true);
    });

    it("should add an error if one of the key_columns does not exist", () => {
      const dimensionYamlFile = dimensionBuilderWithAttr
        .addSecondaryAttribute({ key_columns: [column.col1, column.invalid] })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(dimensionYamlFile, ...defaultValidationContext);

      const errorMessage = yamlDimensionErrors.notExistingCol(column.invalid, dataset_1);
      expect(validationOutput.hasFileErrorMessage(errorMessage)).toBe(true);
    });

    it("should add an error if the sort_column does not exist", () => {
      const dimensionYamlFile = dimensionBuilderWithAttr
        .addSecondaryAttribute({ sort_column: column.invalid })
        .buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(dimensionYamlFile, ...defaultValidationContext);

      const errorMessage = yamlDimensionErrors.notExistingCol(column.invalid, dataset_1);
      expect(validationOutput.hasFileErrorMessage(errorMessage)).toBe(true);
    });
  });

  describe("Validate Aliases", () => {
    const dimensionBuilderWithAttr = dimensionBuilder.addHierarchy().addLevelAttribute();

    it("should add an error if the name_column does not exist", () => {
      const dimensionYamlFile = dimensionBuilderWithAttr.addLevelAlias({ name_column: column.invalid }).buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(dimensionYamlFile, ...defaultValidationContext);

      const errorMessage = yamlDimensionErrors.notExistingCol(column.invalid, dataset_1);
      expect(validationOutput.hasFileErrorMessage(errorMessage)).toBe(true);
    });

    it("should add an error if the sort_column does not exist", () => {
      const dimensionYamlFile = dimensionBuilderWithAttr.addLevelAlias({ sort_column: column.invalid }).buildYamlFile();

      const validationOutput = dimensionValidator.validateObject(dimensionYamlFile, ...defaultValidationContext);

      const errorMessage = yamlDimensionErrors.notExistingCol(column.invalid, dataset_1);
      expect(validationOutput.hasFileErrorMessage(errorMessage)).toBe(true);
    });
  });
});

class YamlDimensionValidatorValidateUniqueRelationships extends YamlDimensionValidator {
  constructor() {
    super(
      {} as IYamlCommonReferenceValidator,
      {} as IExpressionValidator,
      yamlErrorContextUtil,
      formatStringMappingMock
    );
  }

  validateUniqueRelationships<T extends IYamlDimensionRelationship>(
    fileAppender: FileOutputAppender,
    relations: Array<T>,
    getError: GetError<T>
  ): void {
    super.validateUniqueRelationships(fileAppender, relations, getError);
  }
}

describe("YamlDimensionValidator.validateUniqueRelationships", () => {
  const relationBuilder = YamlDimensionRelationBuilder.create().with({
    from: {
      dataset: "dataset",
      join_columns: ["col1", "col2"],
    },
    to: {
      level: "level",
    },
  });

  it("Should return error for each of the duplicate relationships", () => {
    const relation1 = relationBuilder.with({ from: { dataset: "ds1", join_columns: ["col1_1", "col1_2"] } }).build();
    const relation2 = relationBuilder.with({ from: { dataset: "ds2", join_columns: ["col2_1", "col2_2"] } }).build();
    const relation3 = relationBuilder.with({ from: { dataset: "ds3", join_columns: ["col3_1", "col3_2"] } }).build();

    const yamlFile = dimensionBuilder
      .addRelationship(relation1)
      .addRelationship(relation1)
      .addRelationship(relation1)
      .addRelationship(relation2)
      .addRelationship(relation2)
      .addRelationship(relation3)
      .buildYamlFile();

    const yamlDimensionValidator = new YamlDimensionValidatorValidateUniqueRelationships();
    const validatorOutput = ValidatorOutput.create();
    yamlDimensionValidator.validateUniqueRelationships(
      validatorOutput.file(yamlFile),
      yamlFile.data.relationships || [],
      yamlDimensionErrors.duplicateSnowflakeRelationshipsMessage as any
    );

    expect(validatorOutput.hasErrors).toBe(true);

    expect(
      validatorOutput.hasFileErrorMessage(
        yamlDimensionErrors.duplicateSnowflakeRelationshipsMessage(relation1 as any, 3)
      )
    ).toBe(true);
    expect(
      validatorOutput.hasFileErrorMessage(
        yamlDimensionErrors.duplicateSnowflakeRelationshipsMessage(relation2 as any, 2)
      )
    ).toBe(true);
  });

  it("Should not return error if dataset differs", () => {
    const relation1 = relationBuilder.with({ from: { dataset: "ds1", join_columns: ["same"] } }).build();
    const relation2 = relationBuilder.with({ from: { dataset: "ds2", join_columns: ["same"] } }).build();

    const yamlFile = dimensionBuilder.addRelationship(relation1).addRelationship(relation2).buildYamlFile();

    const yamlDimensionValidator = new YamlDimensionValidatorValidateUniqueRelationships();
    const validatorOutput = ValidatorOutput.create();
    yamlDimensionValidator.validateUniqueRelationships(
      validatorOutput.file(yamlFile),
      yamlFile.data.relationships || [],
      yamlDimensionErrors.duplicateSnowflakeRelationshipsMessage as any
    );

    expect(validatorOutput.hasErrors).toBe(false);
  });

  it("Should not return error if from join_columns differs", () => {
    const relation1 = relationBuilder.with({ from: { dataset: "same", join_columns: ["col1", "col2"] } }).build();
    const relation2 = relationBuilder.with({ from: { dataset: "same", join_columns: ["col1"] } }).build();

    const yamlFile = dimensionBuilder.addRelationship(relation1).addRelationship(relation2).buildYamlFile();

    const yamlDimensionValidator = new YamlDimensionValidatorValidateUniqueRelationships();
    const validatorOutput = ValidatorOutput.create();
    yamlDimensionValidator.validateUniqueRelationships(
      validatorOutput.file(yamlFile),
      yamlFile.data.relationships || [],
      yamlDimensionErrors.duplicateSnowflakeRelationshipsMessage as any
    );

    expect(validatorOutput.hasErrors).toBe(false);
  });

  it("Should not return error if level differs", () => {
    const relation1 = relationBuilder.with({ to: { level: levelAttributeNames.country } }).build();
    const relation2 = relationBuilder.with({ to: { level: "level2" } }).build();

    const yamlFile = dimensionBuilder.addRelationship(relation1).addRelationship(relation2).buildYamlFile();

    const yamlDimensionValidator = new YamlDimensionValidatorValidateUniqueRelationships();
    const validatorOutput = ValidatorOutput.create();
    yamlDimensionValidator.validateUniqueRelationships(
      validatorOutput.file(yamlFile),
      yamlFile.data.relationships || [],
      yamlDimensionErrors.duplicateSnowflakeRelationshipsMessage as any
    );

    expect(validatorOutput.hasErrors).toBe(false);
  });
});

describe("YamlDimensionValidator.verifyLevelAttributesForDegenerateDim", () => {
  it("Should add an error if the dimension is degenerate and two of its level attributes have the same dataset + key_columns combination", () => {
    const dimension = YamlDimensionBuilder.create()
      .addIsDegenerate(true)
      .addLevelAttribute({
        unique_name: levelAttributeNames.city,
        dataset: dataset_1,
        name_column: column.col1,
        key_columns: [column.col1],
      })
      .addLevelAttribute({
        unique_name: levelAttributeNames.state,
        dataset: dataset_1,
        name_column: column.col1,
        key_columns: [column.col1],
      })
      .buildYamlFile();
    const validatorOutput = ValidatorOutput.create();

    dimensionValidator.verifyLevelAttributesForDegenerateDim(
      dimension.data.level_attributes[0],
      dimension.data,
      validatorOutput.file(dimension)
    );

    expect(validatorOutput.hasErrors).toBe(true);
    expect(
      validatorOutput.hasFileErrorMessage(
        yamlDimensionErrors.duplicateDegenerateDimensionLevelAttributesMessage(
          dataset_1,
          [column.col1],
          [levelAttributeNames.city, levelAttributeNames.state]
        )
      )
    ).toBe(true);
  });

  it("Should not add an error if the dimension is not degenerate", () => {
    const dimension = YamlDimensionBuilder.create()
      .addIsDegenerate(false)
      .addLevelAttribute({
        unique_name: levelAttributeNames.city,
        dataset: dataset_1,
        name_column: column.col1,
        key_columns: [column.col1],
      })
      .addLevelAttribute({
        unique_name: levelAttributeNames.state,
        dataset: dataset_1,
        name_column: column.col1,
        key_columns: [column.col1],
      })
      .buildYamlFile();
    const validatorOutput = ValidatorOutput.create();

    dimensionValidator.verifyLevelAttributesForDegenerateDim(
      dimension.data.level_attributes[0],
      dimension.data,
      validatorOutput.file(dimension)
    );

    expect(validatorOutput.hasErrors).toBe(false);
    expect(validatorOutput.hasWarnings).toBe(false);
  });

  it("Should not add an error if the dimension is degenerate but all level attributes use unique dataset + key_columns combinations", () => {
    const dimension = YamlDimensionBuilder.create()
      .addIsDegenerate(false)
      .addLevelAttribute({
        unique_name: levelAttributeNames.city,
        dataset: dataset_1,
        name_column: column.col1,
        key_columns: [column.col1],
      })
      .addLevelAttribute({
        unique_name: levelAttributeNames.state,
        dataset: dataset_1,
        name_column: column.col2,
        key_columns: [column.col2],
      })
      .addLevelAttribute({
        unique_name: levelAttributeNames.country,
        dataset: dataset_1,
        name_column: column.col3,
        key_columns: [column.col3],
      })
      .buildYamlFile();

    const validatorOutput = ValidatorOutput.create();

    dimensionValidator.verifyLevelAttributesForDegenerateDim(
      dimension.data.level_attributes[0],
      dimension.data,
      validatorOutput.file(dimension)
    );

    expect(validatorOutput.hasErrors).toBe(false);
    expect(validatorOutput.hasWarnings).toBe(false);
  });

  it("Should add an error if the dimension is degenerate and has multiple level attributes with identical multiple datasets and columns", () => {
    const dimension = YamlDimensionBuilder.create()
      .addIsDegenerate(true)
      .addLevelAttributeWithMultipleDatasets({
        unique_name: levelAttributeNames.country,
        shared_degenerate_columns: [{ ...mockedDatasetAndKeyColumns.combination1 }],
      })
      .addLevelAttributeWithMultipleDatasets({
        unique_name: levelAttributeNames.state,
        shared_degenerate_columns: [{ ...mockedDatasetAndKeyColumns.combination1 }],
      })
      .addLevelAttributeWithMultipleDatasets({
        unique_name: levelAttributeNames.city,
        shared_degenerate_columns: [{ ...mockedDatasetAndKeyColumns.combination1 }],
      })
      .buildYamlFile();

    const validatorOutput = ValidatorOutput.create();

    dimensionValidator.verifyLevelAttributesForDegenerateDim(
      dimension.data.level_attributes[0],
      dimension.data,
      validatorOutput.file(dimension)
    );

    expect(validatorOutput.hasErrors).toBe(true);
    expect(
      validatorOutput.hasFileErrorMessage(
        yamlDimensionErrors.duplicateDegenerateDimensionLevelAttributesMessage(
          mockedDatasetAndKeyColumns.combination1.dataset,
          mockedDatasetAndKeyColumns.combination1.key_columns,
          dimension.data.level_attributes.map((la) => la.unique_name)
        )
      )
    ).toBe(true);
    expect(validatorOutput.hasWarnings).toBe(false);
  });

  it("Should not throw an error if the dimension is degenerate with level attributes with different multiple datasets and columns", () => {
    const dimension = YamlDimensionBuilder.create()
      .addIsDegenerate(true)
      .addLevelAttributeWithMultipleDatasets({
        unique_name: levelAttributeNames.country,
        shared_degenerate_columns: [{ ...mockedDatasetAndKeyColumns.combination1 }],
      })
      .addLevelAttributeWithMultipleDatasets({
        unique_name: levelAttributeNames.state,
        shared_degenerate_columns: [{ ...mockedDatasetAndKeyColumns.combination2 }],
      })
      .buildYamlFile();

    const validatorOutput = ValidatorOutput.create();

    dimensionValidator.verifyLevelAttributesForDegenerateDim(
      dimension.data.level_attributes[0],
      dimension.data,
      validatorOutput.file(dimension)
    );

    expect(validatorOutput.hasErrors).toBe(false);
    expect(validatorOutput.hasWarnings).toBe(false);
  });

  describe("YamlDimensionValidator.areTwoLevelDataSourcesEqual", () => {
    it("should return true for equal level data sources", () => {
      const levelDataSources_1 = new Map<string, string[]>([
        [dataset_1, [column.col1, column.col2]],
        [dataset_2, [column.col3]],
      ]);
      const levelDataSources_2 = new Map<string, string[]>([
        [dataset_1, [column.col1, column.col2]],
        [dataset_2, [column.col3]],
      ]);

      expect(dimensionValidator.areTwoLevelDataSourcesEqual(levelDataSources_1, levelDataSources_2)).toBe(true);
    });

    it("should return false for level data sources with different sizes", () => {
      const levelDataSources_1 = new Map<string, string[]>([[dataset_1, [column.col1, column.col2]]]);
      const levelDataSources_2 = new Map<string, string[]>([
        [dataset_1, [column.col1, column.col2]],
        [dataset_2, [column.col3]],
      ]);

      expect(dimensionValidator.areTwoLevelDataSourcesEqual(levelDataSources_1, levelDataSources_2)).toBe(false);
    });

    it("should return false for level data sources with different datasets", () => {
      const levelDataSources_1 = new Map<string, string[]>([[dataset_1, [column.col1, column.col2]]]);
      const levelDataSources_2 = new Map<string, string[]>([[dataset_2, [column.col1, column.col2]]]);

      expect(dimensionValidator.areTwoLevelDataSourcesEqual(levelDataSources_1, levelDataSources_2)).toBe(false);
    });

    it("should return false for level data sources with different columns", () => {
      const levelDataSources_1 = new Map<string, string[]>([[dataset_1, [column.col1, column.col2]]]);
      const levelDataSources_2 = new Map<string, string[]>([[dataset_1, [column.col1, column.col3]]]);

      expect(dimensionValidator.areTwoLevelDataSourcesEqual(levelDataSources_1, levelDataSources_2)).toBe(false);
    });

    it("should return true for level data sources with columns in different order", () => {
      const levelDataSources_1 = new Map<string, string[]>([[dataset_1, [column.col2, column.col1]]]);
      const levelDataSources_2 = new Map<string, string[]>([[dataset_1, [column.col1, column.col2]]]);

      expect(dimensionValidator.areTwoLevelDataSourcesEqual(levelDataSources_1, levelDataSources_2)).toBe(true);
    });

    it("should return false for level data sources with different number of columns", () => {
      const levelDataSources_1 = new Map<string, string[]>([[dataset_1, [column.col1]]]);
      const levelDataSources_2 = new Map<string, string[]>([[dataset_1, [column.col1, column.col2]]]);

      expect(dimensionValidator.areTwoLevelDataSourcesEqual(levelDataSources_1, levelDataSources_2)).toBe(false);
    });
  });

  describe("YamlDimensionValidator.verifyDimensionDatasetsAndColumns", () => {
    const getStandardLevelAttribute = (input: Partial<IYamlLevelFromOneDataset>): IYamlLevelFromOneDataset => {
      return {
        unique_name: levelAttributeNames.country,
        label: levelAttributeNames.country,
        dataset: dataset_1,
        name_column: column.invalid,
        key_columns: [column.col1],
        sort_column: column.col2,
        is_unique_key: true,
        ...input,
      };
    };

    const getMultipleDatasetLevelAttribute = (
      input: Partial<IYamlLevelWithMultipleDatasets>
    ): IYamlLevelWithMultipleDatasets => {
      return {
        unique_name: levelAttributeNames.country,
        label: levelAttributeNames.country,
        shared_degenerate_columns: [
          {
            dataset: dataset_1,
            name_column: column.col1,
            key_columns: [column.col1],
            sort_column: column.col2,
            is_unique_key: true,
          },
          {
            dataset: dataset_2,
            name_column: column.col2,
            key_columns: [column.col2],
            sort_column: column.col3,
            is_unique_key: false,
          },
        ],
        ...input,
      };
    };

    let validatorOutput: ValidatorOutput;
    let elementsMap: Map<string, IYamlParsedFile<IYamlObject>>;
    let referencedObjectIds: Set<string>;

    beforeEach(() => {
      validatorOutput = ValidatorOutput.create();
      elementsMap = new Map<string, IYamlParsedFile<IYamlObject>>();
      referencedObjectIds = new Set<string>();
    });

    describe("For single dataset", () => {
      it("should validate dataset", () => {
        const levelAttribute = getStandardLevelAttribute({ name_column: column.col1 });
        const item = YamlDimensionBuilder.create().addLevelAttribute(levelAttribute).buildYamlFile();

        dimensionValidator.verifyDimensionDatasetsAndColumns({
          levelAttribute,
          item,
          validatorOutput,
          elementsMap,
          referencedObjectIds,
        });

        expect(yamlCommonReferenceValidator.validateAndGetReferencedObject).toHaveBeenCalledWith(
          dataset_1,
          elementsMap,
          item,
          ObjectType.Dataset,
          validatorOutput
        );
        expect(validatorOutput.hasErrors).toBe(false);
      });

      it("should add an error if the name_column does not exist", () => {
        const levelAttribute = getStandardLevelAttribute({ name_column: column.invalid });
        const item = YamlDimensionBuilder.create().addLevelAttribute(levelAttribute).buildYamlFile();

        dimensionValidator.verifyDimensionDatasetsAndColumns({
          levelAttribute,
          item,
          validatorOutput,
          elementsMap,
          referencedObjectIds,
        });

        expect(validatorOutput.hasErrors).toBe(true);
        expect(validatorOutput.hasFileErrorMessage(yamlDimensionErrors.notExistingCol(column.invalid, dataset_1))).toBe(
          true
        );
      });

      it("should add an error if one of the key_columns does not exist", () => {
        const levelAttribute = getStandardLevelAttribute({ key_columns: [column.invalid] });
        const item = YamlDimensionBuilder.create().addLevelAttribute(levelAttribute).buildYamlFile();

        dimensionValidator.verifyDimensionDatasetsAndColumns({
          levelAttribute,
          item,
          validatorOutput,
          elementsMap,
          referencedObjectIds,
        });

        expect(validatorOutput.hasErrors).toBe(true);
        expect(validatorOutput.hasFileErrorMessage(yamlDimensionErrors.notExistingCol(column.invalid, dataset_1))).toBe(
          true
        );
      });

      it("should add an error if the sort_column does not exist", () => {
        const levelAttribute = getStandardLevelAttribute({ sort_column: column.invalid });
        const item = YamlDimensionBuilder.create().addLevelAttribute(levelAttribute).buildYamlFile();

        dimensionValidator.verifyDimensionDatasetsAndColumns({
          levelAttribute,
          item,
          validatorOutput,
          elementsMap,
          referencedObjectIds,
        });

        expect(validatorOutput.hasErrors).toBe(true);
        expect(validatorOutput.hasFileErrorMessage(yamlDimensionErrors.notExistingCol(column.invalid, dataset_1))).toBe(
          true
        );
      });
    });

    describe("For multiple datasets", () => {
      it("should validate datasets", () => {
        const levelAttribute = getMultipleDatasetLevelAttribute({
          shared_degenerate_columns: [
            {
              dataset: dataset_1,
              name_column: column.col3,
              key_columns: [column.col3],
              sort_column: column.col4,
              is_unique_key: true,
            },
            {
              dataset: dataset_2,
              name_column: column.col4,
              key_columns: [column.col4],
              sort_column: column.col5,
              is_unique_key: false,
            },
          ],
        });

        const item = YamlDimensionBuilder.create()
          .addLevelAttributeWithMultipleDatasets(levelAttribute)
          .buildYamlFile();

        dimensionValidator.verifyDimensionDatasetsAndColumns({
          levelAttribute,
          item,
          validatorOutput,
          elementsMap,
          referencedObjectIds,
        });

        expect(yamlCommonReferenceValidator.validateAndGetReferencedObject).toHaveBeenCalledWith(
          dataset_1,
          elementsMap,
          item,
          ObjectType.Dataset,
          validatorOutput
        );
        expect(yamlCommonReferenceValidator.validateAndGetReferencedObject).toHaveBeenCalledWith(
          dataset_2,
          elementsMap,
          item,
          ObjectType.Dataset,
          validatorOutput
        );
        expect(validatorOutput.hasErrors).toBe(false);
      });

      it("should add an error if the name_column does not exist", () => {
        const levelAttribute = getMultipleDatasetLevelAttribute({
          shared_degenerate_columns: [
            {
              dataset: dataset_1,
              name_column: column.invalid,
              key_columns: [column.col1],
              sort_column: column.col2,
              is_unique_key: true,
            },
          ],
        });

        const item = YamlDimensionBuilder.create()
          .addLevelAttributeWithMultipleDatasets(levelAttribute)
          .buildYamlFile();

        dimensionValidator.verifyDimensionDatasetsAndColumns({
          levelAttribute,
          item,
          validatorOutput,
          elementsMap,
          referencedObjectIds,
        });

        expect(validatorOutput.hasErrors).toBe(true);
        expect(validatorOutput.hasFileErrorMessage(yamlDimensionErrors.notExistingCol(column.invalid, dataset_1))).toBe(
          true
        );
      });

      it("should add an error if one of the key_columns does not exist", () => {
        const levelAttribute = getMultipleDatasetLevelAttribute({
          shared_degenerate_columns: [
            {
              dataset: dataset_1,
              name_column: column.col1,
              key_columns: [column.invalid],
              sort_column: column.col2,
              is_unique_key: true,
            },
          ],
        });

        const item = YamlDimensionBuilder.create()
          .addLevelAttributeWithMultipleDatasets(levelAttribute)
          .buildYamlFile();

        dimensionValidator.verifyDimensionDatasetsAndColumns({
          levelAttribute,
          item,
          validatorOutput,
          elementsMap,
          referencedObjectIds,
        });

        expect(validatorOutput.hasErrors).toBe(true);
        expect(validatorOutput.hasFileErrorMessage(yamlDimensionErrors.notExistingCol(column.invalid, dataset_1))).toBe(
          true
        );
      });

      it("should add an error if the sort_column does not exist", () => {
        const levelAttribute = getMultipleDatasetLevelAttribute({
          shared_degenerate_columns: [
            {
              dataset: dataset_1,
              name_column: column.col1,
              key_columns: [column.col2],
              sort_column: column.invalid,
              is_unique_key: true,
            },
          ],
        });

        const item = YamlDimensionBuilder.create()
          .addLevelAttributeWithMultipleDatasets(levelAttribute)
          .buildYamlFile();

        dimensionValidator.verifyDimensionDatasetsAndColumns({
          levelAttribute,
          item,
          validatorOutput,
          elementsMap,
          referencedObjectIds,
        });

        expect(validatorOutput.hasErrors).toBe(true);
        expect(validatorOutput.hasFileErrorMessage(yamlDimensionErrors.notExistingCol(column.invalid, dataset_1))).toBe(
          true
        );
      });
    });
  });

  describe("shared degenerate dimension validations", () => {
    let yamlDataset: IYamlDataset;
    let input: IYamlDimensionValidationInput;
    let item: any;
    let validatorOutput: ValidatorOutput;
    const dimensionYamlFileWithTreeDatasets = YamlDimensionBuilder.create()
      .addIsDegenerate(true)
      .addLevelAttributeWithMultipleDatasets({
        unique_name: levelAttributeNames.country,
        shared_degenerate_columns: shared_degenerate_columns,
      })
      .addLevelAttributeWithMultipleDatasets({
        unique_name: levelAttributeNames.state,
        shared_degenerate_columns: shared_degenerate_columns,
      })
      .addLevelAttributeWithMultipleDatasets({
        unique_name: levelAttributeNames.city,
        shared_degenerate_columns: shared_degenerate_columns,
      })
      .buildYamlFile();

    beforeEach(() => {
      yamlDataset = YamlDatasetBuilder.create()
        .uniqueName(dataset_1)
        .addColumn(column.col1, YamlColumnDataType.String)
        .addColumn(column.col2, YamlColumnDataType.Int)
        .build();
      item = YamlDimensionBuilder.create().addLevelAttributeWithMultipleDatasets().buildYamlFile();

      validatorOutput = ValidatorOutput.create();
      input = {
        item,
        validatorOutput,
        levelAttribute: item.data.level_attributes[0],
        elementsMap: new Map(),
        referencedObjectIds: new Set(),
      };
    });

    it("should return the found column if it exists and has a data type", () => {
      jest.spyOn(dimensionValidator, "getDatasetColumn").mockReturnValue(yamlDataset.columns[0]);
      jest.spyOn(YamlDatasetTypeGuard, "hasColumnDataTypeProp").mockReturnValue(true);

      const result = dimensionValidator.getSharedDegenerateDimensionColumn(yamlDataset, column.col1, input);

      expect(result).toEqual(yamlDataset.columns[0]);
      expect(dimensionValidator.getDatasetColumn).toHaveBeenCalledWith(yamlDataset, column.col1, item, validatorOutput);
      expect(YamlDatasetTypeGuard.hasColumnDataTypeProp).toHaveBeenCalledWith(yamlDataset.columns[0]);
    });

    it("should return undefined if the column does not exist", () => {
      jest.spyOn(dimensionValidator, "getDatasetColumn").mockReturnValue(undefined);

      const result = dimensionValidator.getSharedDegenerateDimensionColumn(yamlDataset, column.invalid, input);

      expect(result).toBeUndefined();
      expect(dimensionValidator.getDatasetColumn).toHaveBeenCalledWith(
        yamlDataset,
        column.invalid,
        item,
        validatorOutput
      );
    });

    it("should return undefined if the column does not have a data type", () => {
      jest.spyOn(dimensionValidator, "getDatasetColumn").mockReturnValue(yamlDataset.columns[0]);
      jest.spyOn(YamlDatasetTypeGuard, "hasColumnDataTypeProp").mockReturnValue(false);

      const result = dimensionValidator.getSharedDegenerateDimensionColumn(yamlDataset, column.col1, input);

      expect(result).toBeUndefined();
      expect(dimensionValidator.getDatasetColumn).toHaveBeenCalledWith(yamlDataset, column.col1, item, validatorOutput);
      expect(YamlDatasetTypeGuard.hasColumnDataTypeProp).toHaveBeenCalledWith(yamlDataset.columns[0]);
    });

    it("should not add an error if all columns have the same data type", () => {
      const groupedKeyColumns: Array<IYamlDatasetColumnSimple | IYamlDatasetColumnDerived> = [
        { name: column.col1, data_type: YamlColumnDataType.String } as IYamlDatasetColumnSimple,
        { name: column.col2, data_type: YamlColumnDataType.String } as IYamlDatasetColumnSimple,
      ];

      dimensionValidator.validateSharedDegenerateDimensionColumn(groupedKeyColumns, "Key columns", input);

      expect(validatorOutput.hasErrors).toBe(false);
    });

    it("should group columns by data type and add an error if there are multiple data types", () => {
      const groupedKeyColumns: Array<IYamlDatasetColumnSimple | IYamlDatasetColumnDerived> = [
        { name: column.col1, data_type: YamlColumnDataType.String } as IYamlDatasetColumnSimple,
        { name: column.col2, data_type: YamlColumnDataType.Int } as IYamlDatasetColumnSimple,
        { name: column.col3, data_type: YamlColumnDataType.String } as IYamlDatasetColumnSimple,
      ];

      const groupedColumns = new Map([
        [YamlColumnDataType.String, [groupedKeyColumns[0], groupedKeyColumns[2]]],
        [YamlColumnDataType.Int, [groupedKeyColumns[1]]],
      ]);
      jest.spyOn(YamlValidatorUtil, "groupBy").mockReturnValue(groupedColumns);

      dimensionValidator.validateSharedDegenerateDimensionColumn(groupedKeyColumns, "Key columns", input);

      expect(validatorOutput.hasErrors).toBe(true);
      expect(
        validatorOutput.hasFileErrorMessage(
          yamlDimensionErrors.sharedDegenerateLevelColumnsError(
            "Key columns",
            input.levelAttribute.unique_name,
            getErrorForDifferentColumnTypes(groupedColumns)
          )
        )
      ).toBe(true);
    });

    describe("YamlDimensionValidator.getLevelAttributeColumnsByType", () => {
      it("should return grouped columns by type excluding undefined sort columns for level attributes with multiple datasets", () => {
        const mockedColumn = { name: column.col1, data_type: YamlColumnDataType.String };
        jest.spyOn(dimensionValidator, "getYamlDataset").mockReturnValue(yamlDataset);
        jest.spyOn(dimensionValidator, "getSharedDegenerateDimensionColumn").mockReturnValue(mockedColumn);

        const result = dimensionValidator.getLevelAttributeColumnsByType(input);

        expect(result.groupedKeyColumns).toEqual([mockedColumn]);
        expect(result.groupedValueColumns).toEqual([mockedColumn]);
        expect(result.groupedSortColumns).toEqual([]);
      });

      it("should return grouped columns by type including sort columns for level attributes with multiple datasets", () => {
        const mockedColumn = { name: column.col1, data_type: YamlColumnDataType.String };
        jest.spyOn(dimensionValidator, "getYamlDataset").mockReturnValue(yamlDataset);
        jest.spyOn(dimensionValidator, "getSharedDegenerateDimensionColumn").mockReturnValue(mockedColumn);

        const item = YamlDimensionBuilder.create()
          .addLevelAttributeWithMultipleDatasets({
            shared_degenerate_columns: [
              {
                dataset: "dataset",
                key_columns: ["key_column"],
                name_column: "name_column",
                sort_column: "sort_column",
              },
            ],
          })
          .buildYamlFile();

        const newInput = { ...input, item, levelAttribute: item.data.level_attributes[0] };
        const result = dimensionValidator.getLevelAttributeColumnsByType(newInput);

        expect(result.groupedKeyColumns).toEqual([mockedColumn]);
        expect(result.groupedValueColumns).toEqual([mockedColumn]);
        expect(result.groupedSortColumns).toEqual([mockedColumn]);
      });

      it("should return empty arrays if no datasets are found", () => {
        jest.spyOn(dimensionValidator, "getYamlDataset").mockReturnValue(undefined);

        const result = dimensionValidator.getLevelAttributeColumnsByType(input);

        expect(result.groupedKeyColumns).toEqual([]);
        expect(result.groupedValueColumns).toEqual([]);
        expect(result.groupedSortColumns).toEqual([]);
      });

      it("should return empty arrays if no columns are found", () => {
        jest.spyOn(dimensionValidator, "getYamlDataset").mockReturnValue(yamlDataset);
        jest.spyOn(dimensionValidator, "getSharedDegenerateDimensionColumn").mockReturnValue(undefined);

        const result = dimensionValidator.getLevelAttributeColumnsByType(input);

        expect(result.groupedKeyColumns).toEqual([]);
        expect(result.groupedValueColumns).toEqual([]);
        expect(result.groupedSortColumns).toEqual([]);
      });
    });
    describe("groupSharedLevelAttributesByDataset", () => {
      it("should group shared level attributes by dataset for a single level attribute", () => {
        const dimensionYamlFile = YamlDimensionBuilder.create()
          .addIsDegenerate(true)
          .addLevelAttributeWithMultipleDatasets({
            unique_name: levelAttributeNames.country,
            shared_degenerate_columns: shared_degenerate_columns,
          })
          .build();
        const result = dimensionValidator.groupSharedLevelAttributesByDataset(dimensionYamlFile);

        expect(result.get(dataset_1)).toEqual([levelAttributeNames.country]);
        expect(result.get(dataset_2)).toEqual([levelAttributeNames.country]);
      });

      it("should group shared level attributes by dataset for multiple level attributes", () => {
        const result = dimensionValidator.groupSharedLevelAttributesByDataset(dimensionYamlFileWithTreeDatasets.data);

        expect(result.get(dataset_1)).toEqual([
          levelAttributeNames.country,
          levelAttributeNames.state,
          levelAttributeNames.city,
        ]);
        expect(result.get(dataset_2)).toEqual([
          levelAttributeNames.country,
          levelAttributeNames.state,
          levelAttributeNames.city,
        ]);
      });

      it("should handle empty shared_degenerate_columns", () => {
        const dimensionYamlFile = YamlDimensionBuilder.create()
          .addIsDegenerate(true)
          .addLevelAttributeWithMultipleDatasets({
            unique_name: levelAttributeNames.country,
            shared_degenerate_columns: [],
          })
          .build();

        const result = dimensionValidator.groupSharedLevelAttributesByDataset(dimensionYamlFile);

        expect(result.size).toBe(0);
      });

      it("should return an empty list if the dimension is not degenerate", () => {
        const dimensionYamlFile = YamlDimensionBuilder.create()
          .addIsDegenerate(false)
          .addLevelAttributeWithMultipleDatasets({
            unique_name: levelAttributeNames.country,
            shared_degenerate_columns: shared_degenerate_columns,
          })
          .build();
        const result = dimensionValidator.groupSharedLevelAttributesByDataset(dimensionYamlFile);

        expect(result.size).toBe(0);
      });
    });

    describe("verifySharedDegenerateDimsDatasetsUsage", () => {
      it("should not add an error if all level attributes point to the same datasets (single level attribute)", () => {
        const dimensionYamlFile = YamlDimensionBuilder.create()
          .addIsDegenerate(true)
          .addLevelAttributeWithMultipleDatasets({
            unique_name: levelAttributeNames.country,
            shared_degenerate_columns: shared_degenerate_columns,
          })
          .buildYamlFile();

        dimensionValidator.verifySharedDegenerateDimsDatasetsUsage(
          dimensionYamlFile.data,
          validatorOutput.file(dimensionYamlFileWithTreeDatasets)
        );

        expect(validatorOutput.hasErrors).toBe(false);
      });

      it("should not add an error if all level attributes point to the same datasets (multiple level attributes)", () => {
        dimensionValidator.verifySharedDegenerateDimsDatasetsUsage(
          dimensionYamlFileWithTreeDatasets.data,
          validatorOutput.file(dimensionYamlFileWithTreeDatasets)
        );

        expect(validatorOutput.hasErrors).toBe(false);
      });

      it("should add an error if level attributes do not point to the same datasets", () => {
        const dimensionYamlFile = YamlDimensionBuilder.create()
          .addIsDegenerate(true)
          .addLevelAttributeWithMultipleDatasets({
            unique_name: levelAttributeNames.country,
            shared_degenerate_columns: shared_degenerate_columns,
          })
          .addLevelAttributeWithMultipleDatasets({
            unique_name: levelAttributeNames.state,
            shared_degenerate_columns: [shared_degenerate_columns[0]],
          })
          .addLevelAttributeWithMultipleDatasets({
            unique_name: levelAttributeNames.city,
            shared_degenerate_columns: shared_degenerate_columns,
          })
          .buildYamlFile();

        dimensionValidator.verifySharedDegenerateDimsDatasetsUsage(
          dimensionYamlFile.data,
          validatorOutput.file(dimensionYamlFile)
        );

        expect(validatorOutput.hasWarnings).toBe(true);
        expect(
          validatorOutput.hasFileWarningMessage(
            yamlDimensionErrors.sharedLevelAttributesNotPointingToSameDatasets(
              dataset_2,
              2,
              dimensionYamlFile.data.level_attributes.length
            )
          )
        ).toBe(true);
      });
    });
    describe("YamlDimensionValidator.verifyDegenerateDimsLevelTypes", () => {
      it("should not add an error if the dimension is not degenerate", () => {
        const dimension = YamlDimensionBuilder.create()
          .addIsDegenerate(false)
          .addLevelAttribute({ unique_name: levelAttributeNames.city, dataset: dataset_1, name_column: column.col1 })
          .buildYamlFile();

        dimensionValidator.verifyDegenerateDimsLevelTypes(dimension.data, validatorOutput.file(dimension));

        expect(validatorOutput.hasErrors).toBe(false);
      });

      it("should not add an error if all level attributes are from one dataset", () => {
        const dimension = YamlDimensionBuilder.create()
          .addIsDegenerate(true)
          .addLevelAttribute({ unique_name: levelAttributeNames.city, dataset: dataset_1, name_column: column.col1 })
          .addLevelAttribute({ unique_name: levelAttributeNames.state, dataset: dataset_1, name_column: column.col2 })
          .buildYamlFile();

        dimensionValidator.verifyDegenerateDimsLevelTypes(dimension.data, validatorOutput.file(dimension));

        expect(validatorOutput.hasErrors).toBe(false);
      });

      it("should not add an error if all level attributes are from multiple datasets and point to the same datasets", () => {
        dimensionValidator.verifyDegenerateDimsLevelTypes(
          dimensionYamlFileWithTreeDatasets.data,
          validatorOutput.file(dimensionYamlFileWithTreeDatasets)
        );

        expect(validatorOutput.hasErrors).toBe(false);
      });

      it("should add an error if level attributes are mixed between single and multiple datasets", () => {
        const dimension = YamlDimensionBuilder.create()
          .addIsDegenerate(true)
          .addLevelAttribute({ unique_name: levelAttributeNames.city, dataset: dataset_1, name_column: column.col1 })
          .addLevelAttributeWithMultipleDatasets({
            unique_name: levelAttributeNames.state,
            shared_degenerate_columns: shared_degenerate_columns,
          })
          .buildYamlFile();

        dimensionValidator.verifyDegenerateDimsLevelTypes(dimension.data, validatorOutput.file(dimension));

        expect(validatorOutput.hasErrors).toBe(true);
        expect(
          validatorOutput.hasFileErrorMessage(
            yamlDimensionErrors.degenerateDimensionLevelAttributesTypeError(
              [levelAttributeNames.city],
              [levelAttributeNames.state]
            )
          )
        ).toBe(true);
      });

      it("should call verifySharedDegenerateDimsDatasetsUsage if all level attributes are from multiple datasets", () => {
        const spy = jest.spyOn(dimensionValidator, "verifySharedDegenerateDimsDatasetsUsage");

        dimensionValidator.verifyDegenerateDimsLevelTypes(
          dimensionYamlFileWithTreeDatasets.data,
          validatorOutput.file(dimensionYamlFileWithTreeDatasets)
        );

        expect(spy).toHaveBeenCalled();
      });
    });

    describe("YamlDimensionValidator.validateDegenerateDimensionSecondaryAttribute", () => {
      const secondaryAttribute = AnyObjectBuilder.from<IYamlDimensionSecondaryAttribute>({
        dataset: dataset_1,
        label: levelAttributeNames.country,
        name_column: `${levelAttributeNames.country}_name_column`,
        unique_name: levelAttributeNames.country,
      }).build();

      it("should add an error if the level attribute is found and has multiple datasets", () => {
        const dimensionFile = YamlDimensionBuilder.create()
          .addIsDegenerate(true)
          .addLevelAttributeWithMultipleDatasets({ unique_name: levelAttributeNames.city })
          .addHierarchy({
            unique_name: "hierarchy.h_1",
            levels: [{ unique_name: levelAttributeNames.city }],
          })
          .addSecondaryAttribute(secondaryAttribute)
          .buildYamlFile();

        dimensionValidator.validateDegenerateDimensionSecondaryAttribute(
          secondaryAttribute,
          dimensionFile.data.level_attributes[0],
          dimensionFile.data,
          validatorOutput.file(dimensionFile)
        );

        expect(validatorOutput.hasErrors).toBe(true);
        expect(
          validatorOutput.hasFileErrorMessage(
            yamlDimensionErrors.secondaryAttributeInMultipleDatasetLAError(
              levelAttributeNames.city,
              levelAttributeNames.country
            )
          )
        ).toBe(true);
      });

      it("should not add an error if the level attribute is found but does not have multiple datasets", () => {
        const dimensionFile = YamlDimensionBuilder.create()
          .addIsDegenerate(true)
          .addLevelAttribute({ unique_name: levelAttributeNames.city })
          .addHierarchy({
            unique_name: "hierarchy.h_1",
            levels: [{ unique_name: levelAttributeNames.city }],
          })
          .addSecondaryAttribute(secondaryAttribute)
          .buildYamlFile();

        dimensionValidator.validateDegenerateDimensionSecondaryAttribute(
          secondaryAttribute,
          dimensionFile.data.level_attributes[0],
          dimensionFile.data,
          validatorOutput.file(dimensionFile)
        );

        expect(validatorOutput.hasErrors).toBe(false);
      });
    });

    describe("YamlDimensionValidator.validateNumberOfSortColumnsColumn", () => {
      let dimensionFile: IYamlFile<IYamlDimension>;

      beforeEach(() => {
        dimensionFile = YamlDimensionBuilder.create()
          .addIsDegenerate(true)
          .addLevelAttributeWithMultipleDatasets({ unique_name: levelAttributeNames.city })
          .buildYamlFile();
      });

      it("should add an error if the number of sort columns is not zero and does not match the number of key columns", () => {
        const groupedKeyColumns = [
          { name: column.col1, data_type: YamlColumnDataType.String },
          { name: column.col2, data_type: YamlColumnDataType.String },
        ];
        const groupedSortColumns = [{ name: column.col1, data_type: YamlColumnDataType.String }];

        dimensionValidator.validateNumberOfSortColumnsColumn(
          groupedKeyColumns,
          groupedSortColumns,
          dimensionFile.data.level_attributes[0],
          dimensionFile,
          validatorOutput
        );

        expect(validatorOutput.hasErrors).toBe(true);
        expect(
          validatorOutput.hasFileErrorMessage(
            yamlDimensionErrors.numberOfSortColumnsInMultipleDatasetsDegenerateError(
              dimensionFile.data.level_attributes[0].unique_name
            )
          )
        ).toBe(true);
      });

      it("should not add an error if the number of sort columns is zero", () => {
        const groupedKeyColumns = [
          { name: column.col1, data_type: YamlColumnDataType.String },
          { name: column.col2, data_type: YamlColumnDataType.String },
        ];
        const groupedSortColumns: Array<IYamlDatasetColumnSimple | IYamlDatasetColumnDerived> = [];

        dimensionValidator.validateNumberOfSortColumnsColumn(
          groupedKeyColumns,
          groupedSortColumns,
          dimensionFile.data.level_attributes[0],
          dimensionFile,
          validatorOutput
        );

        expect(validatorOutput.hasErrors).toBe(false);
      });

      it("should not add an error if the number of sort columns matches the number of key columns", () => {
        const groupedKeyColumns = [
          { name: column.col1, data_type: YamlColumnDataType.String },
          { name: column.col2, data_type: YamlColumnDataType.String },
        ];
        const groupedSortColumns = [
          { name: column.col1, data_type: YamlColumnDataType.String },
          { name: column.col2, data_type: YamlColumnDataType.String },
        ];

        dimensionValidator.validateNumberOfSortColumnsColumn(
          groupedKeyColumns,
          groupedSortColumns,
          dimensionFile.data.level_attributes[0],
          item,
          validatorOutput
        );

        expect(validatorOutput.hasErrors).toBe(false);
      });
    });
    describe("YamlDimensionValidator.verifyNormalDimensionsHaveASingleDataset", () => {
      it("should add an error if the dimension is not degenerate and the level attribute has multiple datasets", () => {
        jest.spyOn(YamlDimensionTypeGuard, "isLevelWithMultipleDatasets").mockReturnValue(true);
        const dimensionFile = YamlDimensionBuilder.create()
          .addIsDegenerate(false)
          .addLevelAttributeWithMultipleDatasets({ unique_name: levelAttributeNames.city })
          .buildYamlFile();
        dimensionValidator.verifyNormalDimensionsHaveASingleDataset(
          dimensionFile.data.level_attributes[0],
          dimensionFile.data,
          validatorOutput.file(dimensionFile)
        );

        expect(validatorOutput.hasErrors).toBe(true);
        expect(
          validatorOutput.hasFileErrorMessage(
            yamlDimensionErrors.multipleDatasetsInNormalDimensionNotAllowed(levelAttributeNames.city)
          )
        ).toBe(true);
      });

      it("should not add an error if the dimension is degenerate", () => {
        jest.spyOn(YamlDimensionTypeGuard, "isLevelWithMultipleDatasets").mockReturnValue(true);
        const dimensionFile = YamlDimensionBuilder.create()
          .addIsDegenerate(true)
          .addLevelAttributeWithMultipleDatasets({ unique_name: levelAttributeNames.city })
          .buildYamlFile();
        dimensionValidator.verifyNormalDimensionsHaveASingleDataset(
          dimensionFile.data.level_attributes[0],
          dimensionFile.data,
          validatorOutput.file(dimensionFile)
        );

        expect(validatorOutput.hasErrors).toBe(false);
      });

      it("should not add an error if the level attribute does not have multiple datasets", () => {
        jest.spyOn(YamlDimensionTypeGuard, "isLevelWithMultipleDatasets").mockReturnValue(false);
        const dimensionFile = YamlDimensionBuilder.create()
          .addIsDegenerate(false)
          .addLevelAttribute({ unique_name: levelAttributeNames.city })
          .buildYamlFile();
        dimensionValidator.verifyNormalDimensionsHaveASingleDataset(
          dimensionFile.data.level_attributes[0],
          dimensionFile.data,
          validatorOutput.file(dimensionFile)
        );

        expect(validatorOutput.hasErrors).toBe(false);
      });
    });
  });
});
