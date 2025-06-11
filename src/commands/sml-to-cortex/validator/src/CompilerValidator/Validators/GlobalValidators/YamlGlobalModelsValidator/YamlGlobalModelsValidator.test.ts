import YamlCalculatedMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlCalculatedMeasureBuilder";
import YamlCompositeModelBuilder from "models/src/builders/YamlObjectBuilders/YamlCompositeModelBuilder";
import YamlDimensionBuilder from "models/src/builders/YamlObjectBuilders/YamlDimensionBuilder";
import YamlMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlMeasureBuilder";
import YamlModelBuilder from "models/src/builders/YamlObjectBuilders/YamlModelBuilder";
import { IYamlFile } from "models/src/IYamlFile";
import { IYamlDimension } from "models/src/yaml/IYamlDimension";
import { IYamlModel } from "models/src/yaml/IYamlModel";
import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import {
  IModelQueryableItems,
  ModelQueryableMetric,
  ModelQueryableMetricType,
  YamlModelQueryNameResolver,
} from "../../../../YamlModelQueryNameResolver/YamlModelQueryNameResolver";
import {
  degenerateDimensionsMock_1,
  degenerateDimensionsMock_2,
  degenerateDimensionsMock_3,
  getDegenerateDimensionUtilMock,
  mockedDatasetAndKeyColumns,
  modelFileMock,
  yamlParsedFilesMock,
} from "../../Utils/YamlDegenerateDimensionTestUtil";
import { createUniqueDegenerateDimensionKey } from "../../Utils/YamlDegenerateDimensionUtil";
import YamlValidatorTestUtil from "../../YamlObjectReferenceValidators/YamlValidatorTestUtil";
import { globalModelsErrors, YamlGlobalModelsValidator } from "./YamlGlobalModelsValidator";
import { YamlModelCalcMeasuresCycleRefValidator } from "./YamlModelMeasuresCycleRefValidator/YamlModelCalcMeasuresCycleRefValidator";

const modelBuilder = YamlModelBuilder.create();
const compositeModelBuilder = YamlCompositeModelBuilder.create();
const yamlCalculatedMeasureBuilder = YamlCalculatedMeasureBuilder.create();
const measureBuilder = YamlMeasureBuilder.create();

const measureQueryableItem = AnyObjectBuilder.from<ModelQueryableMetric>({
  file: measureBuilder.buildYamlFile(),
  fileChain: [],
  queryName: "no query name",
  uniqueName: "no unique name",
  fullQueryName: "no full query name",
  label: "no label",
  type: ModelQueryableMetricType.Metric,
});

const getMeasure = (input: {
  queryName?: string;
  uniqueName: string;
  fileName?: string;
  fileChain?: Array<string>;
}): ModelQueryableMetric => {
  return measureQueryableItem
    .with({
      queryName: input.queryName ?? input.uniqueName,
      uniqueName: input.uniqueName,
      file: measureBuilder.buildYamlFile(),
    })
    .build();
};

const mockCalcName = "mockCalcName";

const getCalcMeasure = (metricName: string) => {
  return yamlCalculatedMeasureBuilder
    .uniqueName(mockCalcName)
    .with({
      expression: YamlValidatorTestUtil.generateValidMdx(metricName),
    })
    .buildYamlFile();
};

const measureName = {
  m1: "measure1",
  m2: "measure2",
  m3: "measure3",
};

const yamlDimensionBuilder = YamlDimensionBuilder.create();

const buildElementsMap = (
  input: Array<{ key: string; value: Array<IYamlFile<IYamlDimension>> }>
): Map<string, Array<IYamlFile<IYamlDimension>>> => {
  const elementsMap = new Map<string, Array<IYamlFile<IYamlDimension>>>();
  input.forEach((e) => {
    elementsMap.set(e.key, e.value);
  });

  return elementsMap;
};

let validator: YamlGlobalModelsValidator;
let validationOutput: ValidatorOutput;

