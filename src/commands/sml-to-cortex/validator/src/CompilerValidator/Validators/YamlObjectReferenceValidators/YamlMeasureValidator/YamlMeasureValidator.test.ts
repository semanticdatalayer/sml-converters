import YamlDatasetBuilder from "models/src/builders/YamlObjectBuilders/YamlDatasetBuilder";
import YamlMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlMeasureBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import { FormatStringMap, YamlColumnDataType, YamlFormatString } from "models/src/yaml/IYamlDataset";
import { CalculationMethod } from "models/src/yaml/IYamlMeasure";

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

describe("YamlMeasureValidator", () => {
  it("should do nothing if measure does not contain dataset", () => {
    const measureFile = YamlDatasetBuilder.create().buildYamlFile();

    const validationOutput = measureRefValidator.validateObject(
      measureFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validationOutput.hasErrors).toBe(false);
  });

  it("Should call object and type validation logic with the correct params and add uniqueId to the collection", () => {
    const measureFile = measureBuilder.with({ column: column.col1 }).buildYamlFile();

    measureRefValidator.validateObject(measureFile, new Map<string, IYamlParsedFile>(), referencedObjectIds);

    const datasetName = measureFile.data.dataset;
    expect(yamlCommonReferenceValidator.validateAndGetReferencedObject).toHaveBeenCalledWith(
      datasetName,
      expect.anything(),
      expect.anything(),
      ObjectType.Dataset,
      expect.anything()
    );
    expect(referencedObjectIds).toContain(datasetName);
  });

  it("Should add error if there is a dataset with the same unique name and dataset but without dataset column", () => {
    const measureFile = measureBuilder.with({ column: column.invalid }).buildYamlFile();

    const validationOutput = measureRefValidator.validateObject(
      measureFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validationOutput.hasErrors).toBe(true);
  });

  it("Should add error if column is not found in the dataset", () => {
    const measureFile = measureBuilder.with({ column: column.invalid }).buildYamlFile();

    const validationOutput = measureRefValidator.validateObject(
      measureFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validationOutput.hasFileErrorMessage(yamlMeasureErrors.notExistingCol(column.invalid, dataset))).toBe(true);
  });

  test.each([[YamlFormatString.GeneralNumber], [YamlFormatString.Standard], [YamlFormatString.Scientific]])(
    "should add NO error if format prop is: %s",
    (format) => {
      const measureFile = measureBuilder.with({ column: column.col1, format: format }).buildYamlFile();

      const validationOutput = measureRefValidator.validateObject(
        measureFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      expect(validationOutput.hasErrors).toBe(false);
    }
  );

  it("Should add NO error if format prop is custom - it is not predefined in the mapping", () => {
    const measureFile = measureBuilder.with({ column: column.col1, format: format.custom }).buildYamlFile();

    const validationOutput = measureRefValidator.validateObject(
      measureFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validationOutput.hasErrors).toBe(false);
  });

  it("Should add NO error if format prop is custom - it is predefined in the mapping", () => {
    const measureFile = measureBuilder.with({ column: column.col1, format: format.f1 }).buildYamlFile();

    const validationOutput = measureRefValidator.validateObject(
      measureFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validationOutput.hasErrors).toBe(false);
  });

  it("Should add error if format prop is not compatible with the column data_type", () => {
    const measureFile = measureBuilder.with({ column: column.col1, format: format.f2 }).buildYamlFile();

    const validationOutput = measureRefValidator.validateObject(
      measureFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(
      validationOutput.hasFileErrorMessage(
        yamlMeasureErrors.formatNotCompatibleWithColType(
          measureFile.data,
          YamlColumnDataType.Int,
          formatStringMappingMock
        )
      )
    ).toBe(true);
  });

  it("Should add notApplicableFormat error if format prop is not applicable for a column data_type", () => {
    const measureFile = measureBuilder.with({ column: column.col3, format: format.f }).buildYamlFile();

    const validationOutput = measureRefValidator.validateObject(
      measureFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(
      validationOutput.hasFileErrorMessage(
        yamlMeasureErrors.formatNotCompatibleWithColType(
          measureFile.data,
          YamlColumnDataType.String,
          formatStringMappingMock
        )
      )
    ).toBe(true);
  });

  it("Should add error if calculation_method is percentile and dataset column data_type is not correct", () => {
    const measureFile = measureBuilder
      .with({ column: column.col3, calculation_method: CalculationMethod.Percentile })
      .buildYamlFile();

    const validationOutput = measureRefValidator.validateObject(
      measureFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(
      validationOutput.hasFileErrorMessage(
        yamlMeasureErrors.calcMethodNotCompatibleWithColumnType(measureFile.data, YamlColumnDataType.String)
      )
    ).toBe(true);
  });

  it("Should NOT add error if calculation_method is percentile and dataset column data_type is correct", () => {
    const measureFile = measureBuilder
      .with({ column: column.col1, calculation_method: CalculationMethod.Percentile })
      .buildYamlFile();

    const validationOutput = measureRefValidator.validateObject(
      measureFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validationOutput.hasErrors).toBe(false);
  });
});
