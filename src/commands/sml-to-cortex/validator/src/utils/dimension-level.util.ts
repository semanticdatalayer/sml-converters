import { IYamlDimensionLevel, IYamlDimensionLevelAttribute } from "models/src/yaml/IYamlDimension";

export default class DimensionLevelUtil {
  static isLevelHidden(level: IYamlDimensionLevel, yamlAttribute: IYamlDimensionLevelAttribute) {
    return level.is_hidden ?? yamlAttribute.is_hidden ?? undefined;
  }
}
