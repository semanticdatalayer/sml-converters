import { Logger } from "../../shared/logger";
import fs from "fs/promises";

import { BimRoot } from "./bim-models/bim-model";

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
