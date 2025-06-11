import IYamlParsedFile from "models/src/IYamlParsedFile";
import { IYamlObject } from "models/src/yaml/IYamlObject";

import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import {
  degenerateDimensionsMock_1,
  degenerateDimensionsMock_2,
  getDegenerateDimensionUtilMock,
  mockedDatasetAndKeyColumns,
  yamlParsedFilesMock,
} from "../../Utils/YamlDegenerateDimensionTestUtil";
import { createUniqueDegenerateDimensionKey } from "../../Utils/YamlDegenerateDimensionUtil";
import { globalDimensionsErrors, YamlGlobalDimensionsValidator } from "./YamlGlobalDimensionsValidator";

describe("YamlGlobalDimensionsValidator", () => {
  let validator: YamlGlobalDimensionsValidator;

  beforeEach(() => {
    validator = YamlGlobalDimensionsValidator.create(getDegenerateDimensionUtilMock());
  });

  it("should return an empty ValidatorOutput when no files are provided", () => {
    const yamlParsedFiles: IYamlParsedFile<IYamlObject>[] = [];
    const result = validator.validate(yamlParsedFiles);

    expect(result).toBeInstanceOf(ValidatorOutput);
    expect(result.hasErrors).toBe(false);
    expect(result.hasWarnings).toBe(false);
  });

  it("should validate files and return ValidatorOutput without warnings for a list of unique degenerate dimensions", () => {
    const result = validator.validate(yamlParsedFilesMock);
    expect(result).toBeInstanceOf(ValidatorOutput);
    expect(result.hasWarnings).toBe(false);
  });

  it("should validate files and return ValidatorOutput with warnings for duplicate degenerate dimensions", () => {
    const key = createUniqueDegenerateDimensionKey(
      mockedDatasetAndKeyColumns.combination1.dataset,
      mockedDatasetAndKeyColumns.combination1.key_columns
    );

    const mockedDuplicatedDegenerateDimensionsList = new Map().set(key, [
      degenerateDimensionsMock_1,
      degenerateDimensionsMock_2,
    ]);

    validator = YamlGlobalDimensionsValidator.create(
      getDegenerateDimensionUtilMock(mockedDuplicatedDegenerateDimensionsList)
    );
    const result = validator.validate(yamlParsedFilesMock);

    expect(result).toBeInstanceOf(ValidatorOutput);
    expect(result.hasErrors).toBe(false);
    expect(result.hasWarnings).toBe(true);
    expect(
      result.hasFileWarningMessage(
        globalDimensionsErrors.getDuplicateDegenerateDimensionsWarning(key, [
          degenerateDimensionsMock_1.data.unique_name,
          degenerateDimensionsMock_2.data.unique_name,
        ])
      )
    ).toBe(true);
  });
});
