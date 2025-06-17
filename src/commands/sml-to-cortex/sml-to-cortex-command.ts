import { Args, Flags, Command } from "@oclif/core";
import path from "path";
import fs from "fs/promises";
import yaml from "js-yaml";
import { CommandLogger } from "../../shared/command-logger";
import { Logger } from "../../shared/logger";
import CortexConverter from "./cortex-converter/cortex-converter";
import { ICortexConverterResult } from "./cortex-converter/ICortexConverter";
import { ensureDir } from "../../shared/file-system-util";

export class SMLToCortex extends Command {
  static description = "Convert from SML to Snowflake Cortex Analyst yaml.";
  static args = {
    inPath: Args.directory({
      description: "Path to the SML directory to convert",
      required: true,
    }),
  };

  static flags = {
    "output-path": Flags.string({
      description: "Directory in which to write cortex yaml output file(s)",
      required: false,
      default: "./cortexOutput/",
    }),
  };

  // static examples = ["<%= config.bin %> <%= command.id %> ./sml-input-path", "<%= config.bin %> <%= command.id %> ./sml-input-path "];
  static examples = [
    "<%= config.bin %> <%= command.id %> ./sml-input-path",
    '<%= config.bin %> <%= command.id %> ./sml-input-path --output-path="path-to-cortex-file"',
  ];

  async run() {
    const { args, flags } = await this.parse(SMLToCortex);
    await this.convertToCortex(args.inPath, flags["output-path"]);
  }

  private async convertToCortex(inPath: string, outPath: string) {
    const resolvedInPath = path.resolve(inPath);
    let resolvedOutPath = path.resolve(outPath);
    if (!resolvedOutPath.endsWith("/")) {
      resolvedOutPath += "/";
    }

    const logger = CommandLogger.for(this);

    const cortexConverter = new CortexConverter({logger: logger, smlFilesPath: inPath, doMapDatasetsToDims: true});
    const cortexModels = await cortexConverter.convertYamlFiles(resolvedInPath);
    const numModels = cortexModels.filesOutput.length;

    logger.info(
      `Completed converting ${numModels} Cortex Analyst yaml model${numModels === 1 ? "" : "s"}`,
    );

    // Write to files
    await saveCortexYamlFiles(cortexModels, resolvedOutPath, logger)
      .then(() => logger.info("Completed writing Cortex yaml files"))
      .catch(console.error);

    this.exit(0);
  }
}

async function saveCortexYamlFiles(
  cortexModels: ICortexConverterResult,
  outputDir: string,
  logger: Logger,
) {
  try {
    ensureDir(outputDir);

    await Promise.all(
      cortexModels.filesOutput.map(async (obj) => {
        const yamlStr = yaml.dump(obj);
        const fileName = `${obj.name}.yml`;
        const filePath = `${outputDir}${fileName}`;
        await fs.writeFile(filePath, yamlStr, "utf8");
        logger.info(`Wrote Cortex yaml file to: ${filePath}`);
      }),
    );
  } catch (err) {
    console.error("Error saving Cortex yaml file(s):", err);
  }
}
