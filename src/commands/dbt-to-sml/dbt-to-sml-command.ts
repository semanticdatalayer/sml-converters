import { Flags, Command } from "@oclif/core";
import path from "path";
import fs from "fs/promises";
import { DbtParser } from "./dbt-converter/dbt-parser";
import { CommandLogger } from "../../shared/command-logger";
import { DbtConverter } from "./dbt-converter/dbt-converter";
import { DWType } from "../../shared/dw-types";
import { SmlResultWriter } from "../../shared/sml-result-writer";
import { fileSystemUtil } from "../../shared/file-system-util";
import Guard from "../../shared/guard";
import { SmlConverterResult } from "../../shared/sml-convert-result";
import { enumUtil } from "../../shared/enum-util";
import { IDbtConverterInput } from "./model";
import { Logger } from "../../shared/logger";

type ConvertInput = {
  sourcePath: string;
  outputPath: string;
  clean: boolean;
} & IDbtConverterInput;

export class DbtToSmlCommand extends Command {
  static summary = "Converts DBT to SML";
  static description = `
  `;

  static flags = {
    source: Flags.directory({
      description: "Source folder",
      default: "./",
      required: false,
      aliases: ["s"],
    }),
    output: Flags.directory({
      description: "Output folder",
      required: false,
      default: "./sml_output",
      aliases: ["o"],
    }),
    dbType: Flags.string({
      description: "Data Warehouse type",
      required: false,
      options: enumUtil.getAllValues(DWType, "string"),
      default: DWType.Snowflake,
    }),
    database: Flags.string({
      description: "Database name",
      required: false,
      default: "sample-db",
    }),
    schema: Flags.string({
      description: "Schema name",
      required: false,
      default: "sample-schema",
    }),
    atscaleConnectionId: Flags.string({
      description:
        "Atscale connection id. The connection id fo the data warehouse in atscale",
      required: false,
      default: "con1",
    }),
    clean: Flags.boolean({
      description: "Clean the output folder contents without the .git folder",
      required: false,
      default: false,
    }),
  };

  static examples = [
    "<%= config.bin %> <%= command.id %>",
    "<%= config.bin %> <%= command.id %> --clean",
    "<%= config.bin %> <%= command.id %> -source ./dbt-source-path -output ./sml-output-path",
    "<%= config.bin %> <%= command.id %> -s ./dbt-source-path -o ./sml-output-path",
    "<%= config.bin %> <%= command.id %> -s ./dbt-source-path -o ./sml-output-path --clean",
  ];

  async run() {
    const { flags } = await this.parse(DbtToSmlCommand);
    await this.convert({
      sourcePath: flags.source,
      outputPath: flags.output,
      clean: flags.clean,

      atscaleConnectionId: flags.atscaleConnectionId,
      database: flags.database,
      dbType: flags.dbType as DWType,
      schema: flags.schema,
    });
  }

  protected async parseInput(
    input: ConvertInput,
    logger: Logger,
  ): Promise<{
    absoluteSourcePath: string;
    absoluteOutputPath: string;
  }> {
    const absoluteSourcePath = path.resolve(input.sourcePath);
    const inputFolderExists = await fileSystemUtil.folderExists(
      absoluteSourcePath,
    );
    Guard.should(
      inputFolderExists,
      `The source folder (${absoluteSourcePath}) does not exists`,
    );

    //TODO: validate folder is empty or ask confirmation the content to be cleared if not empty
    //clear out the folder if user confirms
    const absoluteOutputPath = path.resolve(input.outputPath);

    const outputPathExists = await fileSystemUtil.folderExists(
      absoluteOutputPath,
    );

    if (outputPathExists) {
      const outputSubItems = await fs.readdir(absoluteOutputPath);
      const contents = outputSubItems.filter((n) => n !== ".git");
      const hasContents = contents.length > 0;

      if (hasContents) {
        const outputNotEmptyMsg = `Output folder "${absoluteOutputPath}" is not empty.`;
        if (!input.clean) {
          this.error(outputNotEmptyMsg);
        } else {
          logger.warn(
            `${outputNotEmptyMsg}. --clean flag is provided to remove folder contents`,
          );
          await this.cleanUpOutputFolder(absoluteOutputPath, contents, logger);
          logger.info("Output folder contents deleted");
        }
      }
    } else {
      await fs.mkdir(absoluteOutputPath);
    }

    return {
      absoluteSourcePath,
      absoluteOutputPath,
    };
  }

  protected async cleanUpOutputFolder(
    outputAbsolutePath: string,
    contents: Array<string>,
    logger: Logger,
  ): Promise<void> {
    for (const item of contents) {
      if (item === ".git") continue;

      const itemPath = path.join(outputAbsolutePath, item);
      const stat = await fs.lstat(itemPath);

      if (stat.isDirectory()) {
        logger.info(`${itemPath} - deleting folder and all its contents`);
        await fs.rm(itemPath, { recursive: true, force: true });
      } else {
        logger.info(`${itemPath} - deleting file`);
        await fs.unlink(itemPath);
      }
    }
  }

  protected async convert(input: ConvertInput) {
    const logger = CommandLogger.for(this);
    const { absoluteOutputPath, absoluteSourcePath } = await this.parseInput(
      input,
      logger,
    );

    logger.info(`Reading dbt from ${absoluteSourcePath}`);

    const dbtParsedIndex = await DbtParser.create(logger).parseFolder(
      absoluteSourcePath,
    );

    logger.info(`Dbt files are parsed.`);

    const dbtConverter = new DbtConverter({ logger });

    const smlResult = await dbtConverter.convert(dbtParsedIndex, input);

    logger.info(`SML objects are prepared`);
    await SmlResultWriter.create(logger).persist(absoluteOutputPath, smlResult);

    logger.info(`SML file persisted at ${absoluteOutputPath}`);
    logger.info(`Summary of SML objects created`);

    Object.keys(smlResult).forEach((smlObjectType) => {
      const value = smlResult[smlObjectType as keyof SmlConverterResult];
      if (Array.isArray(value)) {
        logger.info(`${smlObjectType}: ${value.length}`);
      }
    });
  }
}
