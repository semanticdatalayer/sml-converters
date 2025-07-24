import snowflake, { Connection, ConnectionOptions } from "snowflake-sdk";
import * as fs from "fs";
import { Logger } from "../../../shared/logger";
import { SnowflakeAuth } from "./types";
import { CortexModel } from "../cortex-models/CortexModel";
import yaml from "js-yaml";
import { fileSystemUtil } from "../../../shared/file-system-util";
import Guard from "../../../shared/guard";

// snowflake.configure({
//   logLevel: "TRACE",
//   logFilePath: "./snowflake_password.log",
//   additionalLogToConsole: true,
// });

export interface SnowflakeConfig {
  account: string;
  role?: string;
  application?: any;
  warehouse?: string;
  database: string;
  schema: string;
  stage: string;
}

export class SnowflakeConnection {
  private connection: Connection | null = null;
  private config: SnowflakeConfig;
  private logger: Logger;

  constructor(logger: Logger, config?: Partial<SnowflakeConfig>) {
    // Load config from environment variables with optional overrides
    this.config = {
      account: config?.account || "",
      role: config?.role,
      application: config?.application,
      warehouse: config?.warehouse,
      database: config?.database || "",
      schema: config?.schema || "",
      stage: config?.stage || "",
    };
    this.logger = logger;

    // Validate required fields
    if (!this.config.account) {
      throw new Error(
        "Snowflake account is required. Pass SNOWFLAKE_ACCOUNT in config.",
      );
    }
  }

  async connect(auth: SnowflakeAuth): Promise<SnowflakeConnection> {
    if (this.connection) {
      return this;
    }

    const connectionOptions: ConnectionOptions = {
      ...this.config,
      ...auth,
      application: "AtScale_SML_Converter",
      browserActionTimeout: 6000, // TODO: how long to wait for okta or external browser, dev only
    };
    this.connection = snowflake.createConnection(connectionOptions);

    if (
      connectionOptions.authenticator?.toLowerCase() === "externalbrowser" ||
      connectionOptions.authenticator?.includes("okta.com")
    ) {
      await this.connection.connectAsync((err, conn) => {
        if (err) {
          throw err;
        } else {
          this.logger.info("Successfully connected to Snowflake.");
        }
      });
    } else {
      await new Promise<void>((resolve, reject) => {
        this.connection!.connect((error) => {
          if (error) {
            // this.logger.error(`Unable to connect: ${error.message}`);
            reject(error);
          } else {
            this.logger.info("Successfully connected to Snowflake.");
            resolve();
          }
        });
      });
    }
    return this;
  }

  disconnect() {
    if (this.connection) {
      this.connection.destroy((err, conn) => {
        if (err) {
          this.logger.error(`Unable to disconnect: ${err.message}`);
        } else {
          this.logger.info("Successfully disconnected from Snowflake.");
        }
      });
      this.connection = null;
    }
  }

  async addFilesToStage(
    filePaths: string[],
    overwrite: boolean = false,
    removeFiles: boolean = true,
  ): Promise<void> {
    await Promise.all(
      filePaths.map((filePath) =>
        this.addFileToStage(filePath, overwrite, removeFiles),
      ),
    );
  }

  private async addFileToStage(
    filePath: string,
    overwrite: boolean = false,
    removeFile: boolean = true,
  ): Promise<void> {
    if (!this.connection) {
      this.logger.error("Connection is not established.");
      return;
    }

    try {
      // Validate the file path
      const fileExists = await fileSystemUtil.fileExists(filePath);
      Guard.should(fileExists, `The source file (${filePath}) does not exists`);

      let putCommand = `PUT file://${filePath} '@"${this.config.stage}"' AUTO_COMPRESS = FALSE`;
      if (overwrite) {
        putCommand += " OVERWRITE = TRUE";
      }
      putCommand += ";";
      this.logger.info(`Executing command: ${putCommand}`);
      this.connection.execute({
        sqlText: putCommand,
        complete: (err) => {
          if (err) {
            this.logger.error(`Error executing PUT command: ${err.message}`);
          } else {
            this.logger.info(
              `Successfully uploaded file to stage: ${this.config.stage}`,
            );
          }
          if (removeFile) {
            fs.rm(filePath, { force: true }, (rmErr) => {
              if (rmErr) {
                this.logger.error(
                  `Failed to remove file ${filePath}: ${rmErr.message}`,
                );
              } else {
                this.logger.info(`Removed file after upload: ${filePath}`);
              }
            });
          }
        },
      });
      this.logger.info(
        `File ${filePath} uploaded to stage ${this.config.stage}`,
      );
    } catch (error) {
      this.logger.error(`Error uploading file to stage: ${error}`);
    }
  }

  createTableCommand(tableName: string, factsMap: Map<string, string>): string {
    let factsArray = Array.from(factsMap).map(([key, value]) => {
      return `${key} ${
        value === "NUMBER" ? "NUMBER(38,0)" : "VARCHAR(16777216)"
      }`; //TODO: Figure out datetime
    });
    const tableCreate = `CREATE OR REPLACE TABLE ${this.config.database}.${
      this.config.schema
    }.${tableName} (
\t${factsArray.join(`,\n\t`)}\n);`;
    return tableCreate;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async addTableToStage(
    createTableCommand: string,
    tableName: string,
    completeTable: (err: snowflake.SnowflakeError | undefined) => Promise<void>,
  ) {
    try {
      // Validate Snowflake connection
      if (!this.connection) {
        this.logger.error("Connection is not established.");
        return;
      }

      this.logger.info(`Creating table ${tableName} in Snowflake`);
      this.connection.execute({
        sqlText: createTableCommand,
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        complete: completeTable,
      });
    } catch (err) {
      this.logger.error(`Error creating table: ${err}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async writeSemanticModelYaml(cortexModel: CortexModel, baseTable: string) {
    if (!cortexModel.tables) {
      this.logger.error(
        `Cortex Model ${cortexModel.name} does not have tables`,
      );
      return;
    }

    let writeCommand = `SELECT SYSTEM$WRITE_SEMANTIC_MODEL_YAML('${
      this.config.database
    }.${this.config.schema}',
$$
${yaml.dump(cortexModel)}
$$);`;

    try {
      if (!this.connection) {
        this.logger.error("Connection is not established.");
        return;
      }
      this.logger.info(`Executing WRITE_SEMANTIC_MODEL_YAML command`);
      this.connection.execute({
        sqlText: writeCommand,
        complete: (err) => {
          if (err) {
            this.logger.error(
              `Error executing WRITE_SEMANTIC_MODEL_YAML command: ${err.message}`,
            );
          } else {
            this.logger.info(
              `Successfully created semantic model ${cortexModel.name} to stage: ${this.config.stage}`,
            );
          }
        },
      });
    } catch (err) {
      this.logger.error(`Error writing semantic model: ${err}`);
    }
  }
}
