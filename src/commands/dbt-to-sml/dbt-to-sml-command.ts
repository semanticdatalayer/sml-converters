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

type ConvertInput = { sourcePath: string; outputPath: string };

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
  };

  static examples = [
    "<%= config.bin %> <%= command.id %>",
    "<%= config.bin %> <%= command.id %> -source ./dbt-source-path -output ./sml-output-path",
    "<%= config.bin %> <%= command.id %> -s ./dbt-source-path -o ./sml-output-path",
  ];

  async run() {
    const { flags } = await this.parse(DbtToSmlCommand);
    await this.convert({
      sourcePath: flags.source,
      outputPath: flags.output,
    });
  }

  protected async parseInput(input: ConvertInput): Promise<{
    absoluteSourcePath: string;
    absoluteOutputPath: string;
  }> {
    const absoluteSourcePath = path.resolve(input.sourcePath);
    const inputFolderExists =
      await fileSystemUtil.folderExists(absoluteSourcePath);
    Guard.should(
      inputFolderExists,
      `The source folder (${absoluteSourcePath}) does not exists`,
    );

    //TODO: validate folder is empty or ask confirmation the content to be cleared if not empty
    //clear out the folder if user confirms
    const absoluteOutputPath = path.resolve(input.outputPath);

    const outputPathExists =
      await fileSystemUtil.folderExists(absoluteOutputPath);

    if (outputPathExists) {
      const outputSubItems = await fs.readdir(absoluteOutputPath);
      Guard.should(
        outputSubItems.length === 0,
        `The output folder (${absoluteOutputPath}) is not empty`,
      );
    } else {
      await fs.mkdir(absoluteOutputPath);
    }

    return {
      absoluteSourcePath,
      absoluteOutputPath,
    };
  }

  protected async convert(input: ConvertInput) {
    const { absoluteOutputPath, absoluteSourcePath } =
      await this.parseInput(input);
    const logger = CommandLogger.for(this);

    logger.info(`Reading dbt from ${absoluteSourcePath}`);

    const dbtParsedIndex =
      await DbtParser.create(logger).parseFolder(absoluteSourcePath);

    logger.info(`Dbt files are parsed.`);

    const dbtConverter = new DbtConverter({ logger });

    const smlResult = await dbtConverter.convert(dbtParsedIndex, {
      atscaleConnectionId: "con1",
      database: "sample-db",
      dbType: DWType.Snowflake,
      schema: "test-schema",
    });

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
