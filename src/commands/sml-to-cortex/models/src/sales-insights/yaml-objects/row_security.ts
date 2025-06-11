import { ObjectType } from "../../ObjectType";
import { IYamlRowSecurity, YamlRowSecurityIdType, YamlRowSecurityScope } from "../../yaml/IYamlRowSecurity";
import { getAggregatedResult, getFreezedObject } from "./utils";

const getRowSecurity = (input: IYamlRowSecurity) => getFreezedObject(input);

const securityByRegion = getRowSecurity({
  unique_name: "Row Level Security by Region",
  label: "Row Level Security by Region",
  object_type: ObjectType.RowSecurity,
  dataset: "User to Country Map",
  filter_key_column: "country",
  ids_column: "username",
  id_type: YamlRowSecurityIdType.Group,
  scope: YamlRowSecurityScope.All,
});

const allRowSecurities = {
  securityByRegion,
};

export const row_securities = getAggregatedResult<IYamlRowSecurity, typeof allRowSecurities>(allRowSecurities);
