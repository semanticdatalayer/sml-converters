import { Command, Flags } from "@oclif/core";
import dotenv from "dotenv";
import { CommandLogger } from "../../shared/command-logger";
import { Logger } from "../../shared/logger";
import { SnowflakeAuth } from "../../shared/snowflake/SnowflakeAuth";
import {
  SnowflakeConfig,
  SnowflakeConnection,
} from "../../shared/snowflake/SnowflakeConnection";
import { validateConfiguration } from "../../shared/snowflake/cortex-config-validator";
import {
  propertyMap,
  SemanticViewDescribe,
  SnowviewDimension,
  SnowviewFact,
  SnowviewMetric,
  SnowviewModel,
  SnowviewRelationship,
  SnowviewTable,
} from "./SnowviewModel";
import { SnowflakeCon } from "./snowflake-connect";

import { parseOutput } from "../../shared/file-system-util";
import { logSmlConverterResult } from "../../shared/sml-convert-result";
import { SmlResultWriter } from "../../shared/sml-result-writer";
import { isArrayString } from "../../shared/array-util";
import { SnowviewConverter } from "./snowview-converter/snowview-converter";

dotenv.config();

export class SnowviewToSmlCommand extends Command {
  static summary = "Convert from Snowflake's Semantic View to SML";

  static flags = {
    output: Flags.directory({
      description: "Output folder",
      required: false,
      default: "./bim_output",
      aliases: ["o"],
    }),
    clean: Flags.boolean({
      description: "Clean the output folder contents without the .git folder",
      required: false,
      default: false,
    }),
    atscaleConnectionId: Flags.string({
      description:
        "AtScale connection id. The connection id of the data warehouse in AtScale.",
      required: false,
      default: "con1",
    }),
    // Snowflake Configuration flags
    snowflakeAuthenticator: Flags.string({
      description: "Snowflake authenticator type",
      required: true,
      default: "SNOWFLAKE",
      //   options: enumUtil.getAllValues(SnowflakeAuthenticators, "string"),
      env: "SNOWFLAKE_AUTH",
    }),
    snowflakeAccount: Flags.string({
      description: "Snowflake account identifier",
      required: true,
      env: "SNOWFLAKE_ACCOUNT",
    }),
    snowflakeDatabase: Flags.string({
      description: "Snowflake database name",
      required: true,
      env: "SNOWFLAKE_DATABASE",
    }),
    snowflakeSchema: Flags.string({
      description: "Snowflake schema name",
      required: true,
      env: "SNOWFLAKE_SCHEMA",
    }),
    snowflakeView: Flags.string({
      description: "Snowflake Semantic View name ",
      required: true,
      env: "SNOWFLAKE_VIEW",
    }),
    snowflakeWarehouse: Flags.string({
      description: "Snowflake warehouse name",
      required: false,
      env: "SNOWFLAKE_WAREHOUSE",
    }),
    snowflakeRole: Flags.string({
      description: "Snowflake role to use for the connection",
      required: false,
      env: "SNOWFLAKE_ROLE",
    }),
  };

  static examples = [
    "<%= config.bin %> <%= command.id %> --snowflakeAuthenticator=SNOWFLAKE",
    "<%= config.bin %> <%= command.id %> --snowflakeAuthenticator=EXTERNALBROWSER",
    "<%= config.bin %> <%= command.id %> --snowflakeAuthenticator=SNOWFLAKE_JWT",
  ];

  async run() {
    const { flags } = await this.parse(SnowviewToSmlCommand);
    const logger = CommandLogger.for(this);
    await this.convert(flags, logger);
  }

