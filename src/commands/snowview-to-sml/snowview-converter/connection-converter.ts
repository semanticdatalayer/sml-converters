import { SMLConnection, SMLObjectType } from "sml-sdk";
import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { SnowviewModel } from "../SnowviewModel";

export class SnowviewConnectionConverter {
  constructor(private readonly logger: Logger) {}

  /**
   * Creates SML connections based on database.schema combinations found in Snowview tables
   * @param asConnection - The connection string to be used for the 'as_connection' property
   * @param snowviewModel - The source Snowview model containing tables with database and schema information
   * @param result - The SML converter result object where the generated connections will be stored
   */
  createConnections(
    asConnection: string,
    snowviewModel: SnowviewModel,
    result: SmlConverterResult,
  ) {
    const sources = new Set<string>(
      snowviewModel.tables.map((t) => `${t.database}.${t.schema}`),
    );
    for (const source of sources) {
      const [database, schema] = source.split(".");
      const connection: SMLConnection = {
        object_type: SMLObjectType.Connection,
        unique_name: `connection_${schema}`,
        label: `connection_${schema}`,
        as_connection: asConnection,
        database: database,
        schema: schema,
      };
      result.connections.push(connection);
    }
  }
}
