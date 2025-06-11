import { ObjectType } from "../../ObjectType";
import { IYamlRowSecurity, YamlRowSecurityIdType, YamlRowSecurityScope } from "../../yaml/IYamlRowSecurity";
import { YamlObjectBuilder } from "./YamlObjectBuilder";

export default class YamlRowSecurityBuilder extends YamlObjectBuilder<IYamlRowSecurity, YamlRowSecurityBuilder> {
  public static create(): YamlRowSecurityBuilder {
    const defaults: IYamlRowSecurity = {
      unique_name: "no unique name",
      object_type: ObjectType.RowSecurity,
      label: "no name",
      dataset: "test_dataset",
      filter_key_column: "filter_key_column",
      ids_column: "ids_column",
      id_type: YamlRowSecurityIdType.Group,
      scope: YamlRowSecurityScope.Fact,
    };

    return new YamlRowSecurityBuilder(defaults);
  }
}
