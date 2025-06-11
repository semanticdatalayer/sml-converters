import IYamlParsedFile from "models/src/IYamlParsedFile";
import YamlDimensionTypeGuard from "models/src/yaml/guards/YamlDimensionTypeGuard";
import { IYamlDimension } from "models/src/yaml/IYamlDimension";
import { transformListToReadableString } from "utils/string/string.util";

import { IYamlDegenerateDimensionUtil } from "./IYamlDegenerateDimensionUtil";

export const createUniqueDegenerateDimensionKey = (dataset: string, keyColumns: string[]): string => {
  return `dataset: "${dataset}" and key_columns: ${transformListToReadableString(keyColumns)}`;
};

export default class YamlDegenerateDimensionUtil implements IYamlDegenerateDimensionUtil {
  getDuplicatedDegenerateDimensions = (
    dimensions: IYamlParsedFile<IYamlDimension>[]
  ): Map<string, Array<IYamlParsedFile<IYamlDimension>>> => {
    const groupedDegenerateDimensions = this.groupByDatasetAndKeyColumn(dimensions);
    return this.getDuplicatedDimensions(groupedDegenerateDimensions);
  };

  private groupByDatasetAndKeyColumn(
    dimensions: IYamlParsedFile<IYamlDimension>[]
  ): Map<string, Array<IYamlParsedFile<IYamlDimension>>> {
    const dimensionsGroupedByDatasetAndKeyColumn = new Map<string, Array<IYamlParsedFile<IYamlDimension>>>();

    dimensions
      .filter((file) => file.data.is_degenerate)
      .forEach((file) => {
        file.data.level_attributes.forEach((level) => {
          if (YamlDimensionTypeGuard.isLevelFromOneDataset(level)) {
            const key = createUniqueDegenerateDimensionKey(level.dataset, level.key_columns);

            if (!dimensionsGroupedByDatasetAndKeyColumn.has(key)) {
              dimensionsGroupedByDatasetAndKeyColumn.set(key, []);
            }

            const existingFiles = dimensionsGroupedByDatasetAndKeyColumn.get(key);
            if (existingFiles) {
              existingFiles.push(file);
            }
          }
        });
      });

    return dimensionsGroupedByDatasetAndKeyColumn;
  }

  private getDuplicatedDimensions(
    map: Map<string, Array<IYamlParsedFile<IYamlDimension>>>
  ): Map<string, Array<IYamlParsedFile<IYamlDimension>>> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Map([...map].filter(([_, files]) => files.length > 1));
  }
}
