import { Flags, Command } from "@oclif/core";
import { CommandLogger } from "../../shared/command-logger";
import { CortexConverter } from "./cortex-converter/cortex-converter";
import {
  convertInput,
  parseInput,
} from "../../shared/file-system-util";
import { saveCortexYamlFiles } from "../../shared/cortex-converter-util";

export class SMLToCortexCommand extends Command {
  static description = "Convert from SML to Snowflake Cortex Analyst yaml";

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
  };

  static examples = [
    "<%= config.bin %> <%= command.id %> ",
    "<%= config.bin %> <%= command.id %> --clean",
    "<%= config.bin %> <%= command.id %> --source=./sml-source-path --output=./cortex-output-path",
    "<%= config.bin %> <%= command.id %> -s ./sml-source-path -o ./cortex-output-path",
    "<%= config.bin %> <%= command.id %> -s ./sml-source-path -o ./cortex-output-path --clean",
  ];

  async run() {
    const { flags } = await this.parse(SMLToCortexCommand);
    await this.convertToCortex({
      sourcePath: flags.source,
      outputPath: flags.output,
      clean: flags.clean,
    });
  }

  /**
   * Converts SML models to Cortex Analyst YAML models and writes them into the specified output directory.
   *
   * @param input - The input parameters required for the conversion, including source and output paths.
   * @returns An array of file paths for the generated Cortex YAML files.
   */
  private async convertToCortex(input: convertInput) {
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
    try {
      await saveCortexYamlFiles(cortexModels, absoluteOutputPath, logger);
      logger.info("Completed writing Cortex yaml files");
    } catch (err) {
      logger.error(`Error writing Cortex yaml file(s): ${err}`);
    }
  }
}
