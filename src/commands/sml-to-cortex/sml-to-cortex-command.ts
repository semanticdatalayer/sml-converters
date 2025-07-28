import { Command } from "@oclif/core";
import fs from "fs/promises";
import yaml from "js-yaml";
import path from "path";
import { CommandLogger } from "../../shared/command-logger";
import { Logger } from "../../shared/logger";
import { CortexConverter } from "./cortex-converter/cortex-converter";
import { CortexConverterResult } from "./cortex-models/CortexConverterResult";
import {
  convertInput,
  parseInput,
  encodeFileName,
} from "../../shared/file-system-util";
import { GitHubAuthentication } from "../../shared/git/githubAuth";
import {
  SnowflakeConfig,
  SnowflakeConnection,
} from "./cortex-connect/SnowflakeConnection";
import {
  validateConfiguration,
  ConfigurationError,
} from "./cortex-connect/cortex-config-validator";
import { gitCredentials, GitPullError } from "../../shared/git/types";
import { CortexAnalyzer } from "./cortex-connect/CortexAnalyzer";
import snowflake from "snowflake-sdk";
import { cortexFlags } from "./sml-to-cortex-flags";

export class SMLToCortexCommand extends Command {
  static description = "Convert from SML to Snowflake Cortex Analyst yaml";

  static flags = cortexFlags;

  static examples = [
    "<%= config.bin %> <%= command.id %> ",
    "<%= config.bin %> <%= command.id %> --clean",
    "<%= config.bin %> <%= command.id %> --source=./sml-source-path --output=./cortex-output-path",
    "<%= config.bin %> <%= command.id %> -s ./sml-source-path -o ./cortex-output-path",
    "<%= config.bin %> <%= command.id %> -s ./sml-source-path -o ./cortex-output-path --clean",
    "<%= config.bin %> <%= command.id %> --github=https://github.com/<your-sml-model>.git --gitUsername=your-username --gitPassword=your-password",
    "<%= config.bin %> <%= command.id %> --github=https://github.com/<your-sml-model>.git --gitToken=your-git-token",
    "<%= config.bin %> <%= command.id %> --snowflakeAccount=SNOWFLAKE-ACCOUNT --snowflakeDatabase=DATABASE --snowflakeSchema=SCHEMA --snowflakeStage=STAGE --snowflakeAuthenticator=EXTERNALBROWSER",
    "<%= config.bin %> <%= command.id %> --snowflakeAccount=SNOWFLAKE-ACCOUNT --snowflakeDatabase=DATABASE --snowflakeSchema=SCHEMA --snowflakeStage=STAGE --snowflakeAuthenticator=SNOWFLAKE --snowflakeUsername=username --snowflakePassword=password",
  ];

  async run() {
    const { flags } = await this.parse(SMLToCortexCommand);

    const logger = CommandLogger.for(this);

    try {
      validateConfiguration(flags, logger);

      let { localPath, githubAuth } = await this.getSmlFileDir(
        flags,
        "./tmp",
        logger,
      ); // pull git repo into directory, or files are already given

      const cortex_files = await this.convertToCortex({
        sourcePath: localPath,
        outputPath: flags.output,
        clean: flags.clean,
      });

      if (githubAuth && !flags.keepfiles) await githubAuth.removeRepository();

      if (flags.snowflakeAccount) {
        // if the user is adding it to snowflake
        await this.addFilesToSnowflake(flags, cortex_files, logger);
      }
    } catch (error) {
      this.handleError(error, logger);
    }
  }

  /**
   * Retrieves the directory containing the SML files, either by pulling from a GitHub repository
   * or by using a local directory, based on the provided flags.
   *
   * If `flags.gitURL` is not specified, it assumes a local directory and returns the source path.
   *
   * @param flags - An object containing git credentials and the source path.
   * @param localPath - The local directory path where the repository should be cloned or accessed.
   * @param logger - Logger instance for logging operations.
   * @returns An object containing the local path and, if applicable, the GitHub authentication instance.
   * @throws {GitPullError} If pulling the GitHub repository fails.
   */
  private async getSmlFileDir(
    flags: gitCredentials & { source: string },
    localPath: string,
    logger: Logger,
  ): Promise<{ localPath: string; githubAuth?: GitHubAuthentication }> {
    let githubAuth: GitHubAuthentication;
    if (flags.gitURL) {
      // if we are using github
      logger.info(`Cloning SML model from Github: ${flags.gitURL}`);
      if (flags.gitToken) {
        githubAuth = new GitHubAuthentication(
          {
            repoUrl: flags.gitURL.toString(),
            localDir: localPath,
            auth: {
              type: "token",
              token: flags.gitToken,
            },
          },
          logger,
        );
      } else {
        // use username and password for authentication
        githubAuth = new GitHubAuthentication(
          {
            repoUrl: flags.gitURL.toString(),
            localDir: localPath,
            auth: {
              type: "username-password",
              username: flags.gitUsername || "",
              password: flags.gitPassword || "",
            },
          },
          logger,
        );
      }
      const response = await githubAuth.pullRepository(true); // pull github repo into localPath
      if (response.success === false) {
        throw new GitPullError(response.message);
      }
      logger.info(`Successfully cloned repository to: ${localPath}`);
      return { localPath, githubAuth };
    } else {
      // we are using a local directory, which means the user will give us a source
      logger.info(`Using local SML files from: ${flags.source}`);
      return { localPath: flags.source };
    }
  }

