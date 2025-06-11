import IYamlParsedFile from "models/src/IYamlParsedFile";
import { IYamlDimension } from "models/src/yaml/IYamlDimension";

export interface IYamlDegenerateDimensionUtil {
  getDuplicatedDegenerateDimensions: (
    dimensions: IYamlParsedFile<IYamlDimension>[]
  ) => Map<string, Array<IYamlParsedFile<IYamlDimension>>>;
}
