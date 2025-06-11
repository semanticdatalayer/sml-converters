import YamlDimensionBuilder from "models/src/builders/YamlObjectBuilders/YamlDimensionBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { IYamlDimension } from "models/src/yaml/IYamlDimension";

import YamlDegenerateDimensionUtil, { createUniqueDegenerateDimensionKey } from "./YamlDegenerateDimensionUtil";

const mockedDatasetAndKeyColumns = {
  combination1: { dataset: "dataset1", key_columns: ["column1"] },
  combination2: { dataset: "dataset2", key_columns: ["column2"] },
  combination3: { dataset: "dataset3", key_columns: ["column3"] },
};

const yamlDimensionBuilder = YamlDimensionBuilder.create();

describe("YamlDegenerateDimensionUtil", () => {
  let yamlDegenerateDimensionUtil: YamlDegenerateDimensionUtil;

  beforeEach(() => {
    yamlDegenerateDimensionUtil = new YamlDegenerateDimensionUtil();
  });

  it("should return an empty map when no degenerate dimensions are present", () => {
    const dimensions: IYamlParsedFile<IYamlDimension>[] = [];
    const result = yamlDegenerateDimensionUtil.getDuplicatedDegenerateDimensions(dimensions);
    expect(result.size).toBe(0);
  });

  it("should return an empty map when no duplicated degenerate dimensions are present", () => {
    const mockedDimensions = [
      yamlDimensionBuilder
        .addIsDegenerate(true)
        .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination1 })
        .buildYamlFile(),
      yamlDimensionBuilder
        .addIsDegenerate(true)
        .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination2 })
        .buildYamlFile(),
      yamlDimensionBuilder
        .addIsDegenerate(true)
        .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination3 })
        .buildYamlFile(),
    ];

    const result = yamlDegenerateDimensionUtil.getDuplicatedDegenerateDimensions(mockedDimensions);
    expect(result.size).toBe(0);
  });

  it("should return an empty map when no degenerate dimension are present", () => {
    const mockedDimensions = [
      yamlDimensionBuilder
        .addIsDegenerate(false)
        .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination1 })
        .buildYamlFile(),
      yamlDimensionBuilder
        .addIsDegenerate(false)
        .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination2 })
        .buildYamlFile(),
      yamlDimensionBuilder
        .addIsDegenerate(false)
        .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination1 })
        .buildYamlFile(),
      yamlDimensionBuilder
        .addIsDegenerate(false)
        .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination3 })
        .buildYamlFile(),
    ];

    const result = yamlDegenerateDimensionUtil.getDuplicatedDegenerateDimensions(mockedDimensions);
    expect(result.size).toBe(0);
  });

  it("should return a map containing only the duplicated degenerate dimensions", () => {
    const mockedDimensions = [
      yamlDimensionBuilder
        .addIsDegenerate(true)
        .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination1 })
        .buildYamlFile(),
      yamlDimensionBuilder
        .addIsDegenerate(true)
        .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination2 })
        .buildYamlFile(),
      yamlDimensionBuilder
        .addIsDegenerate(true)
        .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination1 })
        .buildYamlFile(),
      yamlDimensionBuilder
        .addIsDegenerate(true)
        .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination3 })
        .buildYamlFile(),
    ];

    const result = yamlDegenerateDimensionUtil.getDuplicatedDegenerateDimensions(mockedDimensions);
    expect(result.size).toBe(1);
    const key = createUniqueDegenerateDimensionKey(
      mockedDatasetAndKeyColumns.combination1.dataset,
      mockedDatasetAndKeyColumns.combination1.key_columns
    );

    expect(result.has(key)).toBe(true);
    expect(result.get(key)?.length).toBe(2);
  });

  it("should handle multiple duplicated degenerate dimensions", () => {
    const mockedDimensions = [
      yamlDimensionBuilder
        .addIsDegenerate(true)
        .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination1 })
        .buildYamlFile(),
      yamlDimensionBuilder
        .addIsDegenerate(true)
        .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination1 })
        .buildYamlFile(),
      yamlDimensionBuilder
        .addIsDegenerate(true)
        .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination2 })
        .buildYamlFile(),
      yamlDimensionBuilder
        .addIsDegenerate(true)
        .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination2 })
        .buildYamlFile(),
    ];

    const result = yamlDegenerateDimensionUtil.getDuplicatedDegenerateDimensions(mockedDimensions);
    expect(result.size).toBe(2);
    const key1 = createUniqueDegenerateDimensionKey(
      mockedDatasetAndKeyColumns.combination1.dataset,
      mockedDatasetAndKeyColumns.combination1.key_columns
    );
    const key2 = createUniqueDegenerateDimensionKey(
      mockedDatasetAndKeyColumns.combination2.dataset,
      mockedDatasetAndKeyColumns.combination2.key_columns
    );
    expect(result.has(key1)).toBe(true);
    expect(result.get(key1)?.length).toBe(2);
    expect(result.has(key2)).toBe(true);
    expect(result.get(key2)?.length).toBe(2);
  });

  it("should ignore level attributes with multiple datasets when comparing normal level attributes", () => {
    const mockedDimensions = [
      yamlDimensionBuilder
        .addIsDegenerate(true)
        .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination1 })
        .buildYamlFile(),
      yamlDimensionBuilder
        .addIsDegenerate(true)
        .addLevelAttributeWithMultipleDatasets({
          shared_degenerate_columns: [{ ...mockedDatasetAndKeyColumns.combination1, name_column: "name_column" }],
        })
        .buildYamlFile(),
      yamlDimensionBuilder
        .addIsDegenerate(true)
        .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination2 })
        .buildYamlFile(),
      yamlDimensionBuilder
        .addIsDegenerate(true)
        .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination2 })
        .buildYamlFile(),
    ];

    const result = yamlDegenerateDimensionUtil.getDuplicatedDegenerateDimensions(mockedDimensions);
    expect(result.size).toBe(1);
    const key1 = createUniqueDegenerateDimensionKey(
      mockedDatasetAndKeyColumns.combination1.dataset,
      mockedDatasetAndKeyColumns.combination1.key_columns
    );
    const key2 = createUniqueDegenerateDimensionKey(
      mockedDatasetAndKeyColumns.combination2.dataset,
      mockedDatasetAndKeyColumns.combination2.key_columns
    );
    expect(result.has(key1)).toBe(false);
    expect(result.has(key2)).toBe(true);
    expect(result.get(key2)?.length).toBe(2);
  });
});
