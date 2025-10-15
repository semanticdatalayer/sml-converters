import {
  SMLCalculationMethod,
  SMLMetric,
  SMLMetricCalculated,
  SMLObjectType,
} from "sml-sdk";
import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { SnowviewMetric } from "../SnowviewModel";
import {
  getDataset,
  getSqlAggAndExpr,
  getTblAndColFromExpr,
  gettUsedColumn,
  mapSqlAggToMdxAggMethod,
  mapSqlAggToSmlCalcMethod,
  normalizeString,
  setDescription,
} from "./converter-util";

export class SnowviewMetricConverter {
  constructor(private readonly logger: Logger) {}

  convertMetrics(
    snowviewMetrics: Array<SnowviewMetric>,
    result: SmlConverterResult,
  ) {
    const uncreatedMetrics: Array<SnowviewMetric> = [];
    for (const metric of snowviewMetrics) {
      const created = this.convertMetric(metric, result);
      if (!created) {
        uncreatedMetrics.push(metric);
      }
    }
    if (uncreatedMetrics.length > 0) {
      if (uncreatedMetrics.length === snowviewMetrics.length) {
        this.logger.error(
          `Unable to create metrics: ${uncreatedMetrics
            .map((m) => m.name)
            .join(", ")}`,
        );
        return;
      }
      // Try again to create calculated metrics
      this.convertMetrics(uncreatedMetrics, result);
    }
  }

  /**
   * Converts a Snowview metric to an SML metric and adds it to the metrics and model.
   *
   * @param snowviewMetric - The source Snowview metric to be converted
   * @param result - The SML converter result object to store the converted metric
   * @return True if a metric was successfully created, false otherwise
   */
  convertMetric(
    snowviewMetric: SnowviewMetric,
    result: SmlConverterResult,
  ): boolean {
    // Parse the expression to find the aggregation and the column
    // Then we need to find the column in the dataset
    let { calcMethod, column, newTable } = this.getCalcAndColumn(
      snowviewMetric,
      result,
    );

    if (!column) {
      // Check if the "column" is actually a metric previously created. If so, create a calculated metric with an MDX agg
      return this.convertCalculatedMetric(snowviewMetric, result);
    }

    if (!calcMethod) {
      this.logger.warn(
        `Unable to determine calculation method for metric: ${snowviewMetric.name}. Defaulting to SUM`,
      );
      calcMethod = SMLCalculationMethod.Sum;
    }

    const newMetric: SMLMetric = {
      object_type: SMLObjectType.Metric,
      unique_name: snowviewMetric.name,
      label: snowviewMetric.name,
      calculation_method: calcMethod,
      column: column,
      dataset: newTable
        ? newTable
        : getDataset(snowviewMetric.table, result, this.logger)!.unique_name,
      description: setDescription(snowviewMetric),
    };
    if (snowviewMetric.access_modifier === "PRIVATE") {
      newMetric.is_hidden = true;
    }
    result.measures.push(newMetric);
    result.models[0].metrics.push({
      unique_name: newMetric.unique_name,
    });
    return true;
  }

  /**
   * Converts a Snowview calculated metric to an SML calculated metric and adds it to measuresCalculated and model.
   *
   * @param snowviewMetric - The Snowview metric to convert
   * @param result - The SML converter result object to update
   * @returns True if conversion was successful, false otherwise
   */
  convertCalculatedMetric(
    snowviewMetric: SnowviewMetric,
    result: SmlConverterResult,
  ): boolean {
    const { sqlAgg, expr } = getSqlAggAndExpr(snowviewMetric.expression);

    const mdxAgg = mapSqlAggToMdxAggMethod(sqlAgg);
    if (!mdxAgg) {
      this.logger.warn(
        `Unable to determine MDX aggregation method for calculated metric: ${snowviewMetric.name}`,
      );
    }
    const { col, extra } = getTblAndColFromExpr(expr);
    // If extra is given, it is most likely a window function
    // TODO: Handle window functions and other complex expressions

    const smlMetric = result.measures.find(
      (m) => normalizeString(m.unique_name) === normalizeString(col),
    );
    if (!smlMetric) {
      // SUM((STORESALES.SS_SALES_PRICE-item.cost)/item.cost)/SUM(STORESALES.SS_QUANTITY)
      // Expressions like this is convertable, but too complex for now - TODO: need to parse and convert to MDX
      this.logger.warn(
        `Unable to find column or base metric for calculated metric: ${snowviewMetric.name}`,
      );
      return false;
    }
    const newCalcMetric: SMLMetricCalculated = {
      object_type: SMLObjectType.MetricCalc,
      unique_name: snowviewMetric.name,
      label: snowviewMetric.name,
      description: setDescription(snowviewMetric),
      expression: `[Measures].[${smlMetric.unique_name}]`,
      mdx_aggregate_function: mdxAgg,
    };
    if (extra) {
      this.logger.warn(
        `Calculated metric ${snowviewMetric.name} has a complex expression: Please rewrite with proper MDX`,
      );
      newCalcMetric.expression += ` /*TODO: Window Function not added. Rewrite in MDX. Original SQL: ${snowviewMetric.expression}*/`;
    }
    result.measuresCalculated.push(newCalcMetric);
    result.models[0].metrics.push({
      unique_name: newCalcMetric.unique_name,
    });
    return true;
  }

  /**
   * Extracts calculation method and column information from a Snowview metric.
   *
   * @param snowviewMetric - The Snowview metric to extract information from
   * @param result - The SML converter result context
   * @returns An object containing:
   *   - calcMethod: The mapped SML calculation method, or undefined
   *   - column: The referenced column name, or undefined
   *   - newTable: Optional table name if the metric references a different table
   */
  getCalcAndColumn(
    snowviewMetric: SnowviewMetric,
    result: SmlConverterResult,
  ): {
    calcMethod: SMLCalculationMethod | undefined;
    column: string | undefined;
    newTable?: string;
  } {
    const { sqlAgg, expr } = getSqlAggAndExpr(snowviewMetric.expression);
    const { tbl, col } = getTblAndColFromExpr(expr);

    if (tbl && col) {
      if (normalizeString(tbl) !== normalizeString(snowviewMetric.table)) {
        this.logger.warn(
          `Metric ${snowviewMetric.name} references a different table in its expression`,
        );
      }
      return {
        calcMethod: mapSqlAggToSmlCalcMethod(sqlAgg),
        column: gettUsedColumn(tbl, col, result),
        newTable: getDataset(tbl, result, this.logger)?.unique_name,
      };
    }
    return {
      calcMethod: mapSqlAggToSmlCalcMethod(sqlAgg),
      column: gettUsedColumn(snowviewMetric.table, col, result),
    };
  }
}