const createValidator = (buildQueryableItemsResponse?: IModelQueryableItems) => {
  class YamlModelQueryNameResolverTest {
    buildQueryableItems(): IModelQueryableItems {
      return {
        dimensions: buildQueryableItemsResponse?.dimensions || [],
        metrics: buildQueryableItemsResponse?.metrics || [],
        aggregates: [],
      };
    }
  }

  const mockQueryNameResolver = new YamlModelQueryNameResolverTest() as unknown as YamlModelQueryNameResolver;
  const mockModelCalcCycleRefValidator = { validate: jest.fn() } as unknown as YamlModelCalcMeasuresCycleRefValidator;
  const mockYamlDegenerateDimensionUtil = getDegenerateDimensionUtilMock();
  validator = YamlGlobalModelsValidator.create(
    mockYamlDegenerateDimensionUtil,
    mockQueryNameResolver,
    mockModelCalcCycleRefValidator
  );
  validationOutput = ValidatorOutput.create();
};

describe("YamlGlobalModelsValidator", () => {
  beforeEach(() => {
    createValidator();
  });

  describe("validate", () => {
    it("Should not return a global error if there is at least one Model file in folder structure", () => {
      const validationOutput = validator.validate([modelBuilder.buildYamlFile()]);

      expect(validationOutput.globalOutput).toHaveLength(0);
    });

    it("Should return a global error if there are missing Model files in the folder structure", () => {
      const validationOutput = validator.validate([]);

      expect(validationOutput.hasGlobalMessage(globalModelsErrors.missingModels)).toBeTruthy();
    });

    it("Should return an error if the calculated measure expression does not reference to metric", () => {
      const calcMeasure = getCalcMeasure(measureName.m1);
      const model = modelBuilder.addMetrics(mockCalcName).buildYamlFile();

      const validationOutput = validator.validate([model, calcMeasure]);

      expect(validationOutput.hasErrors).toBe(true);
      expect(
        validationOutput.hasFileErrorMessage(
          globalModelsErrors.getCalcMeasureContainsANonExistingMeasure(mockCalcName, measureName.m1)
        )
      ).toBe(true);
    });

    it("Should NOT return an error if the calculated measure expression has metric reference", () => {
      const calcMeasure = getCalcMeasure(measureName.m1);
      const measure = YamlMeasureBuilder.create().uniqueName(measureName.m2).buildYamlFile();
      const model = modelBuilder.addMetrics(mockCalcName, measureName.m1).buildYamlFile();
      createValidator({
        dimensions: [],
        metrics: [{ uniqueName: measureName.m1, queryName: measureName.m1 } as ModelQueryableMetric],
        aggregates: [],
      });

      const validationOutput = validator.validate([model, calcMeasure, measure]);

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("Should return an error if the calculated measure expression does not reference to metric of composite model dependency model", () => {
      const calcMeasure = getCalcMeasure(measureName.m1);
      const measure1 = measureBuilder.uniqueName(measureName.m1).buildYamlFile();
      const model = modelBuilder.buildYamlFile();
      const compositeModel = compositeModelBuilder
        .uniqueName("composite")
        .addModel(model.data.unique_name)
        .addMetrics(mockCalcName)
        .buildYamlFile();

      validator = YamlGlobalModelsValidator.create();
      const validationOutput = validator.validate([compositeModel, model, calcMeasure, measure1]);

      expect(validationOutput.hasErrors).toBe(true);
      expect(
        validationOutput.hasFileErrorMessage(
          globalModelsErrors.getCalcMeasureContainsANonExistingMeasure(mockCalcName, measureName.m1)
        )
      ).toBe(true);
    });

    it("Should NOT return an error if the calculated measure expression has metric reference of composite model dependency model", () => {
      const calcMeasure = getCalcMeasure(measureName.m1);
      const measure1 = measureBuilder.uniqueName(measureName.m1).buildYamlFile();
      const model = modelBuilder.addMetric(measureName.m1).buildYamlFile();
      const compositeModel = compositeModelBuilder
        .uniqueName("composite")
        .addModel(model.data.unique_name)
        .addMetrics(mockCalcName)
        .buildYamlFile();

      validator = YamlGlobalModelsValidator.create();
      const validationOutput = validator.validate([compositeModel, model, calcMeasure, measure1]);

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("Should not duplicate an error for a composite model that has a dependency model with calculated expression error", () => {
      const calcMeasure = getCalcMeasure(measureName.m1);
      const measure1 = measureBuilder.uniqueName(measureName.m1).buildYamlFile();
      const model = modelBuilder.addMetrics(mockCalcName).buildYamlFile();
      const compositeModel = compositeModelBuilder
        .uniqueName("composite")
        .addModel(model.data.unique_name)
        .buildYamlFile();

      validator = YamlGlobalModelsValidator.create();
      const validationOutput = validator.validate([compositeModel, model, calcMeasure, measure1]);
      const filesWithErrors = validationOutput.getFilesWithErrors();

      expect(validationOutput.hasErrors).toBe(true);
      expect(filesWithErrors.length).toBe(1);
      expect(filesWithErrors[0].relativePath).toBe(model.relativePath);
      expect(
        validationOutput.hasFileErrorMessage(
          globalModelsErrors.getCalcMeasureContainsANonExistingMeasure(mockCalcName, measureName.m1)
        )
      ).toBe(true);
    });

    it("Should NOT return an error if the calculated measure expression has calculated measure", () => {
      const calcMeasure = getCalcMeasure(measureName.m1);
      const calcMeasure2 = yamlCalculatedMeasureBuilder.uniqueName(measureName.m1).buildYamlFile();
      const model = modelBuilder.addMetrics(mockCalcName, measureName.m1).buildYamlFile();
      createValidator({
        dimensions: [],
        metrics: [{ uniqueName: measureName.m1, queryName: measureName.m1 } as ModelQueryableMetric],
        aggregates: [],
      });

      const validationOutput = validator.validate([model, calcMeasure, calcMeasure2]);

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("Should NOT return an error if the calculated measure expression has dimension metrical attribute", () => {
      const calcMeasure = getCalcMeasure(measureName.m1);
      const dimensionName = "dimensionName";
      const dimension = yamlDimensionBuilder
        .uniqueName(dimensionName)
        .addMetric({ unique_name: measureName.m1 })
        .buildYamlFile();
      const model = modelBuilder
        .addMetrics(mockCalcName, measureName.m1)
        .addRelationship({ to: { dimension: "dimension1", level: "" } })
        .buildYamlFile();
      createValidator({
        dimensions: [],
        metrics: [{ uniqueName: measureName.m1, queryName: measureName.m1 } as ModelQueryableMetric],
        aggregates: [],
      });

      const validationOutput = validator.validate([model, calcMeasure, dimension]);

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("Should NOT return an error if the calculated measure expression has override metric", () => {
      const overrides = YamlValidatorTestUtil.createOverrides({
        [measureName.m1]: measureName.m2,
      });
      const calcMeasure = yamlCalculatedMeasureBuilder
        .uniqueName(mockCalcName)
        .with({
          expression: YamlValidatorTestUtil.generateValidMdx(measureName.m2),
        })
        .buildYamlFile();
      const override = yamlCalculatedMeasureBuilder.uniqueName(measureName.m1).buildYamlFile();
      const model = modelBuilder.addMetrics(mockCalcName, measureName.m1).withOverrides(overrides).buildYamlFile();
      createValidator({
        dimensions: [],
        metrics: [{ uniqueName: measureName.m1, queryName: measureName.m2 } as ModelQueryableMetric],
        aggregates: [],
      });

      const validationOutput = validator.validate([model, calcMeasure, override]);

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("Should NOT return an error if the composite model has no duplicate metrics with metrical attributes", () => {
      const dimensionName = "dimensionName";
      const measure2 = measureBuilder.uniqueName(measureName.m2).buildYamlFile();
      const dimension = yamlDimensionBuilder
        .uniqueName(dimensionName)
        .addMetric({ unique_name: measureName.m1 })
        .buildYamlFile();
      const model1 = modelBuilder
        .uniqueName("model1")
        .addRelationship({ to: { dimension: dimensionName, level: "" } })
        .buildYamlFile();
      const model2 = modelBuilder.uniqueName("model2").addMetrics(measureName.m2).buildYamlFile();
      const compositeModel = compositeModelBuilder
        .uniqueName("composite")
        .addModels([model1.data.unique_name, model2.data.unique_name])
        .buildYamlFile();

      validator = YamlGlobalModelsValidator.create();
      const validationOutput = validator.validate([model1, model2, compositeModel, dimension, measure2]);

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("Should return an error if the composite model has duplicate metrics with metrical attributes", () => {
      const dimensionName = "dimensionName";
      const measure1 = measureBuilder.uniqueName(measureName.m1).buildYamlFile();
      const dimension = yamlDimensionBuilder
        .uniqueName(dimensionName)
        .addMetric({ unique_name: measureName.m1 })
        .buildYamlFile();
      const model1 = modelBuilder
        .uniqueName("model1")
        .addRelationship({ to: { dimension: dimensionName, level: "no unique name" } })
        .buildYamlFile();
      const model2 = modelBuilder.uniqueName("model2").addMetrics(measureName.m1).buildYamlFile();
      const compositeModel = compositeModelBuilder
        .uniqueName("composite")
        .addModels([model1.data.unique_name, model2.data.unique_name])
        .buildYamlFile();

      validator = YamlGlobalModelsValidator.create();
      const validationOutput = validator.validate([model1, model2, compositeModel, dimension, measure1]);

      expect(validationOutput.hasErrors).toBe(true);
      expect(
        validationOutput.hasFileErrorMessage(
          globalModelsErrors.getDuplicateMetricError(compositeModel.data as unknown as IYamlModel, [
            getMeasure({ uniqueName: measureName.m1 }),
          ])
        )
      ).toBe(true);
    });
  });

  describe("verifyQueryNameMetricsDuplicates", () => {
    const modelFileOne = modelBuilder.uniqueName("model_one").buildYamlFile();

    it("Should return NO errors for metrics if queryNames are unique", () => {
      const measure1 = getMeasure({ uniqueName: measureName.m1 });
      const measure2 = getMeasure({ uniqueName: measureName.m2 });
      validator.verifyQueryNameMetricsDuplicates([measure1, measure2], modelFileOne, validationOutput);

      expect(validationOutput.hasErrors).toBe(false);
    });

    it("Should return errors for all the metrics queryNames that are NOT unique", () => {
      const measure1 = getMeasure({ uniqueName: measureName.m1 });
      const measure2 = getMeasure({ uniqueName: measureName.m1 });
      const measure3 = getMeasure({ uniqueName: measureName.m2 });
      const measure4 = getMeasure({ uniqueName: measureName.m2 });
      const measure5 = getMeasure({ uniqueName: measureName.m3 });
      const quearyableMeasures = [measure1, measure2, measure3, measure4, measure5];

      validator.verifyQueryNameMetricsDuplicates(quearyableMeasures, modelFileOne, validationOutput);

      const errorMsg1 = validationOutput.hasFileErrorMessage(
        globalModelsErrors.getDuplicateMetricError(modelFileOne.data, [measure1, measure2])
      );
      const errorMsg2 = validationOutput.hasFileErrorMessage(
        globalModelsErrors.getDuplicateMetricError(modelFileOne.data, [measure3, measure4])
      );

      expect(errorMsg1).toBe(true);
      expect(errorMsg2).toBe(true);
    });

    it("Should return errors WITHOUT CASE SENSITIVITY for all the metrics queryNames that are NOT unique", () => {
      const measure = getMeasure({ uniqueName: measureName.m1 });
      const measureUpperCase = getMeasure({ uniqueName: measureName.m1.toUpperCase() });
      const quearyableMeasures = [measure, measureUpperCase];

      validator.verifyQueryNameMetricsDuplicates(quearyableMeasures, modelFileOne, validationOutput);

      const errorMsg = validationOutput.hasFileErrorMessage(
        globalModelsErrors.getDuplicateMetricError(modelFileOne.data, quearyableMeasures)
      );
      expect(errorMsg).toBe(true);
    });
  });
  describe("Degenerate Dimensions verifications", () => {
    describe("verifyDegenerateDimensionsInModel", () => {
      it("Should not return an error if there are no duplicated degenerate dimensions used a model", () => {
        validator = YamlGlobalModelsValidator.create(getDegenerateDimensionUtilMock(buildElementsMap([])));
        validationOutput = ValidatorOutput.create();

        validator.verifyDegenerateDimensionsInAModel(modelFileMock, yamlParsedFilesMock, validationOutput);

        expect(validationOutput.hasErrors).toBe(false);
      });

      it("Should return an error if there are duplicated degenerate dimensions in the model", () => {
        const key = createUniqueDegenerateDimensionKey(
          mockedDatasetAndKeyColumns.combination1.dataset,
          mockedDatasetAndKeyColumns.combination1.key_columns
        );

        const mockedDuplicatedDegenerateDimensionsList = buildElementsMap([
          { key, value: [degenerateDimensionsMock_1, degenerateDimensionsMock_2] },
        ]);

        validator = YamlGlobalModelsValidator.create(
          getDegenerateDimensionUtilMock(mockedDuplicatedDegenerateDimensionsList)
        );
        validationOutput = ValidatorOutput.create();

        validator.verifyDegenerateDimensionsInAModel(modelFileMock, yamlParsedFilesMock, validationOutput);

        expect(validationOutput.hasWarnings).toBe(true);
        expect(
          validationOutput.hasFileWarningMessage(
            globalModelsErrors.getDuplicatedDegeneratedDimensionsInModelError(
              [degenerateDimensionsMock_1.data.unique_name, degenerateDimensionsMock_2.data.unique_name],
              key
            )
          )
        ).toBe(true);
      });

      it("Should not return an error if there are duplicated degenerate dimensions but none are used in a model", () => {
        const modelFile = modelBuilder.buildYamlFile();

        const key = createUniqueDegenerateDimensionKey(
          mockedDatasetAndKeyColumns.combination1.dataset,
          mockedDatasetAndKeyColumns.combination1.key_columns
        );

        const mockedDuplicatedDegenerateDimensionsList = buildElementsMap([
          {
            key,
            value: [degenerateDimensionsMock_1, degenerateDimensionsMock_2],
          },
        ]);

        validator = YamlGlobalModelsValidator.create(
          getDegenerateDimensionUtilMock(mockedDuplicatedDegenerateDimensionsList)
        );
        validationOutput = ValidatorOutput.create();

        validator.verifyDegenerateDimensionsInAModel(modelFile, yamlParsedFilesMock, validationOutput);

        expect(validationOutput.hasErrors).toBe(false);
      });

      it("Should not return an error if there are duplicated degenerate dimensions only one of them is used in a model", () => {
        const modelFile = modelBuilder
          .addDegenerateDimension(degenerateDimensionsMock_1.data.unique_name)
          .buildYamlFile();

        const yamlParsedFiles = [
          modelFile,
          degenerateDimensionsMock_1,
          degenerateDimensionsMock_2,
          degenerateDimensionsMock_3,
        ];
        const key = createUniqueDegenerateDimensionKey(
          mockedDatasetAndKeyColumns.combination1.dataset,
          mockedDatasetAndKeyColumns.combination1.key_columns
        );

        const mockedDuplicatedDegenerateDimensionsList = buildElementsMap([
          { key, value: [degenerateDimensionsMock_1, degenerateDimensionsMock_2] },
        ]);

        validator = YamlGlobalModelsValidator.create(
          getDegenerateDimensionUtilMock(mockedDuplicatedDegenerateDimensionsList)
        );
        validationOutput = ValidatorOutput.create();

        validator.verifyDegenerateDimensionsInAModel(modelFile, yamlParsedFiles, validationOutput);

        expect(validationOutput.hasErrors).toBe(false);
      });
    });
    describe("verifyDegenerateDimensionsInAllModels", () => {
      const modelFile1 = modelBuilder
        .addDegenerateDimension(degenerateDimensionsMock_1.data.unique_name)
        .buildYamlFile();
      const modelFile2 = modelBuilder
        .addDegenerateDimension(degenerateDimensionsMock_2.data.unique_name)
        .buildYamlFile();

      const yamlParsedFiles = [
        modelFile1,
        modelFile2,
        degenerateDimensionsMock_1,
        degenerateDimensionsMock_2,
        degenerateDimensionsMock_3,
      ];

      it("Should not return an error if there are no duplicated degenerate dimensions used in any models", () => {
        validator = YamlGlobalModelsValidator.create(getDegenerateDimensionUtilMock(buildElementsMap([])));
        validationOutput = ValidatorOutput.create();

        validator.verifyDegenerateDimensionsInAllModels([modelFile1, modelFile2], yamlParsedFiles, validationOutput);

        expect(validationOutput.hasErrors).toBe(false);
      });

      it("Should return an error if there are duplicated degenerate dimensions used in multiple models", () => {
        const key = createUniqueDegenerateDimensionKey(
          mockedDatasetAndKeyColumns.combination1.dataset,
          mockedDatasetAndKeyColumns.combination1.key_columns
        );

        const mockedDuplicatedDegenerateDimensionsList = buildElementsMap([
          {
            key,
            value: [degenerateDimensionsMock_1, degenerateDimensionsMock_2],
          },
        ]);

        validator = YamlGlobalModelsValidator.create(
          getDegenerateDimensionUtilMock(mockedDuplicatedDegenerateDimensionsList)
        );
        validationOutput = ValidatorOutput.create();

        validator.verifyDegenerateDimensionsInAllModels([modelFile1, modelFile2], yamlParsedFiles, validationOutput);

        expect(validationOutput.hasWarnings).toBe(true);
        expect(
          validationOutput.hasFileWarningMessage(
            globalModelsErrors.getDuplicatedDegeneratedDimensionsInMultipleModelsError(
              [degenerateDimensionsMock_1.data.unique_name, degenerateDimensionsMock_2.data.unique_name],
              [modelFile1.data.unique_name, modelFile2.data.unique_name],
              key
            )
          )
        ).toBe(true);
      });

      it("Should not return an error if there are duplicated degenerate dimensions but only one is used in a model", () => {
        const modelFile1 = modelBuilder
          .addDegenerateDimension(degenerateDimensionsMock_1.data.unique_name)
          .buildYamlFile();
        const modelFile2 = modelBuilder.buildYamlFile();

        const yamlParsedFiles = [
          modelFile1,
          modelFile2,
          degenerateDimensionsMock_1,
          degenerateDimensionsMock_2,
          degenerateDimensionsMock_3,
        ];
        const key = createUniqueDegenerateDimensionKey(
          mockedDatasetAndKeyColumns.combination1.dataset,
          mockedDatasetAndKeyColumns.combination1.key_columns
        );

        const mockedDuplicatedDegenerateDimensionsList = buildElementsMap([
          { key, value: [degenerateDimensionsMock_1, degenerateDimensionsMock_2] },
        ]);

        validator = YamlGlobalModelsValidator.create(
          getDegenerateDimensionUtilMock(mockedDuplicatedDegenerateDimensionsList)
        );
        validationOutput = ValidatorOutput.create();

        validator.verifyDegenerateDimensionsInAllModels([modelFile1, modelFile2], yamlParsedFiles, validationOutput);

        expect(validationOutput.hasErrors).toBe(false);
      });
    });
  });
});
