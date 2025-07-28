import { fileSystemUtil } from "../../../shared/file-system-util";
import Guard from "../../../shared/guard";
import { Logger } from "../../../shared/logger";
import { CortexModel } from "../cortex-models/CortexModel";
import * as fs from "fs";
import yaml from "js-yaml";
import { SnowflakeConfig } from "./SnowflakeConnection";
import {
  transformName,
  isReservedWord,
} from "../cortex-converter/cortex-tools";

export class CortexAnalyzer {
  private logger: Logger;
  private snowflakeConfig: SnowflakeConfig;

  constructor(logger: Logger, snowflakeConfig: SnowflakeConfig) {
    this.logger = logger;
    this.snowflakeConfig = snowflakeConfig;
  }

  async getCortexModelFromFile(cortexPath: string): Promise<CortexModel> {
    const fileExists = await fileSystemUtil.fileExists(cortexPath);
    Guard.should(fileExists, `The source file (${cortexPath}) does not exists`);

    const fileContents = fs.readFileSync(cortexPath, "utf8");
    return yaml.load(fileContents) as CortexModel;
  }

  getFactsFromModel(cortexModel: CortexModel): Map<string, string> {
    if (!cortexModel.tables) {
      throw new Error(`No tables found in cortex model: ${cortexModel.name}`);
    }
    const modelFacts = new Map<string, string>();
    cortexModel.tables.forEach((cortexTable) => {
      // get measures name and datatype foreach
      cortexTable.measures.forEach((cortexMeasure) => {
        modelFacts.set(cortexMeasure.expr, cortexMeasure.data_type);
      });
      if (cortexTable.dimensions) {
        cortexTable.dimensions.forEach((cortexDimension) => {
          modelFacts.set(cortexDimension.expr, cortexDimension.data_type);
        });
      }
      if (cortexTable.time_dimensions) {
        cortexTable.time_dimensions.forEach((cortexDimension) => {
          modelFacts.set(cortexDimension.expr, cortexDimension.data_type);
        });
      }
    });
    return modelFacts;
  }

  updateCortexModel(cortexModel: CortexModel) {
    cortexModel.name = transformName(cortexModel.name);
    const baseTableName = `"ATSCALE_${cortexModel.name}"`;
    cortexModel.tables?.forEach((cortexTable) => {
      cortexTable.name = transformName(cortexTable.name);
      cortexTable.baseTable.database = this.snowflakeConfig.database;
      cortexTable.baseTable.schema = this.snowflakeConfig.schema;
      cortexTable.baseTable.table = baseTableName;
      cortexTable.measures.forEach((cortexMeasure) => {
        this.sanitizeReservedName(cortexMeasure);
      });
      if (cortexTable.dimensions) {
        cortexTable.dimensions.forEach((cortexDimension) => {
          this.sanitizeReservedName(cortexDimension);
        });
      }
      if (cortexTable.time_dimensions) {
        cortexTable.time_dimensions.forEach((cortexDimension) => {
          this.sanitizeReservedName(cortexDimension);
        });
      }
    });
    return baseTableName;
  }

  sanitizeReservedName<T extends CortexFact>(fact: T): void {
    if (!fact || typeof fact.name !== "string") return;

    if (isReservedWord(fact.name)) {
      this.logger.warn(
        `"${fact.name}" is a Snowflake/SQL reserved word. Renaming to "_${fact.name}"`,
      );

      fact.synonyms ??= [];
      if (!fact.synonyms.includes(fact.name)) {
        fact.synonyms.push(fact.name);
      }

      fact.name = `_${fact.name}`;
    }
  }
}

interface CortexFact {
  name: string;
  synonyms?: string[];
}
