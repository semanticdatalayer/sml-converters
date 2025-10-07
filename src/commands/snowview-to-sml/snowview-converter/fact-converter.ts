import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { SnowviewFact, SnowviewModel } from "../SnowviewModel";
import {
  getExpressionInfo,
  getPrimaryUniqueKeys,
  isNumericType,
  normalizeString,
} from "./converter-util";
import { SnowviewDimensionConverter } from "./dimension-converter";
import { SnowviewMetricConverter } from "./metric-converter";

export class SnowviewFactConverter {
  constructor(private readonly logger: Logger) {}

  // For fact conversion, if the fact is numeric, create a measure,
  // if it's non-numeric, add as a dimension

  convertFacts(snowviewModel: SnowviewModel, result: SmlConverterResult) {
    for (const snowviewFact of snowviewModel.facts) {
      // How to know if it should be a metric
      // if it's numeric, likely a metric
      // not always the case
      // If it's a primary key of a table
      // almost definitely a dimension
      if (this.shouldBeMetric(snowviewModel, snowviewFact)) {
        const metricConverter = new SnowviewMetricConverter(this.logger);
        metricConverter.convertMetric(snowviewFact, result);
      } else {
        const dimensionConverter = new SnowviewDimensionConverter(this.logger);
        dimensionConverter.convertSnowviewDimensionToSmlDimension(
          snowviewFact,
          result,
        );
      }
    }
  }

  shouldBeMetric(snowviewModel: SnowviewModel, snowviewFact: SnowviewFact) {
    const shouldBeDimKeys = getPrimaryUniqueKeys(snowviewModel.tables);
    if (
      shouldBeDimKeys.find(
        (key) =>
          normalizeString(key) === normalizeString(snowviewFact.expression),
      )
    ) {
      return false;
    }
    if (isNumericType(snowviewFact.data_type, this.logger)) {
      return true;
    }
    return false;
  }
}
