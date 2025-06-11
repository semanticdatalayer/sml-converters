import { ObjectType } from "../../ObjectType";
import { IYamlConnection } from "../../yaml/IYamlConnection";
import { getAggregatedResult, getFreezedObject } from "./utils";

const getConnection = (input: IYamlConnection) => getFreezedObject(input);

const con1 = getConnection({
  unique_name: "Postgres",
  object_type: ObjectType.Connection,
  as_connection: "con1",
  label: "Postgres",
  database: "atscale",
  schema: "as_adventure",
  override: true,
});

const allConnections = {
  con1,
};

export const connections = getAggregatedResult<IYamlConnection, typeof allConnections>(allConnections);
