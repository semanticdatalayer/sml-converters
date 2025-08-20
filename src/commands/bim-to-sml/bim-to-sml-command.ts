import { Flags, Command } from "@oclif/core";
import { BimFileParser } from "./bim-file-parser";
import { CommandLogger } from "../../shared/command-logger";
import { SmlResultWriter } from "../../shared/sml-result-writer";
import { parseInputFile, convertInput } from "../../shared/file-system-util";
import { logSmlConverterResult } from "../../shared/sml-convert-result";
import { BimToYamlConverter } from "./bim-converter/bim-to-sml-converter";

export class BimToSmlCommand extends Command {
  static summary = "Converts a Power BI Model to SML";
  static description = ` `;

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
  };

  static examples = [
    "<%= config.bin %> <%= command.id %>",
    "<%= config.bin %> <%= command.id %> --clean",
    "<%= config.bin %> <%= command.id %> --source=./bim-source-path --output=./sml-output-path",
    "<%= config.bin %> <%= command.id %> -s ./bim-source-path -o ./sml-output-path",
    "<%= config.bin %> <%= command.id %> -s ./bim-source-path -o ./sml-output-path --clean",
    "<%= config.bin %> <%= command.id %> -s ./bim-source-path -o ./sml-output-path --atscaleConnectionId=con1 --clean",
  ];

  async run() {
    const { flags } = await this.parse(BimToSmlCommand);
    await this.convert({
      sourcePath: flags.source,
      outputPath: flags.output,
      clean: flags.clean,
      atscaleConnectionId: flags.atscaleConnectionId,
    });
  }

  protected async convert(
    input: convertInput & { atscaleConnectionId: string },
  ) {
    const logger = CommandLogger.for(this);
    const { absoluteOutputPath, absoluteSourcePath } = await parseInputFile(
      input,
      logger,
      this,
    );

    logger.info(`Reading bim from ${absoluteSourcePath}`);

    const bimParsedFile = await BimFileParser.create(logger).parseFile(
      absoluteSourcePath,
    );

    logger.info(`bim files are parsed.`);

    const bimConverter = new BimToYamlConverter(logger);

    const smlResult = await bimConverter.convert(
      bimParsedFile,
      input.atscaleConnectionId,
    );

    logger.info(`SML objects are prepared`);
    await SmlResultWriter.create(logger).persist(absoluteOutputPath, smlResult);

    logger.info(`SML file persisted at ${absoluteOutputPath}`);
    logSmlConverterResult(smlResult, logger);
  }
}
