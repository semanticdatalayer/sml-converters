import { Flags, Command } from "@oclif/core";
import fs from "fs/promises";
import yaml from "js-yaml";
import path from "path";
import { CommandLogger } from "../../shared/command-logger";
import { Logger } from "../../shared/logger";
import CortexConverter from "./cortex-converter/cortex-converter";
import { CortexConverterResult } from "./cortex-models/CortexConverterResult";
import { convertInput, parseInput } from "../../shared/file-system-util";

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
    "<%= config.bin %> <%= command.id %> -source ./sml-source-path -output ./cortex-output-path",
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

  private async convertToCortex(input: convertInput) {

    const logger = CommandLogger.for(this);

    const { absoluteOutputPath, absoluteSourcePath } = await parseInput(
      input,
      logger
    );

    const cortexConverter = new CortexConverter(logger);
    const cortexModels = await cortexConverter.convertYamlFiles(absoluteSourcePath);
    const numModels = cortexModels.models.length;

    logger.info(
      `Completed converting ${numModels} Cortex Analyst yaml model${numModels === 1 ? "" : "s"}`,
    );

    // Write to files
    try {
      await saveCortexYamlFiles(cortexModels, absoluteOutputPath, logger);
      logger.info("Completed writing Cortex yaml files")
    } catch (err) {
      logger.error(`Error writing Cortex yaml file(s): ${err}`);
    }
    this.exit(0);
  }
}

async function saveCortexYamlFiles(
  cortexModels: CortexConverterResult,
  outputDir: string,
  logger: Logger,
) {
  try {
    await Promise.all(
      cortexModels.models.map(async (obj) => {
        const yamlStr = yaml.dump(obj);
        const fileName = `${obj.name}.yml`;
        const filePath = path.join(outputDir, fileName);
        await fs.writeFile(filePath, yamlStr, "utf8");
        logger.info(`Wrote Cortex yaml file to: ${filePath}`);
      }),
    );
  } catch (err) {
    logger.error(`Error saving Cortex yaml file(s): ${err}`);
  }
}
