import YamlCalculatedMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlCalculatedMeasureBuilder";
import YamlCompositeModelBuilder from "models/src/builders/YamlObjectBuilders/YamlCompositeModelBuilder";
import YamlMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlMeasureBuilder";
import YamlModelBuilder from "models/src/builders/YamlObjectBuilders/YamlModelBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import { IYamlObject } from "models/src/yaml/IYamlObject";

import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import IYamlCommonReferenceValidator from "../YamlCommonReferenceValidator/IYamlCommonReferenceValidator";
import YamlCommonReferenceValidator from "../YamlCommonReferenceValidator/YamlCommonReferenceValidator";
import { YamlCompositeModelValidator } from "./YamlCompositeModelValidator";
import { yamlCompositeModelErrorMessages } from "./YamlCompositeModelValidatorMessages";

const generateCommonReferenceValidator = <T extends IYamlObject>(data: T): IYamlCommonReferenceValidator => {
  return {
    validateAndGetReferencedObject: jest.fn().mockReturnValue({
      compilationOutput: [],
      data: data,
    }),
    validateRelationships: jest.fn().mockReturnValue(ValidatorOutput.create()),
    validateRelationshipsReferences: jest.fn().mockReturnValue(new ValidatorOutput()),
    validateAttributesReferences: jest.fn(),
    validateMetricReferences: jest.fn(),
  };
};
const compositeModelBuilder = YamlCompositeModelBuilder.create();
let referencedObjectIds: Set<string> = new Set<string>();

const getObjectsMap = (...input: Array<IYamlParsedFile>): Map<string, IYamlParsedFile> => {
  const objectsMap = new Map<string, IYamlParsedFile>();
  input.forEach((b) => {
    objectsMap.set(b.data.unique_name, b);
  });
  return objectsMap;
};
const getErrorMessage = (validationOutput: ValidatorOutput) => {
  return validationOutput.getFilesWithErrors()[0].compilationOutput[0].message;
};

const yamlMetricBuilder = YamlMeasureBuilder.create();
const yamlCalculatedMetricBuilder = YamlCalculatedMeasureBuilder.create();
const yamlModelBuilder = YamlModelBuilder.create();
const yamlCommonReferenceValidator = new YamlCommonReferenceValidator();

const model1Builder = yamlModelBuilder.uniqueName("model1").addRelationship({
  from: { dataset: "ds1", join_columns: [] },
  to: { dimension: "dimension1", level: "" },
});

const model2Builder = yamlModelBuilder.uniqueName("model2").addRelationship({
  from: { dataset: "ds2", join_columns: [] },
  to: { dimension: "dimension1", level: "" },
});

