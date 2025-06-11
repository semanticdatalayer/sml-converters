import { ObjectType } from "../../ObjectType";
import { IYamlMeasureCalculated } from "../../yaml/IYamlMeasure";
import { YamlObjectBuilder } from "./YamlObjectBuilder";

export default class YamlCalculatedMeasureBuilder extends YamlObjectBuilder<
  IYamlMeasureCalculated,
  YamlCalculatedMeasureBuilder
> {
  public static create(): YamlCalculatedMeasureBuilder {
    const defaults: IYamlMeasureCalculated = {
      label: "no name",
      unique_name: "no unique name",
      object_type: ObjectType.MeasureCalc,
      expression: "test expression",
    };

    return new YamlCalculatedMeasureBuilder(defaults);
  }
}
