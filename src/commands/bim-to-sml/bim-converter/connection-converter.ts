import { SMLConnection, SMLObjectType } from "sml-sdk";
import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { BimRoot } from "../bim-models/bim-model";
import { makeUniqueName } from "./tools";

export class ConnectionConverter {
  private logger: Logger;
  constructor(logger: Logger) {
    this.logger = logger;
  }

  // In a BIM datasource the Initial Catalog refers to the database (in the connectionString)
  createConnections(
    connectionID: string,
    bim: BimRoot,
    result: SmlConverterResult,
  ): void {
    const usedConnections = this.listUsedConnections(result);
    const default_unique_name = makeUniqueName(`connection.${bim.name}`);
    let connection: SMLConnection;

    // Create a default connection where user can fill in details
    if (
      !bim.model.dataSources ||
      usedConnections.size === 0 ||
      usedConnections.has(default_unique_name)
    ) {
      connection = {
        unique_name: default_unique_name,
        object_type: SMLObjectType.Connection,
        label: default_unique_name,
        as_connection: connectionID,
        database: "<TODO: FIll THIS IN>",
        schema: "<TODO: FIll THIS IN>",
      } satisfies SMLConnection;
      result.connections.push(connection);
    }

    // Create a SML connection for each used datasource defined in the bim
    bim.model.dataSources?.forEach((dataSource) => {
      if (usedConnections.has(dataSource.name)) {
        let connectionProps: Record<string, string> = {};
        if (dataSource.connectionString) {
          connectionProps = this.parseConnectionString(
            dataSource.connectionString,
          );
        } else if (dataSource.connectionDetails?.address) {
          if (dataSource.connectionDetails?.address.database)
            connectionProps["Database"] =
              dataSource.connectionDetails?.address.database; // parseSnowflakeMExpression(dataSource.connectionDetails);
          if (dataSource.connectionDetails?.address.schema)
            connectionProps["Schema"] =
              dataSource.connectionDetails?.address.schema;
        }

        connection = {
          unique_name: dataSource.name,
          object_type: SMLObjectType.Connection,
          label: dataSource.name,
          as_connection: connectionID,
          database: connectionProps["Database"] ?? "<TODO: FIll THIS IN>",
          schema: connectionProps["Schema"] ?? "<TODO: FIll THIS IN>",
        };
        result.connections.push(connection);
      } else {
        this.logger.warn(
          `Datasource '${dataSource.name}' is referenced but not defined so a connection should be created manually for it`,
        );
      }
    });
    // }
  }

  listUsedConnections(result: SmlConverterResult): Set<string> {
    const connections: Set<string> = new Set();
    result.datasets.forEach((dataset) => {
      connections.add(dataset.connection_id);
    });
    return connections;
  }

  parseConnectionString(connStr: string): Record<string, string> {
    return connStr
      .split(";")
      .filter((part) => part.trim() !== "") // remove empty entries
      .reduce((acc, pair) => {
        const [key, ...valueParts] = pair.split("=");
        const keyTrimmed = key.trim();
        const value = valueParts.join("=").trim(); // handles values with '=' in them
        if (keyTrimmed) acc[keyTrimmed] = value;
        return acc;
      }, {} as Record<string, string>);
  }
}
