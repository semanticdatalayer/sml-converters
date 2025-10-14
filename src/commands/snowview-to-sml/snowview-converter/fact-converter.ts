import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { SnowviewFact, SnowviewModel } from "../SnowviewModel";
import {
  getDataset,
  getPrimaryUniqueKeys,
  getSqlAggAndExpr,
  isNumericType,
  mapSqlAggToSmlCalcMethod,
  normalizeString,
} from "./converter-util";
import { SnowviewDatasetConverter } from "./dataset-converter";
import { SnowviewDimensionConverter } from "./dimension-converter";
import { SnowviewMetricConverter } from "./metric-converter";

export class SnowviewFactConverter {
  constructor(private readonly logger: Logger) {}
  // Semantic View Facts can act as either metrics, dimensions, or renaming columns

  convertFacts(
    snowviewFacts: SnowviewFact[],
    snowviewModel: SnowviewModel,
    result: SmlConverterResult,
  ) {
    const uncreatedMetrics: Array<SnowviewFact> = [];

    for (const snowviewFact of snowviewFacts) {
      const created = this.convertFact(snowviewFact, snowviewModel, result);
      if (!created) {
        uncreatedMetrics.push(snowviewFact);
      }
    }
    if (uncreatedMetrics.length > 0) {
      if (uncreatedMetrics.length === snowviewFacts.length) {
        this.logger.error(
          `Unable to create metrics: ${uncreatedMetrics
            .map((m) => m.name)
            .join(", ")}`,
        );
        return;
      }
      // Try again to create calculated metrics
      this.convertFacts(uncreatedMetrics, snowviewModel, result);
    }
  }

  convertFact(
    snowviewFact: SnowviewFact,
    snowviewModel: SnowviewModel,
    result: SmlConverterResult,
  ): boolean {
    if (this.shouldBeMetric(snowviewModel, snowviewFact)) {
      const { sqlAgg } = getSqlAggAndExpr(snowviewFact.expression);
      if (!sqlAgg) {
        // Expression is a column reference
        // Should be turned into a calculated column
        const datasetConverter = new SnowviewDatasetConverter(this.logger);
        datasetConverter.addCalculatedColumn(
          snowviewFact,
          getDataset(snowviewFact.table, result, this.logger)!,
          result,
        );
      } else {
        // Has an aggregation, should be a metric
        const metricConverter = new SnowviewMetricConverter(this.logger);
        return metricConverter.convertMetric(snowviewFact, result);
      }
    } else {
      const dimensionConverter = new SnowviewDimensionConverter(this.logger);
      dimensionConverter.convertSnowviewDimensionToSmlDimension(
        snowviewFact,
        result,
      );
    }
    return true;
  }

  /**
   * Determines if a Snowview fact should be converted to a metric in SML
   * @param snowviewModel The Snowview model containing table information
   * @param snowviewFact The Snowview fact to evaluate
   * @returns boolean indicating if the fact should be treated as a metric
   */
  shouldBeMetric(snowviewModel: SnowviewModel, snowviewFact: SnowviewFact) {
    // How to know if it should be a metric:
    // If it's a primary key of a table
    // almost definitely a dimension
    // If it has a sql aggregate, definitely a metric
    // if it's numeric, likely a metric, but not always the case, can only assume
    const shouldBeDimKeys = getPrimaryUniqueKeys(snowviewModel.tables);
    if (
      shouldBeDimKeys.find(
        (key) =>
          normalizeString(key) === normalizeString(snowviewFact.expression),
      )
    ) {
      return false;
    }

    const { sqlAgg } = getSqlAggAndExpr(snowviewFact.expression);
    // If it has a sql aggregate, it should be a metric
    if (sqlAgg) {
      // Check if aggregate is a valid SML aggregation
      // Checking for "aggregates" like CONCAT
      const smlCalc = mapSqlAggToSmlCalcMethod(sqlAgg);
      if (!smlCalc) {
        return false;
      }
      return true;
    }
    if (isNumericType(snowviewFact.data_type, this.logger)) {
      return true;
    }
    return false;
  }
}
