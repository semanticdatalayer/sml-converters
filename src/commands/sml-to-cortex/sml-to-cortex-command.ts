import { Flags, Command } from "@oclif/core";
import fs from "fs/promises";
import yaml from "js-yaml";
import path from "path";
import { CommandLogger } from "../../shared/command-logger";
import { Logger } from "../../shared/logger";
import CortexConverter from "./cortex-converter/cortex-converter";
import { CortexConverterResult } from "./cortex-models/CortexConverterResult";
import { convertInput, parseInput } from "../../shared/file-system-util";
import { GitHubAuthentication } from "../../shared/git/githubAuth";
import { SnowflakeConnection } from "./cortex-connect/cortex-connection";
import { gitCredentials } from "../../shared/git/types";
import { GitPullError } from "../../shared/git/types";

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class SMLToCortexCommand extends Command {
  static description = "Convert from SML to Snowflake Cortex Analyst yaml";

  static strict = false; // Allow unknown flags

  static flags = {
    source: Flags.directory({
      description: "Source folder",
      default: "./",
      required: false,
      aliases: ["s"],
    }),
    output: Flags.directory({
      description: "Directory in which to write cortex yaml output file(s)",
      required: false,
      default: "./cortex_output/",
      aliases: ["o"],
    }), 
    clean: Flags.boolean({
      description: "Clean the output folder contents without the .git folder",
      required: false,
      default: false,
    }),
    gitURL: Flags.url({
      description: "GitHub repository URL to pull SML models from",
      required: false,
      aliases: ["github"],
    }),
    gitToken: Flags.string({
      description: "GitHub token for authentication",
      env: "GITHUB_TOKEN",
      required: false,
    }),
    gitUsername: Flags.string({
      description: "GitHub username for authentication",
      env: "GITHUB_USERNAME",
      required: false,
    }),
    gitPassword: Flags.string({
      description: "GitHub password for authentication",
      env: "GITHUB_PASSWORD",
      required: false,
    }),
    snowflakeAccount: Flags.string({
      description: "Snowflake account identifier",
      required: false,
      env: "SNOWFLAKE_ACCOUNT",
    }),
    snowflakeDatabase: Flags.string({
      description: "Snowflake database name",
      required: false,
      env: "SNOWFLAKE_DATABASE",
    }),
    snowflakeSchema: Flags.string({
      description: "Snowflake schema name",
      required: false,
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
      hidden: true, // Hide this flag from help output
    }),
    snowflakeRole: Flags.string({
      description: "Snowflake role to use for the connection",
      required: false,
      env: "SNOWFLAKE_ROLE",
      hidden: true, // Hide this flag from help output
    }),
    snowflakeAuthenticator: Flags.string({
      description: "Snowflake authenticator type (e.g., 'EXTERNALBROSWER', 'OAUTH', 'SNOWFLAKE')",
      required: false,
      env: "SNOWFLAKE_AUTHENTICATOR",
      default: "snowflake",
      options: ["EXTERNALBROWSER", "OAUTH", "SNOWFLAKE"],
    }),
    snowflakeToken: Flags.string({
      description: "Snowflake OAuth token for authentication",
      required: false,
      env: "SNOWFLAKE_TOKEN",
    }),
    snowflakeUsername: Flags.string({
      description: "Snowflake username for authentication",
      required: false,
      env: "SNOWFLAKE_USERNAME",
    }),
    snowflakePassword: Flags.string({
      description: "Snowflake password or PAT for authentication",
      required: false,
      env: "SNOWFLAKE_PASSWORD",
    }),
  };

  static examples = [
    "<%= config.bin %> <%= command.id %> ", 
    "<%= config.bin %> <%= command.id %> --clean",
    "<%= config.bin %> <%= command.id %> --source=./sml-source-path --output=./cortex-output-path",
    "<%= config.bin %> <%= command.id %> -s ./sml-source-path -o ./cortex-output-path",
    "<%= config.bin %> <%= command.id %> -s ./sml-source-path -o ./cortex-output-path --clean",
    "<%= config.bin %> <%= command.id %> --github=https://github.com/<your-sml-model>.git --gitUsername=your-username --gitPassword=your-password",
    "<%= config.bin %> <%= command.id %> --github=https://github.com/<your-sml-model>.git --gitToken=your-git-token",
    "<%= config.bin %> <%= command.id %> --snowflakeAccount=SNOWFLAKE-ACCOUNT --snowflakeDatabase=DATABASE --snowflakeSchema=SCHEMA --snowflakeStage=STAGE --snowflakeAuthenticator=externalbrowser",
    "<%= config.bin %> <%= command.id %> --snowflakeAccount=SNOWFLAKE-ACCOUNT --snowflakeDatabase=DATABASE --snowflakeSchema=SCHEMA --snowflakeStage=STAGE --snowflakeAuthenticator=snowflake --snowflakeUsername=username --snowflakePassword=password",
  ];

  async run() {
    const { flags } = await this.parse(SMLToCortexCommand);

    const logger = CommandLogger.for(this);

    let githubAuth: GitHubAuthentication | undefined;
    try {
      validateConfiguration(flags, logger);

      let {localPath, githubAuth:auth} = await this.getSmlFileDir(flags, "./tmp", logger); // pull git repo into directory, or files are already there
      
      githubAuth = auth;

      const cortex_files = await this.convertToCortex({
        sourcePath: localPath,
        outputPath: flags.output,   //TODO: remove directory after pushing the files to cortex
        clean: flags.clean,
      });

      if (isSnowflakeConfigured(flags)) { // if they want to add it to snowflake

        const snowflakeConn = new SnowflakeConnection(logger, {
          account: flags.snowflakeAccount,
          database: flags.snowflakeDatabase,
          schema: flags.snowflakeSchema,
          stage: flags.snowflakeStage,
          role: flags.snowflakeRole,
          warehouse: flags.snowflakeWarehouse,
        });

        await snowflakeConn.connect({
          authenticator: flags.snowflakeAuthenticator,
          token: flags.snowflakeToken,
          username: flags.snowflakeUsername || '',
          password: flags.snowflakePassword || ''
        })

        await snowflakeConn.addFilesToStage(cortex_files, false, flags.clean);
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
  private async getSmlFileDir(flags: gitCredentials & {source: string}, localPath: string, logger: Logger): Promise<{localPath: string, githubAuth?: GitHubAuthentication}> {
    let githubAuth: GitHubAuthentication;
    if (flags.gitURL) { // if we are using github
      logger.info(`Cloning SML model from Github: ${flags.gitURL}`)
      if (flags.gitToken) {
        githubAuth = new GitHubAuthentication({
        repoUrl: flags.gitURL.toString(),
        localDir: localPath,
        auth: {
          type: "token",
          token: flags.gitToken,
        },
        }, logger);
      } else {
        // use username and password for authentication
        githubAuth = new GitHubAuthentication({
          repoUrl: flags.gitURL.toString(),
          localDir: localPath,
          auth: {
            type: "username-password",
            username: flags.gitUsername || "",
            password: flags.gitPassword || "",
          },
        }, logger);
      }
      const response = await githubAuth.pullRepository(true); // pull github repo into localPath
      if (response.success === false) {
        throw new GitPullError(response.message);
      }
      logger.info(` Successfully cloned repository to: ${localPath}`);
      return {localPath, githubAuth};
    } else {
      // we are using a local directory, which means it should give us a source
      logger.info(`Using local SML files from: ${flags.source}`)
      return {localPath: flags.source};
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
      this
    );

    logger.info(`Starting conversion to Cortex Analyst yaml`)
    const cortexConverter = new CortexConverter(logger);
    const cortexModels = await cortexConverter.convertYamlFiles(absoluteSourcePath);
    const numModels = cortexModels.models.length;

    logger.info(
      `Completed converting ${numModels} Cortex Analyst yaml model${numModels === 1 ? "" : "s"}`,
    );

    // Write to files
    let cortex_files: string[] = [];
    try {
      cortex_files = await saveCortexYamlFiles(cortexModels, absoluteOutputPath, logger);
      logger.info("Completed writing Cortex yaml files")
    } catch (err) {
      logger.error(`Error writing Cortex yaml file(s): ${err}`);
    }
    return cortex_files;
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
async function saveCortexYamlFiles (
  cortexModels: CortexConverterResult,
  outputDir: string,
  logger: Logger,
): Promise<string[]> {
  let cortex_files: string[] = [];
  try {
    await Promise.all(
      cortexModels.models.map(async (obj) => {
        const yamlStr = yaml.dump(obj);
        const fileName = `${obj.name}.yml`;
        const filePath = path.join(outputDir, fileName);
        await fs.writeFile(filePath, yamlStr, "utf8");
        logger.info(`Wrote Cortex yaml file to: ${filePath}`);
        cortex_files.push(filePath);
      }),
    );
  } catch (err) {
    logger.error(`Error saving Cortex yaml file(s): ${err}`);
  }
  return cortex_files;
}

/**
   * Validates the command configuration and flags for common issues.
   * 
   * @param flags - Command flags to validate
   * @param logger - Logger instance for error reporting
   * @throws {ConfigurationError} When configuration is invalid
   */
  function validateConfiguration(flags: any, logger: Logger): void {
    // Validate GitHub authentication
    if (flags.gitURL) {
      if (!flags.gitToken && (!flags.gitUsername || !flags.gitPassword)) {
        throw new ConfigurationError(
          "GitHub authentication required: provide either --gitToken or both --gitUsername and --gitPassword"
        );
      }
    }

    // Validate Snowflake configuration
    if (isSnowflakeConfigured(flags)) {
      const required = ['snowflakeAccount', 'snowflakeDatabase', 'snowflakeSchema', 'snowflakeStage'];
      const missing = required.filter(field => !flags[field]);
      
      if (missing.length > 0) {
        throw new ConfigurationError(
          `Missing required Snowflake configuration: ${missing.join(', ')}`
        );
      }

      // Validate Snowflake authentication
      if (flags.snowflakeAuthenticator === 'snowflake') {
        if (!flags.snowflakeUsername || !flags.snowflakePassword) {
          throw new ConfigurationError(
            "Snowflake username and password required when using 'snowflake' authenticator"
          );
        }
      } else if (flags.snowflakeAuthenticator === 'oauth') {
        if (!flags.snowflakeToken) {
          throw new ConfigurationError(
            "Snowflake token required when using 'oauth' authenticator"
          );
        }
      }
    }

    // Validate source directory exists if not using GitHub
    if (!flags.gitURL && flags.source) {
      logger.debug(`Using local source directory: ${flags.source}`);
    }
  }

  /**
   * Checks if Snowflake configuration is provided.
   * 
   * @param flags - Command flags to check
   * @returns True if Snowflake account is configured
   */
  function isSnowflakeConfigured(flags: any): boolean {
    return Boolean(flags.snowflakeAccount);
  }