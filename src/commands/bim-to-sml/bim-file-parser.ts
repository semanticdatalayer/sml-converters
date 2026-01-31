import { Logger } from "../../shared/logger";
import fs from "fs/promises";

import { BimRoot } from "./bim-models/bim-model";
import { ensureArray } from "./bim-converter/tools";

export class BimFileParser {
  private logger: Logger;
  constructor(logger: Logger) {
    this.logger = logger;
  }
  static create(logger: Logger) {
    return new BimFileParser(logger);
  }

  parse(jsonContent: string): BimRoot {
    const result = JSON.parse(jsonContent) as BimRoot;

    // Normalize top-level arrays - some BIM files have single objects instead of arrays
    // when only one element exists (common with XML-to-JSON conversion tools)
    if (result.model) {
      result.model.tables = ensureArray(result.model.tables);
      result.model.relationships = ensureArray(result.model.relationships);
      result.model.dataSources = ensureArray(result.model.dataSources);
      result.model.perspectives = ensureArray(result.model.perspectives);
      result.model.cultures = ensureArray(result.model.cultures);
      result.model.annotations = ensureArray(result.model.annotations);
    }

    // perform checks
    this.validateBIM(result);

    return result;
  }

  async parseFile(filePath: string): Promise<BimRoot> {
    const fileStringContent = await fs.readFile(filePath, "utf-8");
    const result = this.parse(fileStringContent);
    if (!result.name) {
      // use file name as project name if not present
      const pathParts = filePath.split("/");
      const fileName = pathParts[pathParts.length - 1];
      result.name = fileName
        .replace(".bim", "")
        .replace(".json", "")
        .replace("_bim", "");
    }
    return result;
  }

  validateBIM(bim: BimRoot) {
    if (!bim) {
      this.logger.error(`BIM project is not formed correctly`);
      throw new Error(`bim project malformed`);
    }
    if (!bim.model || !bim.model.tables || bim.model.tables.length === 0) {
      this.logger.error(`BIM project is missing a model or tables`);
      throw new Error(`model or tables missing from bim project`);
    }
  }
}
