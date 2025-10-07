import snowflake, { Connection, ConnectionOptions } from "snowflake-sdk";
import { Logger } from "../logger";
import { SnowflakeAuth, SnowflakeAuthenticators } from "./SnowflakeAuth";

export interface SnowflakeConfig {
  account: string;
  role?: string;
  application?: any;
  warehouse?: string;
  database: string;
  schema: string;
  stage?: string;
  view?: string;
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
      stage: config?.stage,
      view: config?.view,
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

    const connectionOptions = {
      ...this.config,
      ...auth,
      application: "AtScale_SML_Converter",
      browserActionTimeout: 60000, // How long to wait for okta or external browser auth, 1 minute
    } satisfies ConnectionOptions;
    this.connection = snowflake.createConnection(connectionOptions);

    if (
      connectionOptions.authenticator ===
        SnowflakeAuthenticators.externalBrowser ||
      connectionOptions.authenticator.includes("okta.com")
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

  getConnection(): Connection {
    if (!this.connection) {
      throw new Error("Connection is not established.");
    }
    return this.connection;
  }

  getConfig(): SnowflakeConfig {
    return this.config;
  }
}
