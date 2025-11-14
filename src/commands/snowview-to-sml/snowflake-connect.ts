import { Connection } from "snowflake-sdk";
import { Logger } from "../../shared/logger";
import {
  SnowflakeConfig,
  SnowflakeConnection,
} from "../../shared/snowflake/SnowflakeConnection";
import {
  ColumnDescribe,
  SemanticViewDescribe,
  SnowviewTable,
  TableDescribe,
} from "./SnowviewModel";

export interface SnowflakeSVConnection {
  getSemanticViewFromSnowflake(): Promise<Array<SemanticViewDescribe>>;
  getTableFromSnowflake(snowviewTable: SnowviewTable): Promise<TableDescribe>;
}

export class SnowflakeCon implements SnowflakeSVConnection {
  private connection: Connection | null = null;
  private logger: Logger;
  private config: SnowflakeConfig;
  constructor(logger: Logger, snowflakeConnection: SnowflakeConnection) {
    this.connection = snowflakeConnection.getConnection();
    this.logger = logger;
    this.config = snowflakeConnection.getConfig();
  }

  async getSemanticViewFromSnowflake(): Promise<Array<SemanticViewDescribe>> {
    if (!this.connection) {
      this.logger.error("Connection is not established.");
      return Promise.reject();
    }

    const describeCommand = `DESCRIBE SEMANTIC VIEW ${this.config.database}.${this.config.schema}.${this.config.view}`;
    this.logger.info(`Executing command: ${describeCommand}`);

    try {
      return new Promise((resolve, reject) => {
        this.connection!.execute({
          sqlText: describeCommand,
          complete: (err, _, rows) => {
            if (err) {
              this.logger.error(
                `Error executing DESCRIBE command: ${err.message}`,
              );
              reject(err);
            } else {
              this.logger.info(
                `Successfully retrieved semantic view: ${this.config.view}`,
              );
              resolve(rows || ([] as Array<SemanticViewDescribe>));
            }
          },
        });
      });
    } catch (err) {
      this.logger.error(`Error getting semantic view: ${err}`);
      return Promise.reject();
    }
  }

  async getTableFromSnowflake(
    snowviewTable: SnowviewTable,
  ): Promise<TableDescribe> {
    if (!this.connection) {
      this.logger.error("Connection is not established.");
      return Promise.reject();
    }

    const describeCommand = `DESCRIBE TABLE ${snowviewTable.database}.${snowviewTable.schema}.${snowviewTable.table}`;
    this.logger.info(`Executing command: ${describeCommand}`);

    try {
      return new Promise((resolve, reject) => {
        this.connection!.execute({
          sqlText: describeCommand,
          complete: (err, _, rows) => {
            if (err) {
              this.logger.error(
                `Error executing DESCRIBE command: ${err.message}`,
              );
              reject(err);
            } else {
              this.logger.info(
                `Successfully retrieved table: ${snowviewTable.table}`,
              );
              resolve({
                columns: (rows || []).map((row) => ({
                  name: row.name,
                  type: row.type,
                  kind: row.kind,
                })) as ColumnDescribe[],
              } as TableDescribe);
            }
          },
        });
      });
    } catch (err) {
      this.logger.error(`Error getting table: ${err}`);
      return Promise.reject();
    }
  }
}
