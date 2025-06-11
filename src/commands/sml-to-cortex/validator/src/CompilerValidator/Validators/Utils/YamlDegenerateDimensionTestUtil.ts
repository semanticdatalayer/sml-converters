import YamlDimensionBuilder from "models/src/builders/YamlObjectBuilders/YamlDimensionBuilder";
import YamlModelBuilder from "models/src/builders/YamlObjectBuilders/YamlModelBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { IYamlDimension } from "models/src/yaml/IYamlDimension";

import { IYamlDegenerateDimensionUtil } from "./IYamlDegenerateDimensionUtil";

export const getDegenerateDimensionUtilMock = (
  duplicatedDegenerateDimensionsList: Map<string, Array<IYamlParsedFile<IYamlDimension>>> = new Map()
): IYamlDegenerateDimensionUtil => {
  class YamlDegenerateDimensionUtilMock implements IYamlDegenerateDimensionUtil {
    getDuplicatedDegenerateDimensions(): Map<string, Array<IYamlParsedFile<IYamlDimension>>> {
      return new Map(duplicatedDegenerateDimensionsList);
    }
  }

  return new YamlDegenerateDimensionUtilMock();
};

export const mockedDatasetAndKeyColumns = {
  combination1: { dataset: "dataset1", key_columns: ["column1"] },
  combination2: { dataset: "dataset2", key_columns: ["column2"] },
  combination3: { dataset: "dataset3", key_columns: ["column3"] },
};

export const uniqueNames = {
  uniqueName1: "uniqueName1",
  uniqueName2: "uniqueName2",
  uniqueName3: "uniqueName3",
};

export const degenerateDimensionsMock_1 = YamlDimensionBuilder.create()
  .with({ unique_name: uniqueNames.uniqueName1 })
  .addIsDegenerate(true)
  .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination1 })
  .buildYamlFile();
export const degenerateDimensionsMock_2 = YamlDimensionBuilder.create()
  .with({ unique_name: uniqueNames.uniqueName2 })
  .addIsDegenerate(true)
  .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination2 })
  .buildYamlFile();
export const degenerateDimensionsMock_3 = YamlDimensionBuilder.create()
  .with({ unique_name: uniqueNames.uniqueName3 })
  .addIsDegenerate(true)
  .addLevelAttribute({ ...mockedDatasetAndKeyColumns.combination3 })
  .buildYamlFile();

export const modelFileMock = YamlModelBuilder.create()
  .addDegenerateDimension(degenerateDimensionsMock_1.data.unique_name)
  .addDegenerateDimension(degenerateDimensionsMock_2.data.unique_name)
  .addDegenerateDimension(degenerateDimensionsMock_3.data.unique_name)
  .buildYamlFile();

export const yamlParsedFilesMock = [
  modelFileMock,
  degenerateDimensionsMock_1,
  degenerateDimensionsMock_2,
  degenerateDimensionsMock_3,
];
