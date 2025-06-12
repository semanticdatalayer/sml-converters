import { AnyObjectBuilder } from "../../../../utils/builders/AnyObjectBuilder";

import { SMLModelPerspective } from "sml-sdk";

export default class YamlPerspectiveBuilder extends AnyObjectBuilder<SMLModelPerspective> {
  public static create(): YamlPerspectiveBuilder {
    const defaultPerspective: SMLModelPerspective = {
      unique_name: "unique_name",
      metrics: ["metric.customercount"],
      dimensions: [{ name: "product.dimension" }],
    };

    return new YamlPerspectiveBuilder(defaultPerspective);
  }
}
