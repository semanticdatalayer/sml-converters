import { AnyObjectBuilder } from "../../../../utils/builders/AnyObjectBuilder";

import { SMLDimensionSecondaryAttribute } from "sml-sdk";

export default class YamlSecondaryAttributeBuilder extends AnyObjectBuilder<SMLDimensionSecondaryAttribute> {
  static create(): YamlSecondaryAttributeBuilder {
    const defaultsAttributeValues: SMLDimensionSecondaryAttribute = {
      dataset: "no dataset",
      key_columns: [],
      label: "no name",
      unique_name: "unique_name",
      name_column: "name_column",
      contains_unique_names: false,
    };

    return new YamlSecondaryAttributeBuilder(defaultsAttributeValues);
  }
}
