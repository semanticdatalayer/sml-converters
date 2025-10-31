import { SMLObjectType } from "sml-sdk";
import { Logger } from "../../../shared/logger";
import { SnowviewModel } from "../SnowviewModel";
import { SnowviewConnectionConverter } from "./connection-converter";

const firstDatabase = "first-db";
const secondDatabase = "second-db";
const firstSchema = "first-schema";
const secondSchema = "second-schema";

const asConnection = "con1";

const converter = new SnowviewConnectionConverter({} as Logger);

describe("createConnections", () => {
  it("should create multiple connections for different database-schema combinations", () => {
    const tables = [
      { database: firstDatabase, schema: firstSchema },
      { database: secondDatabase, schema: secondSchema },
    ];

    const connections = converter.createConnections(asConnection, {
      tables,
    } as SnowviewModel);

    const firstConnection = {
      object_type: SMLObjectType.Connection,
      unique_name: `con_${firstDatabase}_${firstSchema}`,
      label: `con_${firstDatabase}_${firstSchema}`,
      as_connection: asConnection,
      database: firstDatabase,
      schema: firstSchema,
    };
    const secondConnection = {
      object_type: SMLObjectType.Connection,
      unique_name: `con_${secondDatabase}_${secondSchema}`,
      label: `con_${secondDatabase}_${secondSchema}`,
      as_connection: asConnection,
      database: secondDatabase,
      schema: secondSchema,
    };

    expect(connections).toEqual([firstConnection, secondConnection]);
  });

  it("should create multiple connections for tables with different database name and the same schema name", () => {
    const tables = [
      { database: firstDatabase, schema: firstSchema },
      { database: secondDatabase, schema: firstSchema },
    ];

    const connections = converter.createConnections(asConnection, {
      tables,
    } as SnowviewModel);

    const firstConnection = {
      object_type: SMLObjectType.Connection,
      unique_name: `con_${firstDatabase}_${firstSchema}`,
      label: `con_${firstDatabase}_${firstSchema}`,
      as_connection: asConnection,
      database: firstDatabase,
      schema: firstSchema,
    };
    const secondConnection = {
      object_type: SMLObjectType.Connection,
      unique_name: `con_${secondDatabase}_${firstSchema}`,
      label: `con_${secondDatabase}_${firstSchema}`,
      as_connection: asConnection,
      database: secondDatabase,
      schema: firstSchema,
    };

    expect(connections).toEqual([firstConnection, secondConnection]);
  });

  it("should create multiple connections for tables with different schema name and the same database name", () => {
    const tables = [
      { database: firstDatabase, schema: firstSchema },
      { database: firstDatabase, schema: secondSchema },
    ];

    const connections = converter.createConnections(asConnection, {
      tables,
    } as SnowviewModel);

    const firstConnection = {
      object_type: SMLObjectType.Connection,
      unique_name: `con_${firstDatabase}_${firstSchema}`,
      label: `con_${firstDatabase}_${firstSchema}`,
      as_connection: asConnection,
      database: firstDatabase,
      schema: firstSchema,
    };
    const secondConnection = {
      object_type: SMLObjectType.Connection,
      unique_name: `con_${firstDatabase}_${secondSchema}`,
      label: `con_${firstDatabase}_${secondSchema}`,
      as_connection: asConnection,
      database: firstDatabase,
      schema: secondSchema,
    };

    expect(connections).toEqual([firstConnection, secondConnection]);
  });

  it("should not create different connections for tables with the same database-schema pair", () => {
    const tables = [
      { database: firstDatabase, schema: firstSchema },
      { database: firstDatabase, schema: firstSchema },
    ];

    const connections = converter.createConnections(asConnection, {
      tables,
    } as SnowviewModel);

    const firstConnection = {
      object_type: SMLObjectType.Connection,
      unique_name: `con_${firstDatabase}_${firstSchema}`,
      label: `con_${firstDatabase}_${firstSchema}`,
      as_connection: asConnection,
      database: firstDatabase,
      schema: firstSchema,
    };

    expect(connections).toEqual([firstConnection]);
  });
});
