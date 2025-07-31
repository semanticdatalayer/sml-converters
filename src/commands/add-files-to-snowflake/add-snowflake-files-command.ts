import { Command, Flags } from "@oclif/core";
import dotenv from "dotenv";
import fs from "fs/promises";
import yaml from "js-yaml";
import path from "path";
import snowflake from "snowflake-sdk";
import { CommandLogger } from "../../shared/command-logger";
import {
  encodeFileName,
  getFilesAndFolders,
} from "../../shared/file-system-util";
import { Logger } from "../../shared/logger";
import { CortexConverterResult } from "../sml-to-cortex/cortex-models/CortexConverterResult";
import { CortexAnalyzer } from "./CortexAnalyzer";
import {
  SnowflakeConfig,
  SnowflakeConnection,
} from "./cortex-connect/SnowflakeConnection";
import { validateConfiguration } from "./cortex-connect/cortex-config-validator";
import { SnowflakeAuth } from "./cortex-connect/SnowflakeAuth";

dotenv.config();

export class AddFilesToSnowflakeCommand extends Command {
  static summary = "Add converted Snowflake Cortex Analyst yaml to Snowflake";
  static description =
    `Snowflake authentication can be found in .env.example. Types of snowflakeAuthenticator will have different requirements.
    Please read the README.md file to see how to use certain authentication methods.
    Or see https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver-authenticate for what parameters must be set.`;

  static flags = {
    source: Flags.directory({
      description: "Source folder",
      default: "./",
      required: false,
      aliases: ["s"],
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
    snowflakeStage: Flags.string({
      description: "Snowflake stage name for uploading files",
      required: false,
      env: "SNOWFLAKE_STAGE",
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
    const { flags } = await this.parse(AddFilesToSnowflakeCommand);
    const logger = CommandLogger.for(this);

    let { files } = await getFilesAndFolders(flags.source);

    files = files.map((fileName) => {
      return path.join(flags.source, fileName);
    });

    await this.addFilesToSnowflake(flags, files, logger);
  }

  private async addFilesToSnowflake(
    flags: any,
    cortexFiles: Array<string>,
    logger: Logger,
  ) {
    const snowflakeConfig: SnowflakeConfig = {
      account: flags.snowflakeAccount,
      database: flags.snowflakeDatabase,
      schema: flags.snowflakeSchema,
      stage: flags.snowflakeStage,
      role: flags.snowflakeRole,
      warehouse: flags.snowflakeWarehouse,
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

    const snowflakeConn = new SnowflakeConnection(logger, snowflakeConfig);

    logger.info("Connecting to Snowflake");
    await snowflakeConn.connect(connectConfig);

    const cortexAnalyzer = new CortexAnalyzer(logger, snowflakeConfig);
    await Promise.all(
      cortexFiles.map(async (cortexPath) => {
        try {
          // get the cortex Model from a file
          let cortexModel = await cortexAnalyzer.getCortexModelFromFile(
            cortexPath,
          );

          // get all of its facts (dimensions, measures, etc)
          const factsMap = cortexAnalyzer.getFactsFromModel(cortexModel);

          // update existing cortex model with new base table name, database, and schema
          const baseTableName = cortexAnalyzer.updateCortexModel(cortexModel);

          // create the table command
          const createTableCommand = snowflakeConn.createTableCommand(
            baseTableName,
            factsMap,
          );

          // Update original yaml files
          await saveCortexYamlFiles(
            { models: [cortexModel] },
            path.dirname(cortexPath),
            logger,
          );

          // add yaml files to stage
          await snowflakeConn.addFileToStage(cortexPath, true, false);

          // add table to schema
          await snowflakeConn.addTableToSchema(
            createTableCommand,
            baseTableName,
            // wait until table is created to add semantic view to Snowflake
            async (err: snowflake.SnowflakeError | undefined) => {
              if (err) {
                logger.error(
                  `Error executing CREATE TABLE command: ${err.message}`,
                );
              } else {
                logger.info(
                  `Successfully created table ${baseTableName} to schema: ${snowflakeConfig.schema}`,
                );
                await snowflakeConn.writeSemanticModelYaml(cortexModel);
              }
            },
          );
        } catch (err) {
          logger.error(`Error adding files to Snowflake: ${err}`);
        }
      }),
    );
  }
}

/**
 * Saves an array of Cortex model objects as YAML files to the specified output directory.
 *
 * @param cortexModels - The result object containing an array of Cortex models to be saved as YAML files.
 * @param outputDir - The directory where the YAML files will be saved.
 * @param logger - Logger instance used for logging information and errors.
 * @returns An array of file paths for the saved YAML files.
 */
async function saveCortexYamlFiles(
  cortexModels: CortexConverterResult,
  outputDir: string,
  logger: Logger,
): Promise<string[]> {
  let cortex_files: string[] = [];
  await Promise.all(
    cortexModels.models.map(async (obj) => {
      try {
        const yamlStr = yaml.dump(obj).replaceAll("'''", "'");
        // const yamlStr = yaml.dump(obj);
        const fileName = `${encodeFileName(obj.name)}.yml`;
        const filePath = path.join(outputDir, fileName);
        await fs.writeFile(filePath, yamlStr, "utf8");
        logger.info(`Wrote Cortex yaml file to: ${filePath}`);
        cortex_files.push(filePath);
      } catch (err) {
        logger.error(`Error saving Cortex yaml file: ${err}`);
      }
    }),
  );
  return cortex_files;
}
