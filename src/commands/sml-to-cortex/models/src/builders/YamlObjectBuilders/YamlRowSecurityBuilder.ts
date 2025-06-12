import {
  SMLObjectType,
  SMLRowSecurity,
  SMLRowSecurityIdType,
  SMLRowSecurityScope,
} from 'sml-sdk'

// import { ObjectType } from "../../ObjectType";
// import { IYamlRowSecurity, YamlRowSecurityIdType, YamlRowSecurityScope } from "../../yaml/IYamlRowSecurity";
import { YamlObjectBuilder } from "./YamlObjectBuilder";

export default class YamlRowSecurityBuilder extends YamlObjectBuilder<SMLRowSecurity, YamlRowSecurityBuilder> {
  public static create(): YamlRowSecurityBuilder {
    const defaults: SMLRowSecurity = {
      unique_name: "no unique name",
      object_type: SMLObjectType.RowSecurity,
      label: "no name",
      dataset: "test_dataset",
      filter_key_column: "filter_key_column",
      ids_column: "ids_column",
      id_type: SMLRowSecurityIdType.Group,
      scope: SMLRowSecurityScope.Fact,
    };

    return new YamlRowSecurityBuilder(defaults);
  }
}
