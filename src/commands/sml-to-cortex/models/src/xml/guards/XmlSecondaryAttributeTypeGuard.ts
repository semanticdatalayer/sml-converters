import { IYamlDimensionMetric, IYamlDimensionSecondaryAttribute } from "../../yaml/IYamlDimension";

export default class XmlSecondaryAttributeTypeGuard {
  static isMetrical = (
    input: IYamlDimensionSecondaryAttribute | IYamlDimensionMetric
  ): input is IYamlDimensionMetric => {
    return (input as IYamlDimensionMetric).type === "metrical-attribute";
  };
}
