import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import { IYamlModelPerspective } from "../../yaml/IYamlModel";

export default class YamlPerspectiveBuilder extends AnyObjectBuilder<IYamlModelPerspective> {
  public static create(): YamlPerspectiveBuilder {
    const defaultPerspective: IYamlModelPerspective = {
      unique_name: "unique_name",
      metrics: ["metric.customercount"],
      dimensions: [{ name: "product.dimension" }],
    };

    return new YamlPerspectiveBuilder(defaultPerspective);
  }
}