describe("YamlCompositeModelValidator", () => {
  beforeEach(() => {
    referencedObjectIds = new Set<string>();
  });

  const metricName = "metric1";
  const metric = yamlMetricBuilder.uniqueName(metricName).build();

  it("Should not return error if metric unique names are not duplicated", () => {
    const commonValidator = generateCommonReferenceValidator(yamlMetricBuilder.with(metric).build());
    const compositeModelFile = compositeModelBuilder
      .addMetricsCollection(metric, { unique_name: "metric2" })
      .buildYamlFile();

    const yamlModelValidator = new YamlCompositeModelValidator(commonValidator);
    const output = yamlModelValidator.validateObject(compositeModelFile, getObjectsMap(), referencedObjectIds);

    expect(output.hasErrors).toBe(false);
  });

  it("Should return error if metric unique names are duplicated", () => {
    const commonValidator = generateCommonReferenceValidator(yamlMetricBuilder.with(metric).build());
    const compositeModelFile = compositeModelBuilder
      .addMetricsCollection(metric, { ...metric, folder: "folder1" })
      .buildYamlFile();

    const yamlModelValidator = new YamlCompositeModelValidator(commonValidator);
    const output = yamlModelValidator.validateObject(compositeModelFile, getObjectsMap(), referencedObjectIds);

    expect(output.hasErrors).toBe(true);
    expect(getErrorMessage(output)).toBe(yamlCompositeModelErrorMessages.getDuplicateMetricUniqueNames(metric, 2));
  });

  it("Should not return error if metric unique names are not duplicated across dependency models", () => {
    const metric1 = yamlCalculatedMetricBuilder.uniqueName("metric1").buildYamlFile();
    const metric2 = yamlCalculatedMetricBuilder.uniqueName("metric2").buildYamlFile();
    const model1 = model1Builder.addMetrics("metric3", "metric4").buildYamlFile();
    const model2 = model2Builder.addMetrics("metric5", "metric6").buildYamlFile();
    const compositeModelFile = compositeModelBuilder
      .addMetricsCollection(metric1.data, metric2.data)
      .addModels([model1.data.unique_name, model2.data.unique_name])
      .buildYamlFile();
    const elementsMap = getObjectsMap(metric1, metric2, model1, model2);

    const yamlModelValidator = new YamlCompositeModelValidator(yamlCommonReferenceValidator);
    const output = yamlModelValidator.validateObject(compositeModelFile, elementsMap, referencedObjectIds);

    expect(output.hasErrors).toBe(false);
  });

  it("Should return error if metric unique names are duplicated across dependency models", () => {
    const metric1 = yamlCalculatedMetricBuilder.uniqueName("metric1").buildYamlFile();
    const metric2 = yamlCalculatedMetricBuilder.uniqueName("metric2").buildYamlFile();
    const model1 = model1Builder.addMetrics(metric1.data.unique_name, "metric4").buildYamlFile();
    const model2 = model2Builder.addMetrics("metric3", metric1.data.unique_name).buildYamlFile();
    const compositeModelFile = compositeModelBuilder
      .addMetricsCollection(metric1.data, metric2.data)
      .addModels([model1.data.unique_name, model2.data.unique_name])
      .buildYamlFile();
    const elementsMap = getObjectsMap(metric1, metric2, model1, model2);

    const yamlModelValidator = new YamlCompositeModelValidator(yamlCommonReferenceValidator);
    const output = yamlModelValidator.validateObject(compositeModelFile, elementsMap, referencedObjectIds);

    expect(output.hasErrors).toBe(true);
    expect(getErrorMessage(output)).toBe(
      yamlCompositeModelErrorMessages.getDuplicateMetricUniqueNames(metric1.data, 3)
    );
  });

  it("Should not return error if degenerate dimension unique names are not duplicated across dependency models", () => {
    const model1 = model1Builder.addDegenerateDimensions(["dim1", "dim2"]).buildYamlFile();
    const model2 = model2Builder.addDegenerateDimensions(["dim3", "dim4"]).buildYamlFile();
    const compositeModelFile = compositeModelBuilder
      .addModels([model1.data.unique_name, model2.data.unique_name])
      .buildYamlFile();
    const elementsMap = getObjectsMap(model1, model2);

    const yamlModelValidator = new YamlCompositeModelValidator(yamlCommonReferenceValidator);
    const output = yamlModelValidator.validateObject(compositeModelFile, elementsMap, referencedObjectIds);

    expect(output.hasErrors).toBe(false);
  });

  it("Should return error if degenerate dimension unique names are duplicated across dependency models", () => {
    const model1 = model1Builder.addDegenerateDimensions(["dim1", "dim2"]).buildYamlFile();
    const model2 = model2Builder.addDegenerateDimensions(["dim3", "dim1"]).buildYamlFile();
    const compositeModelFile = compositeModelBuilder
      .addModels([model1.data.unique_name, model2.data.unique_name])
      .buildYamlFile();
    const elementsMap = getObjectsMap(model1, model2);

    const yamlModelValidator = new YamlCompositeModelValidator(yamlCommonReferenceValidator);
    const output = yamlModelValidator.validateObject(compositeModelFile, elementsMap, referencedObjectIds);

    expect(output.hasErrors).toBe(true);
    expect(getErrorMessage(output)).toBe(yamlCompositeModelErrorMessages.getDuplicateDimensionUniqueNames("dim1", 2));
  });

  it("Should not return error if query name overrides are not duplicated across dependency models", () => {
    const model1 = model1Builder
      .withOverrides({ dim1: { query_name: "dimension1" }, dim2: { query_name: "dimension2" } })
      .buildYamlFile();
    const model2 = model2Builder
      .withOverrides({ dim3: { query_name: "dimension3" }, dim4: { query_name: "dimension4" } })
      .buildYamlFile();
    const compositeModelFile = compositeModelBuilder
      .addModels([model1.data.unique_name, model2.data.unique_name])
      .buildYamlFile();
    const elementsMap = getObjectsMap(model1, model2);

    const yamlModelValidator = new YamlCompositeModelValidator(yamlCommonReferenceValidator);
    const output = yamlModelValidator.validateObject(compositeModelFile, elementsMap, referencedObjectIds);

    expect(output.hasErrors).toBe(false);
  });

  it("Should return error if query name overrides are duplicated across dependency models", () => {
    const model1 = model1Builder
      .withOverrides({ dim1: { query_name: "dimension1" }, dim2: { query_name: "dimension2" } })
      .buildYamlFile();
    const model2 = model2Builder
      .withOverrides({ dim3: { query_name: "dimension3" }, dim4: { query_name: "dimension1" } })
      .buildYamlFile();
    const compositeModelFile = compositeModelBuilder
      .addModels([model1.data.unique_name, model2.data.unique_name])
      .buildYamlFile();
    const elementsMap = getObjectsMap(model1, model2);

    const yamlModelValidator = new YamlCompositeModelValidator(yamlCommonReferenceValidator);
    const output = yamlModelValidator.validateObject(compositeModelFile, elementsMap, referencedObjectIds);

    expect(output.hasErrors).toBe(true);
    expect(getErrorMessage(output)).toBe(
      yamlCompositeModelErrorMessages.getDuplicateQueryNameOverrides("dimension1", 2)
    );
  });

  it("Should not return error if there is only one dependency model", () => {
    const model1 = model1Builder
      .withRelationships([
        {
          unique_name: "rel1",
          from: { dataset: "ds1", join_columns: [] },
          to: { dimension: "dimension1", level: "" },
        },
        {
          unique_name: "rel2",
          from: { dataset: "ds1", join_columns: [] },
          to: { dimension: "dimension2", level: "" },
        },
      ])
      .buildYamlFile();
    const compositeModelFile = compositeModelBuilder.addModels([model1.data.unique_name]).buildYamlFile();
    const elementsMap = getObjectsMap(model1);

    const yamlModelValidator = new YamlCompositeModelValidator(yamlCommonReferenceValidator);
    const output = yamlModelValidator.validateObject(compositeModelFile, elementsMap, referencedObjectIds);

    expect(output.hasErrors).toBe(false);
  });

  it("Should not return error if dependency models have common relationship dimension", () => {
    const model1 = model1Builder
      .withRelationships([
        {
          unique_name: "rel1",
          from: { dataset: "ds1", join_columns: [] },
          to: { dimension: "dimension1", level: "" },
        },
        {
          unique_name: "rel2",
          from: { dataset: "ds1", join_columns: [] },
          to: { dimension: "dimension2", level: "" },
        },
      ])
      .buildYamlFile();
    const model2 = model2Builder
      .withRelationships([
        {
          unique_name: "rel1",
          from: { dataset: "ds2", join_columns: [] },
          to: { dimension: "dimension3", level: "" },
        },
        {
          unique_name: "rel2",
          from: { dataset: "ds2", join_columns: [] },
          to: { dimension: "dimension1", level: "" },
        },
      ])
      .buildYamlFile();
    const compositeModelFile = compositeModelBuilder
      .addModels([model1.data.unique_name, model2.data.unique_name])
      .buildYamlFile();
    const elementsMap = getObjectsMap(model1, model2);

    const yamlModelValidator = new YamlCompositeModelValidator(yamlCommonReferenceValidator);
    const output = yamlModelValidator.validateObject(compositeModelFile, elementsMap, referencedObjectIds);

    expect(output.hasErrors).toBe(false);
  });

  it("Should return error if dependency models don't have common relationship dimension", () => {
    const model1 = model1Builder
      .withRelationships([
        {
          unique_name: "rel1",
          from: { dataset: "ds1", join_columns: [] },
          to: { dimension: "dimension1", level: "" },
        },
        {
          unique_name: "rel2",
          from: { dataset: "ds1", join_columns: [] },
          to: { dimension: "dimension2", level: "" },
        },
      ])
      .buildYamlFile();
    const model2 = model2Builder
      .withRelationships([
        {
          unique_name: "rel1",
          from: { dataset: "ds2", join_columns: [] },
          to: { dimension: "dimension3", level: "" },
        },
        {
          unique_name: "rel2",
          from: { dataset: "ds2", join_columns: [] },
          to: { dimension: "dimension4", level: "" },
        },
      ])
      .buildYamlFile();
    const compositeModelFile = compositeModelBuilder
      .addModels([model1.data.unique_name, model2.data.unique_name])
      .buildYamlFile();
    const elementsMap = getObjectsMap(model1, model2);

    const yamlModelValidator = new YamlCompositeModelValidator(yamlCommonReferenceValidator);
    const output = yamlModelValidator.validateObject(compositeModelFile, elementsMap, referencedObjectIds);

    expect(output.hasErrors).toBe(true);
    expect(getErrorMessage(output)).toBe(yamlCompositeModelErrorMessages.commonRelationshipDimension);
  });

  it("Should validate metric references", () => {
    const yamlCommonReferenceValidator = generateCommonReferenceValidator(
      yamlCalculatedMetricBuilder.uniqueName(metricName).build()
    );
    const compositeModelFile = compositeModelBuilder.addMetric(metricName).buildYamlFile();

    const yamlModelValidator = new YamlCompositeModelValidator(yamlCommonReferenceValidator);
    const elementsMap = getObjectsMap();
    yamlModelValidator.validateObject(compositeModelFile, elementsMap, referencedObjectIds);

    expect(yamlCommonReferenceValidator.validateAndGetReferencedObject).toHaveBeenCalledWith(
      metricName,
      elementsMap,
      compositeModelFile,
      ObjectType.MeasureCalc,
      expect.anything()
    );
    expect(referencedObjectIds).toContain(metricName);
  });

  it("Should validate model references", () => {
    const modelName = "model1";
    const yamlCommonReferenceValidator = generateCommonReferenceValidator(
      yamlModelBuilder.uniqueName(modelName).build()
    );
    const compositeModelFile = compositeModelBuilder.addModel(modelName).buildYamlFile();
    const elementsMap = getObjectsMap();
    const yamlModelValidator = new YamlCompositeModelValidator(yamlCommonReferenceValidator);

    yamlModelValidator.validateObject(compositeModelFile, elementsMap, referencedObjectIds);

    expect(yamlCommonReferenceValidator.validateAndGetReferencedObject).toHaveBeenCalledWith(
      modelName,
      elementsMap,
      compositeModelFile,
      ObjectType.Model,
      expect.anything()
    );
    expect(referencedObjectIds).toContain(modelName);
  });
});
