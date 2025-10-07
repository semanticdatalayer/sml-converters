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
  getDatasetName,
  getSqlAggAndExpr,
  gettUsedColumn,
  mapSqlAggToMdxAggMethod,
  mapSqlAggToSmlCalcMethod,
  normalizeString,
} from "./converter-util";

export class SnowviewMetricConverter {
  constructor(private readonly logger: Logger) {}

  convertMetrics(
    snowviewMetrics: Array<SnowviewMetric>,
    result: SmlConverterResult,
  ) {
    for (const metric of snowviewMetrics) {
      this.convertMetric(metric, result);
    }
  }

  /**
   * Converts a Snowview metric to an SML metric and adds it to the metrics and model.
   *
   * @param snowviewMetric - The source Snowview metric to be converted
   * @param result - The SML converter result object to store the converted metric
   */
  convertMetric(snowviewMetric: SnowviewMetric, result: SmlConverterResult) {
    // So we need to parse the expression to find the aggregation and the column
    // Then we need to find the column in the dataset
    let { calcMethod, column, newTable } = this.getCalcAndColumn(
      snowviewMetric,
      result,
    );
    if (!calcMethod) {
      this.logger.warn(
        `Unable to determine calculation method for metric: ${snowviewMetric.name}. Defaulting to SUM`,
      );
      calcMethod = SMLCalculationMethod.Sum;
    }
    if (!column) {
      // Check if the "column" is actually a metric previously created. If so, create a calculated metric with an MDX agg
      this.convertCalculatedMetric(snowviewMetric, result);
      return;
    }

    const newMetric: SMLMetric = {
      object_type: SMLObjectType.Metric,
      unique_name: snowviewMetric.name,
      label: snowviewMetric.name,
      calculation_method: calcMethod,
      column: column,
      dataset: newTable
        ? newTable
        : getDatasetName(snowviewMetric.table, result, this.logger),
      description: snowviewMetric.comment,
    };
    if (snowviewMetric.access_modifier === "PRIVATE") {
      newMetric.is_hidden = true;
    }
    result.measures.push(newMetric);
    result.models[0].metrics.push({
      unique_name: newMetric.unique_name,
    });
  }

  /**
   * Converts a Snowview calculated metric to an SML calculated metric and adds it to measuresCalculated and model.
   *
   * @param snowviewMetric - The Snowview metric to convert
   * @param result - The SML converter result object to update
   */
  convertCalculatedMetric(
    snowviewMetric: SnowviewMetric,
    result: SmlConverterResult,
  ) {
    const { sqlAgg, expr } = getSqlAggAndExpr(snowviewMetric.expression);
    const mdxAgg = mapSqlAggToMdxAggMethod(sqlAgg);
    if (!mdxAgg) {
      this.logger.warn(
        `Unable to determine MDX aggregation method for calculated metric: ${snowviewMetric.name}`,
      );
      return;
    }
    const newExpr = expr.includes(".") ? expr.split(".")[1] : expr;
    const smlMetric = result.measures.find(
      (m) => normalizeString(m.unique_name) === normalizeString(newExpr),
    );
    if (!smlMetric) {
      this.logger.warn(
        `Unable to find column or base metric for calculated metric: ${snowviewMetric.name}`,
      );
      return;
    }
    const newCalcMetric: SMLMetricCalculated = {
      object_type: SMLObjectType.MetricCalc,
      unique_name: snowviewMetric.name,
      label: snowviewMetric.name,
      expression: `[Measures].[${smlMetric.unique_name}]`,
      mdx_aggregate_function: mdxAgg,
    };
    result.measuresCalculated.push(newCalcMetric);
    result.models[0].metrics.push({
      unique_name: newCalcMetric.unique_name,
    });
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

    // Snowflake runs their own checks on semantic views when they're created
    // They check to make sure that a metric must have a single aggregate over a column from the same table
    if (expr.includes(".")) {
      const [tbl, col] = expr.split(".");
      if (normalizeString(tbl) !== normalizeString(snowviewMetric.table)) {
        this.logger.warn(
          `Metric ${snowviewMetric.name} references a different table in its expression`,
        );
      }
      return {
        calcMethod: mapSqlAggToSmlCalcMethod(sqlAgg),
        column: gettUsedColumn(tbl, col, result),
        newTable: getDatasetName(tbl, result, this.logger),
      };
    }
    return {
      calcMethod: mapSqlAggToSmlCalcMethod(sqlAgg),
      column: gettUsedColumn(snowviewMetric.table, expr, result),
    };
  }
}
