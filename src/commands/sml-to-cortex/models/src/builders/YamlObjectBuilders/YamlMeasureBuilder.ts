import {
  SMLObjectType,
  SMLMetric,
  SMLMetricSemiAdditive,
  SMLCalculationMethod
} from "sml-sdk"

// import { ObjectType } from "../../ObjectType";
// import { DEFAULT_CALCULATION_METHOD, IYamlMeasure, IYamlMeasureSemiAdditive } from "../../yaml/IYamlMeasure";
import { YamlObjectBuilder } from "./YamlObjectBuilder";

export default class YamlMeasureBuilder extends YamlObjectBuilder<SMLMetric, YamlMeasureBuilder> {
  public static create(): YamlMeasureBuilder {
    const defaults: SMLMetric = {
      label: "no name",
      unique_name: "no unique name",
      object_type: SMLObjectType.Metric,
      column: "colum name",
      dataset: "dataset",
      calculation_method: SMLCalculationMethod.Sum, // Default calculation method
    };

    return new YamlMeasureBuilder(defaults);
  }

  addSemiAdditive(semiAdditive: Partial<SMLMetricSemiAdditive>): YamlMeasureBuilder {
    const defaultSemiAdditive: SMLMetricSemiAdditive = {
      position: "position",
      relationships: [[]],
      degenerate_dimensions: [],
    };

    const newSemiAdditive = Object.assign(defaultSemiAdditive, semiAdditive);
    return this.with({ semi_additive: { ...(this.clonedData.semi_additive || newSemiAdditive) } });
  }
}
