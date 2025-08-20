import { Flags, Command } from "@oclif/core";
import { DbtParser } from "./dbt-converter/dbt-parser";
import { CommandLogger } from "../../shared/command-logger";
import { DbtConverter } from "./dbt-converter/dbt-converter";
import { DWType } from "../../shared/dw-types";
import { SmlResultWriter } from "../../shared/sml-result-writer";
import { parseInput, convertInput } from "../../shared/file-system-util";
import { logSmlConverterResult } from "../../shared/sml-convert-result";
import { enumUtil } from "../../shared/enum-util";
import { IDbtConverterInput } from "./model";

type DbtConvertInput = convertInput & IDbtConverterInput;

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
        "AtScale connection id. The connection id of the data warehouse in AtScale.",
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

  protected async convert(input: DbtConvertInput) {
    const logger = CommandLogger.for(this);
    const { absoluteOutputPath, absoluteSourcePath } = await parseInput(
      input,
      logger,
      this,
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
    logSmlConverterResult(smlResult, logger);
  }
}
