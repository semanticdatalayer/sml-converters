import path from "path";
import yaml from "js-yaml";
import fs from "fs/promises";
import { CortexConverterResult } from "../commands/sml-to-cortex/cortex-models/CortexConverterResult";
import { encodeFileName } from "./file-system-util";
import { Logger } from "./logger";

/**
 * Saves an array of Cortex model objects as YAML files to the specified output directory.
 *
 * @param cortexModels - The result object containing an array of Cortex models to be saved as YAML files.
 * @param outputDir - The directory where the YAML files will be saved.
 * @param logger - Logger instance used for logging information and errors.
 * @returns An array of file paths for the saved YAML files.
 */
export async function saveCortexYamlFiles(
  cortexModels: CortexConverterResult,
  outputDir: string,
  logger: Logger,
) {
  await Promise.all(
    cortexModels.models.map(async (obj) => {
      try {
        const yamlStr = yaml.dump(obj).replaceAll("'''", "'");
        // const yamlStr = yaml.dump(obj);
        const fileName = `${encodeFileName(obj.name)}.yml`;
        const filePath = path.join(outputDir, fileName);
        await fs.writeFile(filePath, yamlStr, "utf8");
        logger.info(`Wrote Cortex yaml file to: ${filePath}`);
      } catch (err) {
        logger.error(`Error saving Cortex yaml file: ${err}`);
      }
    }),
  );
}
