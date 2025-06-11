import YamlDatasetBuilder from "models/src/builders/YamlObjectBuilders/YamlDatasetBuilder";
import YamlDimensionBuilder from "models/src/builders/YamlObjectBuilders/YamlDimensionBuilder";
import YamlLevelAttributeBuilder from "models/src/builders/YamlObjectBuilders/YamlLevelAttributeBuilder";
import YamlMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlMeasureBuilder";
import YamlModelBuilder from "models/src/builders/YamlObjectBuilders/YamlModelBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { FormatStringMap, YamlColumnDataType } from "models/src/yaml/IYamlDataset";

import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import IYamlCommonReferenceValidator from "../YamlCommonReferenceValidator/IYamlCommonReferenceValidator";
import { yamlMeasureErrors, YamlMeasureValidator } from "./YamlMeasureValidator";

const dataset = "dataset1";
const column = {
  col1: "column1",
  col2: "column2",
  col3: "column3",
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
      .uniqueName(dataset)
      .addColumn(column.col1, YamlColumnDataType.Int)
      .addColumn(column.col2, YamlColumnDataType.Boolean)
      .addColumn(column.col3, YamlColumnDataType.String)
      .build(),
  }),
  validateRelationships: jest.fn(),
  validateRelationshipsReferences: jest.fn().mockReturnValue(new ValidatorOutput()),
  validateAttributesReferences: jest.fn(),
  validateMetricReferences: jest.fn(),
};
const measureRefValidator = new YamlMeasureValidator(yamlCommonReferenceValidator, formatStringMappingMock);
const measureBuilder = YamlMeasureBuilder.create().with({
  unique_name: "metric1",
  dataset,
  column: column.col1,
});
const referencedObjectIds: Set<string> = new Set<string>();

const relationship1 = { unique_name: "model_to_dim1_relation", to: { dimension: "dimension_1", level: "level_1" } };
const relationship2 = { unique_name: "dim1_to_dim2_relation", to: { dimension: "dimension_2", level: "level_2" } };

