import { ObjectType } from "../../ObjectType";
import { DEFAULT_CALCULATION_METHOD, IYamlMeasure, IYamlMeasureSemiAdditive } from "../../yaml/IYamlMeasure";
import { YamlObjectBuilder } from "./YamlObjectBuilder";

export default class YamlMeasureBuilder extends YamlObjectBuilder<IYamlMeasure, YamlMeasureBuilder> {
  public static create(): YamlMeasureBuilder {
    const defaults: IYamlMeasure = {
      label: "no name",
      unique_name: "no unique name",
      object_type: ObjectType.Measure,
      column: "colum name",
      dataset: "dataset",
      calculation_method: DEFAULT_CALCULATION_METHOD,
    };

    return new YamlMeasureBuilder(defaults);
  }

  addSemiAdditive(semiAdditive: Partial<IYamlMeasureSemiAdditive>): YamlMeasureBuilder {
    const defaultSemiAdditive: IYamlMeasureSemiAdditive = {
      position: "position",
      relationships: [[]],
      degenerate_dimensions: [],
    };

    const newSemiAdditive = Object.assign(defaultSemiAdditive, semiAdditive);
    return this.with({ semi_additive: { ...(this.clonedData.semi_additive || newSemiAdditive) } });
  }
}
