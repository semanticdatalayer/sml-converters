import { SMLDataset, SMLDatasetColumnSimple } from "sml-sdk";
import { Logger } from "../../../shared/logger";
import { SnowviewDimension } from "../SnowviewModel";
import {
  mapSqlDatatypeToSmlDataType,
  normalizeSqlIdentifiers,
} from "./converter-util";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { getTimeDatasetDefinition } from "./snowflake-time-dimension";

export class SnowviewDatasetConverter {
  constructor(private readonly logger: Logger) {}

  addCalculatedColumn(
    snowviewDim: SnowviewDimension,
    smlDataset: SMLDataset,
    result: SmlConverterResult,
  ) {
    smlDataset.columns.push({
      name: snowviewDim.name,
      sql: normalizeSqlIdentifiers(snowviewDim.expression, result),
      data_type: mapSqlDatatypeToSmlDataType(
        snowviewDim.data_type,
        this.logger,
      ),
    } satisfies SMLDatasetColumnSimple);
  }

  createTimeDataset(datasetName: string, asConnection: string) {
    return getTimeDatasetDefinition(datasetName, asConnection);
  }
}