describe("Semi additive measures", () => {
  const yamlModelBuilder = YamlModelBuilder.create();
  const yamlDimensionBuilder = YamlDimensionBuilder.create();

  it("Should add error if relationships is an empty array and degenerate_dimensions are not set", () => {
    const measureFile = measureBuilder
      .with({
        semi_additive: { relationships: [], position: "first" },
      })
      .buildYamlFile();

    const validationOutput = measureRefValidator.validateObject(
      measureFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validationOutput.hasErrors).toBe(true);
    expect(validationOutput.hasFileErrorMessage(yamlMeasureErrors.semiAdditiveHasEmptyRelationship())).toBe(true);
    expect(validationOutput.filesOutput[0].compilationOutput.length).toBe(1);
  });

  it("Should add error if a semi additive has neither relationships nor degenerate_dimensions set", () => {
    const measureFile = measureBuilder
      .with({
        semi_additive: { position: "first" },
      })
      .buildYamlFile();

    const validationOutput = measureRefValidator.validateObject(
      measureFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validationOutput.hasErrors).toBe(true);
    expect(
      validationOutput.hasFileErrorMessage(yamlMeasureErrors.semiAdditiveHasNoRelationshipsOrDegenerateDimensions())
    ).toBe(true);
  });

  it("Should not add error if a semi additive has at least one valid relationship and no degenerate dimensions", () => {
    const measureFile = measureBuilder
      .with({
        semi_additive: { relationships: [relationship1.unique_name], position: "first" },
      })
      .buildYamlFile();

    const model = yamlModelBuilder
      .uniqueName("model1")
      .addMetric("metric1")
      .addRelationship(relationship1)
      .buildYamlFile();

    const filesMap = new Map();
    filesMap.set(model.data.unique_name, model);

    const validationOutput = measureRefValidator.validateObject(measureFile, filesMap, referencedObjectIds);

    expect(validationOutput.hasErrors).toBe(false);
  });

  it("Should not add error if a semi additive has at least one valid degenerate dimension and no relationships", () => {
    const measureFile = measureBuilder
      .with({
        semi_additive: {
          degenerate_dimensions: [
            { name: "degenerateDimension1", level: "level1" },
            { name: "degenerateDimension2", level: "level2" },
          ],
          position: "first",
        },
      })
      .buildYamlFile();

    const degenerateDimension = yamlDimensionBuilder
      .with({
        unique_name: "degenerateDimension1",
        level_attributes: [YamlLevelAttributeBuilder.create().with({ unique_name: "level1" }).build()],
      })
      .addIsDegenerate()
      .buildYamlFile();

    const model = yamlModelBuilder
      .uniqueName("model1")
      .addMetric("metric1")
      .addDegenerateDimension(degenerateDimension.data.unique_name)
      .buildYamlFile();

    const filesMap = new Map();
    filesMap.set(model.data.unique_name, model);
    filesMap.set(degenerateDimension.data.unique_name, degenerateDimension);

    const validationOutput = measureRefValidator.validateObject(measureFile, filesMap, referencedObjectIds);

    expect(validationOutput.hasErrors).toBe(false);
  });

  it("Should add error if a semi additive has a single degenerate dimension and its level does not exist", () => {
    const measureFile = measureBuilder
      .with({
        semi_additive: {
          degenerate_dimensions: [{ name: "degenerateDimension", level: "level" }],
          position: "first",
        },
      })
      .buildYamlFile();

    const degenerateDimension = yamlDimensionBuilder
      .with({
        unique_name: "degenerateDimension",
      })
      .addIsDegenerate()
      .buildYamlFile();

    const model = yamlModelBuilder
      .uniqueName("model1")
      .addMetric("metric1")
      .addDegenerateDimension(degenerateDimension.data.unique_name)
      .buildYamlFile();

    const filesMap = new Map();
    filesMap.set(model.data.unique_name, model);
    filesMap.set(degenerateDimension.data.unique_name, degenerateDimension);

    const validationOutput = measureRefValidator.validateObject(measureFile, filesMap, referencedObjectIds);

    expect(validationOutput.hasErrors).toBe(true);
    expect(
      validationOutput.hasFileErrorMessage(
        yamlMeasureErrors.semiAdditiveDegenerateDimensionHasUnknownLevel("degenerateDimension", "level")
      )
    ).toBe(true);
  });

  it("Should add error if no valid attributes are found within model", () => {
    const measureFile = measureBuilder
      .with({
        semi_additive: { position: "first", degenerate_dimensions: [{ name: "deg_dim_1", level: "level_1" }] },
      })
      .buildYamlFile();

    const model1 = yamlModelBuilder.uniqueName("model1").addMetric(measureFile.data.unique_name).buildYamlFile();

    const filesMap = new Map();
    filesMap.set(model1.data.unique_name, model1);

    const validationOutput = measureRefValidator.validateObject(measureFile, filesMap, referencedObjectIds);

    expect(validationOutput.hasErrors).toBe(true);
    expect(validationOutput.filesOutput.length).toBe(1);
    expect(
      validationOutput.hasFileErrorMessage(yamlMeasureErrors.modelHasNoValidAttributes(model1.data.unique_name))
    ).toBe(true);
  });

  it("Should add error if one of the semi additive nested relationship does not exist within a model", () => {
    const measureFile = measureBuilder
      .with({
        semi_additive: { position: "first", relationships: [[relationship1.unique_name, relationship2.unique_name]] },
      })
      .buildYamlFile();

    const dimension1 = yamlDimensionBuilder
      .with({
        unique_name: "dimension_1",
        level_attributes: [YamlLevelAttributeBuilder.create().with({ unique_name: "level_1" }).build()],
      })
      .addRelationship(relationship2)
      .buildYamlFile();

    const dimension2 = yamlDimensionBuilder
      .with({
        unique_name: "dimension_2",
        level_attributes: [YamlLevelAttributeBuilder.create().with({ unique_name: "level_2" }).build()],
      })
      .buildYamlFile();

    const model = yamlModelBuilder
      .uniqueName("model1")
      .addMetric(measureFile.data.unique_name)
      .addRelationship(relationship1)
      .buildYamlFile();

    const filesMap = new Map();
    filesMap.set(model.data.unique_name, model);
    filesMap.set(dimension1.data.unique_name, dimension1);
    filesMap.set(dimension2.data.unique_name, dimension2);

    const validationOutput = measureRefValidator.validateObject(measureFile, filesMap, referencedObjectIds);

    expect(validationOutput.hasErrors).toBe(true);
    expect(validationOutput.filesOutput.length).toBe(1);
    expect(
      validationOutput.hasFileWarningMessage(
        yamlMeasureErrors.modelHasInvalidNestedRelationship(model.data.unique_name, [
          relationship1.unique_name,
          relationship2.unique_name,
        ])
      )
    ).toBe(true);
    expect(
      validationOutput.hasFileErrorMessage(yamlMeasureErrors.modelHasNoValidAttributes(model.data.unique_name))
    ).toBe(true);
  });

  it("Should add error if a semi additive nested relationship exceeds max nesting length", () => {
    const measureFile = measureBuilder
      .with({
        semi_additive: {
          position: "first",
          relationships: [[relationship1.unique_name, relationship2.unique_name, "relationship_3"]],
        },
      })
      .buildYamlFile();

    const model1 = yamlModelBuilder
      .uniqueName("model1")
      .addMetric(measureFile.data.unique_name)
      .addRelationship(relationship1)
      .addRelationship(relationship2)
      .addRelationship({ unique_name: "relationship_3", to: { dimension: "dimension_3", level: "level_3" } })
      .buildYamlFile();

    const filesMap = new Map();
    filesMap.set(model1.data.unique_name, model1);

    const validationOutput = measureRefValidator.validateObject(measureFile, filesMap, referencedObjectIds);

    expect(validationOutput.hasErrors).toBe(true);
    expect(validationOutput.filesOutput.length).toBe(1);
    expect(validationOutput.hasFileErrorMessage(yamlMeasureErrors.semiAdditiveNestedRelationshipLengthExceeded())).toBe(
      true
    );
  });

  it("Should add error if a semi additive nested relationship does not contain all relationships within a model", () => {
    const measureFile = measureBuilder
      .with({
        semi_additive: {
          position: "first",
          relationships: [[relationship1.unique_name, relationship2.unique_name]],
        },
      })
      .buildYamlFile();

    const model1 = yamlModelBuilder
      .uniqueName("model1")
      .addMetric(measureFile.data.unique_name)
      .addRelationship(relationship1)
      .buildYamlFile();

    const dimension1 = yamlDimensionBuilder
      .with({
        unique_name: "dimension_1",
        level_attributes: [YamlLevelAttributeBuilder.create().with({ unique_name: "level_1" }).build()],
      })
      .buildYamlFile();

    const filesMap = new Map();
    filesMap.set(model1.data.unique_name, model1);
    filesMap.set(dimension1.data.unique_name, dimension1);

    const validationOutput = measureRefValidator.validateObject(measureFile, filesMap, referencedObjectIds);

    expect(validationOutput.hasErrors).toBe(true);
    expect(validationOutput.filesOutput.length).toBe(1);
    expect(
      validationOutput.hasFileErrorMessage(yamlMeasureErrors.modelHasNoValidAttributes(model1.data.unique_name))
    ).toBe(true);
  });

  it("Should add a single error if a semi additive has a degenerate dimension which exists in multiple models and whose level does not exist", () => {
    const measureFile = measureBuilder
      .with({
        semi_additive: {
          degenerate_dimensions: [{ name: "degenerateDimension", level: "unknown_level" }],
          position: "first",
        },
      })
      .buildYamlFile();

    const degenerateDimension = yamlDimensionBuilder
      .with({
        unique_name: "degenerateDimension",
      })
      .addIsDegenerate()
      .buildYamlFile();

    const model = yamlModelBuilder
      .uniqueName("model1")
      .addMetric("metric1")
      .addDegenerateDimension(degenerateDimension.data.unique_name)
      .buildYamlFile();

    const model2 = yamlModelBuilder
      .uniqueName("model2")
      .addMetric("metric1")
      .addDegenerateDimension(degenerateDimension.data.unique_name)
      .buildYamlFile();

    const filesMap = new Map();
    filesMap.set(model.data.unique_name, model);
    filesMap.set(model2.data.unique_name, model2);
    filesMap.set(degenerateDimension.data.unique_name, degenerateDimension);

    const validationOutput = measureRefValidator.validateObject(measureFile, filesMap, referencedObjectIds);

    expect(validationOutput.hasErrors).toBe(true);
    expect(
      validationOutput.hasFileErrorMessage(
        yamlMeasureErrors.semiAdditiveDegenerateDimensionHasUnknownLevel("degenerateDimension", "unknown_level")
      )
    ).toBe(true);
    expect(validationOutput.filesOutput[0].compilationOutput.length).toBe(1);
  });
});
