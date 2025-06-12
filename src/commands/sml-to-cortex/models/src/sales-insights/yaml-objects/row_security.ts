import { 
  SMLObjectType,
  SMLRowSecurity,
  SMLRowSecurityIdType,
  SMLRowSecurityScope
 } from "sml-sdk";
// import { ISMLRowSecurity as SmlRowSecurity, SMLRowSecurityIdType, SMLRowSecurityScope } from "../../SML/ISMLRowSecurity";
import { getAggregatedResult, getFreezedObject } from "./utils";

const getRowSecurity = (input: SMLRowSecurity) => getFreezedObject(input);

const securityByRegion = getRowSecurity({
  unique_name: "Row Level Security by Region",
  label: "Row Level Security by Region",
  object_type: SMLObjectType.RowSecurity,
  dataset: "User to Country Map",
  filter_key_column: "country",
  ids_column: "username",
  id_type: SMLRowSecurityIdType.Group,
  scope: SMLRowSecurityScope.All,
});

const allRowSecurities = {
  securityByRegion,
};

export const row_securities = getAggregatedResult<SMLRowSecurity, typeof allRowSecurities>(allRowSecurities);
