import { SMLReferenceableObject } from "sml-sdk";
import { SmlConvertResultBuilder } from "./sml-convert-result";

const getUniqueName = (a: SMLReferenceableObject) => a.unique_name;

export class SmlConverterQuery {
  private constructor(private readonly smlObjects: SmlConvertResultBuilder) {}

  static for(smlObjects: SmlConvertResultBuilder) {
    return new SmlConverterQuery(smlObjects);
  }

  getAllDimensionsAttributesUniqueNames(): Array<string> {
    return this.smlObjects.dimensions.flatMap((dim) => {
      return dim.hierarchies.flatMap((h) => {
        return h.levels.flatMap((l) => {
          const result = [l.unique_name];
          if (l.aliases) {
            result.push(...l.aliases.map(getUniqueName));
          }
          if (l.secondary_attributes) {
            result.push(...l.secondary_attributes.map(getUniqueName));
          }
          if (l.metrics) {
            result.push(...l.metrics.map(getUniqueName));
          }
          return result;
        });
      });
    });
  }

  getAllMetricsUniqueName(): Array<string> {
    return [
      ...this.smlObjects.measures.map(getUniqueName),
      ...this.smlObjects.measuresCalculated.map(getUniqueName),
    ];
  }
}
