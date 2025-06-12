import { SMLDimensionMetric, SMLDimensionSecondaryAttribute } from "sml-sdk";

export default class XmlSecondaryAttributeTypeGuard {
  static isMetrical = (
    input: SMLDimensionSecondaryAttribute | SMLDimensionMetric
  ): input is SMLDimensionMetric => {
    return (input as SMLDimensionMetric).type === "metrical-attribute";
  };
}
