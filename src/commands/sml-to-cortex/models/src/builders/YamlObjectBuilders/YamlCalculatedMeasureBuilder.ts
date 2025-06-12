import {
  SMLObjectType,
  SMLMetricCalculated,
} from "sml-sdk";

// import { ObjectType } from "../../ObjectType";
// import { IYamlMeasureCalculated } from "../../yaml/IYamlMeasure";
import { YamlObjectBuilder } from "./YamlObjectBuilder";

export default class YamlCalculatedMeasureBuilder extends YamlObjectBuilder<
  SMLMetricCalculated,
  YamlCalculatedMeasureBuilder
> {
  public static create(): YamlCalculatedMeasureBuilder {
    const defaults: SMLMetricCalculated = {
      label: "no name",
      unique_name: "no unique name",
      object_type: SMLObjectType.MetricCalc,
      expression: "test expression",
    };

    return new YamlCalculatedMeasureBuilder(defaults);
  }
}
