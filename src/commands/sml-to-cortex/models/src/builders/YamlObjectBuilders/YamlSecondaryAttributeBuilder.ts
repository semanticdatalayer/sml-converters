import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import { IYamlDimensionSecondaryAttribute } from "../../yaml/IYamlDimension";

export default class YamlSecondaryAttributeBuilder extends AnyObjectBuilder<IYamlDimensionSecondaryAttribute> {
  static create(): YamlSecondaryAttributeBuilder {
    const defaultsAttributeValues: IYamlDimensionSecondaryAttribute = {
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