  /**
   * Converts SML models to Cortex Analyst YAML models and writes them into the specified output directory.
   *
   * @param input - The input parameters required for the conversion, including source and output paths.
   * @returns An array of file paths for the generated Cortex YAML files.
   */
  private async convertToCortex(input: convertInput): Promise<string[]> {
    const logger = CommandLogger.for(this);

    const { absoluteOutputPath, absoluteSourcePath } = await parseInput(
      input,
      logger,
      this,
    );

    logger.info(`Starting conversion to Cortex Analyst yaml`);
    const cortexConverter = new CortexConverter(logger);
    const cortexModels = await cortexConverter.convertYamlFiles(
      absoluteSourcePath,
    );
    const numModels = cortexModels.models.length;

    logger.info(
      `Completed converting ${numModels} Cortex Analyst yaml model${
        numModels === 1 ? "" : "s"
      }`,
    );

    // Write to files
    let cortex_files: string[] = [];
    try {
      cortex_files = await saveCortexYamlFiles(
        cortexModels,
        absoluteOutputPath,
        logger,
      );
      logger.info("Completed writing Cortex yaml files");
    } catch (err) {
      logger.error(`Error writing Cortex yaml file(s): ${err}`);
    }
    return cortex_files;
  }

  private async addFilesToSnowflake(
    flags: any,
    cortexFiles: Array<string>,
    logger: Logger,
  ) {
    const snowflakeConfig = {
      account: flags.snowflakeAccount,
      database: flags.snowflakeDatabase,
      schema: flags.snowflakeSchema,
      stage: flags.snowflakeStage,
      role: flags.snowflakeRole,
      warehouse: flags.snowflakeWarehouse,
    } as SnowflakeConfig;

    const snowflakeConn = new SnowflakeConnection(logger, snowflakeConfig);

    logger.info("Connecting to Snowflake");
    await snowflakeConn.connect({
      authenticator: flags.snowflakeAuthenticator,
      token: flags.snowflakeToken,
      username: flags.snowflakeUsername,
      password: flags.snowflakePassword,
      passcode: flags.passcode,
      privateKey: flags.privateKey,
      privateKeyPath: flags.privateKeyPath,
      privateKeyPass: flags.privateKeyPass,
      oauthClientId: flags.oauthClientId,
      oauthClientSecret: flags.oauthClientSecret,
      oauthAuthorizationUrl: flags.oauthAuthorizationUrl,
      oauthTokenRequestUrl: flags.oauthTokenRequestUrl,
    });

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
          await snowflakeConn.addFileToStage(
            cortexPath,
            true,
            !flags.keepfiles,
          );

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
                await snowflakeConn.writeSemanticModelYaml(
                  cortexModel,
                  baseTableName,
                );
              }
            },
          );
        } catch (err) {
          logger.error(`Error adding files to Snowflake: ${err}`);
        }
      }),
    );
  }

  /**
   * Handles errors that occur during command execution.
   *
   * @param error - Error object to handle
   * @param logger - Logger instance for error reporting
   */
  private handleError(error: unknown, logger: Logger): void {
    if (error instanceof GitPullError) {
      logger.error(`GitHub Error: ${error.message}`);
      logger.error("Check your repository URL and authentication credentials");
    } else if (error instanceof ConfigurationError) {
      logger.error(`Configuration Error: ${error.message}`);
      logger.error("Run with --help to see configuration options");
    } else if (error instanceof Error) {
      logger.error(`Error: ${error.message}`);
    } else {
      logger.error(`Unknown error: ${String(error)}`);
    }
    // Exit with error code
    process.exit(1);
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