  private async convert(flags: any, logger: Logger) {
    const snowflakeConfig: SnowflakeConfig = {
      account: flags.snowflakeAccount,
      database: flags.snowflakeDatabase,
      schema: flags.snowflakeSchema,
      stage: flags.snowflakeStage,
      role: flags.snowflakeRole,
      warehouse: flags.snowflakeWarehouse,
      view: flags.snowflakeView,
    };

    const connectConfig: SnowflakeAuth = {
      authenticator: flags.snowflakeAuthenticator,
      token: process.env.SNOWFLAKE_TOKEN,
      username: process.env.SNOWFLAKE_USERNAME,
      password: process.env.SNOWFLAKE_PASSWORD,
      passcode: process.env.SNOWFLAKE_PASSCODE,
      privateKeyPath: process.env.SNOWFLAKE_PRIVATE_KEY_PATH,
      privateKeyPass: process.env.SNOWFLAKE_PRIVATE_KEY_PASS,
      oauthClientId: process.env.SNOWFLAKE_OAUTH_CLIENT_ID,
      oauthClientSecret: process.env.SNOWFLAKE_OAUTH_CLIENT_SECRET,
      oauthAuthorizationUrl: process.env.SNOWFLAKE_OAUTH_AUTH_URL,
      oauthTokenRequestUrl: process.env.SNOWFLAKE_OAUTH_TOKEN_REQUEST_URL,
    };

    validateConfiguration({ ...flags, ...connectConfig }, logger);

    // Validate output folder
    const { absoluteOutputPath } = await parseOutput(
      {
        sourcePath: "",
        outputPath: flags.output,
        clean: flags.clean,
      },
      logger,
      this,
    );

    const snowflakeConn = new SnowflakeConnection(logger, snowflakeConfig);

    // Connect to Snowflake
    logger.info("Connecting to Snowflake");
    await snowflakeConn.connect(connectConfig);

    const snowflakeCon = new SnowflakeCon(logger, snowflakeConn);
    // Get Semantic View from Snowflake
    const semanticView = await snowflakeCon.getSemanticViewFromSnowflake();
    // Convert Semantic View Describe to SnowviewModel
    const snowviewModel = this.transformSemanticView(semanticView);

    const snowviewConverter = new SnowviewConverter(logger);
    const smlResult = await snowviewConverter.convert(
      snowviewModel,
      snowflakeCon,
      flags.snowflakeView,
      flags.atscaleConnectionId,
    );

    logger.info(`SML objects are prepared`);
    await SmlResultWriter.create(logger).persist(absoluteOutputPath, smlResult);

    logger.info(`SML file persisted at ${absoluteOutputPath}`);
    logSmlConverterResult(smlResult, logger);
  }

  transformSemanticView(
    semanticView: Array<SemanticViewDescribe>,
  ): SnowviewModel {
    const result: SnowviewModel = {
      tables: new Array<SnowviewTable>(),
      relationships: new Array<SnowviewRelationship>(),
      facts: new Array<SnowviewFact>(),
      dimensions: new Array<SnowviewDimension>(),
      metrics: new Array<SnowviewMetric>(),
    };

    for (const item of semanticView) {
      if (item.object_kind) {
        if (item.object_kind === "EXTENSION") {
          if (!result.comment) {
            result.comment = "";
          }
          result.comment += `\nExtension: ${item.property_value}`;
          continue;
        }
        if (!propertyMap.has(item.property)) {
          console.log(`Skipping unknown property: ${item.property}`);
          continue;
        }
        const currModelObject = result[
          `${item.object_kind.toLowerCase()}s` as keyof SnowviewModel
        ] as Array<any>;
        const modelObject = currModelObject.find(
          (obj) => obj.name === item.object_name,
        );
        if (modelObject) {
          if (isArrayString(item.property_value)) {
            modelObject[propertyMap.get(item.property)!] = JSON.parse(
              item.property_value,
            );
          } else {
            modelObject[propertyMap.get(item.property)!] = item.property_value;
            if (item.property === "BASE_TABLE_NAME") {
              modelObject[
                propertyMap.get(item.property)!
              ] = `"${item.property_value}"`;
            }
          }
        } else {
          const newObject: any = { name: item.object_name };
          newObject[propertyMap.get(item.property)!] = item.property_value;
          if (item.parent_entity) {
            newObject["parent_entity"] = item.parent_entity;
          }
          currModelObject.push(newObject);
        }
      } else {
        // Handle items with null object_kind
        if (item.property === "COMMENT") {
          if (!result.comment) {
            result.comment = "";
          }
          result.comment += item.property_value;
        }
      }
    }
    return result;
  }
}
