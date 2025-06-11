import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import { IYamlDimensionLevelAttribute } from "../../yaml/IYamlDimension";

export default class YamlLevelAttributeBuilder extends AnyObjectBuilder<IYamlDimensionLevelAttribute> {
  static create(): YamlLevelAttributeBuilder {
    const defaultsAttributeValues: IYamlDimensionLevelAttribute = {
      dataset: "no dataset",
      key_columns: [],
      label: "no name",
      unique_name: "unique_name",
      name_column: "name_column",
      contains_unique_names: false,
    };

    return new YamlLevelAttributeBuilder(defaultsAttributeValues);
  }
}
