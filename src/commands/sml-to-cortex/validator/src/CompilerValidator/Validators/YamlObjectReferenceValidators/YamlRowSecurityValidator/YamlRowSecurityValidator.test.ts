import YamlDatasetBuilder from "models/src/builders/YamlObjectBuilders/YamlDatasetBuilder";
import YamlRowSecurityBuilder from "models/src/builders/YamlObjectBuilders/YamlRowSecurityBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { YamlColumnDataType } from "models/src/yaml/IYamlDataset";

import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import IYamlCommonReferenceValidator from "../YamlCommonReferenceValidator/IYamlCommonReferenceValidator";
import { yamlRowSecurityErrors, YamlRowSecurityValidator } from "./YamlRowSecurityValidator";

const dataset = "dataset1";
const column = {
  col1: "column1",
  col2: "column2",
  col3: "column3",
  invalid: "invalid",
};

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
  validateRelationshipsReferences: jest.fn(),
  validateAttributesReferences: jest.fn(),
  validateMetricReferences: jest.fn(),
};
const rowSecurityRefValidator = new YamlRowSecurityValidator(yamlCommonReferenceValidator);
const rowSecurityBuilder = YamlRowSecurityBuilder.create();
const referencedObjectIds: Set<string> = new Set<string>();

const getErrorMessage = (validationOutput: ValidatorOutput) => {
  return validationOutput.getFilesWithErrors()[0].compilationOutput[0].message;
};

describe("YamlRowSecurityValidator", () => {
  it("Should not add an error if the provided dataset and ids_column exist", () => {
    const rowSecurityFile = rowSecurityBuilder
      .with({ dataset: dataset, ids_column: column.col1, filter_key_column: column.col2 })
      .buildYamlFile();

    const validationOutput = rowSecurityRefValidator.validateObject(
      rowSecurityFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validationOutput.hasErrors).toBe(false);
  });

  it("Should add error if there is a dataset with the same unique name but without the provided ids_column", () => {
    const rowSecurityFile = rowSecurityBuilder.with({ dataset: dataset, ids_column: column.invalid }).buildYamlFile();

    const validationOutput = rowSecurityRefValidator.validateObject(
      rowSecurityFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validationOutput.hasErrors).toBe(true);
    expect(getErrorMessage(validationOutput)).toBe(yamlRowSecurityErrors.missingIdsColumn(column.invalid, dataset));
  });

  it("Should add error if there is a dataset with the same unique name but without the provided filter_key_column", () => {
    const rowSecurityFile = rowSecurityBuilder
      .with({ dataset: dataset, ids_column: column.col1, filter_key_column: column.invalid })
      .buildYamlFile();

    const validationOutput = rowSecurityRefValidator.validateObject(
      rowSecurityFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validationOutput.hasErrors).toBe(true);
    expect(getErrorMessage(validationOutput)).toBe(
      yamlRowSecurityErrors.missingFilterKeyColumn(column.invalid, dataset)
    );
  });
});
