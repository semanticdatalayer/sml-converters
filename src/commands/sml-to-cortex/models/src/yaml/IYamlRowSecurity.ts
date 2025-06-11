import { IYamlObject } from "./IYamlObject";

export enum YamlRowSecurityScope {
  Fact = "fact",
  Related = "related",
  All = "all",
}

export enum YamlRowSecurityIdType {
  User = "user",
  Group = "group",
}

export interface IYamlRowSecurity extends IYamlObject {
  dataset: string;
  description?: string;
  filter_key_column: string;
  ids_column: string;
  use_filter_key?: boolean;
  secure_totals?: boolean;
  id_type: YamlRowSecurityIdType;
  scope: YamlRowSecurityScope;
}
