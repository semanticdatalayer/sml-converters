import {
  SMLObjectType,
  SMLConnection
} from "sml-sdk";

// import { ObjectType } from "../../ObjectType";
// import { IYamlConnection } from "../../yaml/IYamlConnection";
import { getAggregatedResult, getFreezedObject } from "./utils";

const getConnection = (input: SMLConnection) => getFreezedObject(input);

const con1 = getConnection({
  unique_name: "Postgres",
  object_type: SMLObjectType.Connection,
  as_connection: "con1",
  label: "Postgres",
  database: "atscale",
  schema: "as_adventure",
  // override: true,
});

const allConnections = {
  con1,
};

export const connections = getAggregatedResult<SMLConnection, typeof allConnections>(allConnections);
