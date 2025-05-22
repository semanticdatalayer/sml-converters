import { SMLCalculationMethod, SMLMetric, SMLMetricCalculated } from "sml-sdk";

import {
  MetricInputSchema,
  MetricInputSchemaOrString,
} from "../dbt-models/dbt-yaml.model";
import { DbtConverter } from "./dbt-converter";

export class DbtTools {
  static noPreOrSuffix(baseName: string): string {
    if (baseName.endsWith("_dataset"))
      baseName = baseName.substring(0, baseName.lastIndexOf("_dataset"));
    if (baseName.startsWith("Dim_")) baseName = baseName.substring(4);
    return baseName;
  }

  static dimName(baseName: string) {
    if (baseName.endsWith("_dataset"))
      baseName = baseName.substring(0, baseName.lastIndexOf("_dataset"));
    if (baseName.startsWith("Dim_")) return baseName;
    return `Dim_${baseName}`;
  }

  static dimLabel(baseName: string) {
    if (baseName.startsWith("Dim ")) return baseName;
    return `Dim ${baseName}`;
  }

  static dsName(baseName: string) {
    if (baseName.endsWith("_dataset")) return baseName;
    return `${baseName}_dataset`;
  }

  static isCalculated(smlMetric: SMLMetric | SMLMetricCalculated | null) {
    if (smlMetric === null) return false;
    if ("expression" in smlMetric) return true;
    return false;
  }

  static refOnly(input: string): string {
    if (input && input.includes("ref(") && input.includes(")")) {
      input = input.replace(/ref\(/g, "");
      input = input.replace(/'/g, "");
      input = input.substring(0, input.lastIndexOf(")"));
    }
    return input;
  }

  static exists<T>(object: T | undefined | null): boolean {
    if (object === null || object === undefined || !object) return false;
    return true;
  }

  static hasStringValue(val: unknown): val is string {
    if (val && this.isString(val) && val.length > 0)
      return typeof val === "string";
    return false;
  }

  static isString(x: unknown): x is string {
    return typeof x === "string" && x !== null;
  }

  static makeStringValue(val: unknown): string {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "number") return val.toString();
    return "";
  }

  static isNumber(val: unknown): boolean {
    if (!val) return false;
    return typeof val === "number";
  }

  static isInt(value: string) {
    if (parseInt(value, 10).toString() === value) {
      return true;
    }
    return false;
  }

  static initCap(val: string): string {
    return DbtTools.makeStringValue(val.charAt(0).toUpperCase() + val.slice(1));
  }

  static makeUniqueName(name: string): string {
    const result = name.replace(/[ #.()&?%-+/]/g, "_").toLowerCase();
    return result;
  }

  static makeLower(name: string): string {
    return name.toLowerCase();
  }

  static mapAggregation(
    agg: string,
    measName: string,
    logger: DbtConverter["logger"],
  ): SMLCalculationMethod {
    if (agg && agg != "") {
      switch (
        agg // DbtTools.makeStringValue(agg.toLocaleLowerCase)) {
      ) {
        case "sum":
          return SMLCalculationMethod.Sum;
        case "min":
          return SMLCalculationMethod.Minimum;
        case "max":
          return SMLCalculationMethod.Maximum;
        case "average":
          return SMLCalculationMethod.Average;
        case "count_distinct":
          return SMLCalculationMethod.CountDistinct;
        case "sum_distinct":
          return SMLCalculationMethod.SumDistinct;
        case "sum_boolean":
          return SMLCalculationMethod.Sum; // TODO: Do we need a calculated column for this?
        case "count":
          return SMLCalculationMethod.NonDistinctCount;
        case "percentile":
          return SMLCalculationMethod.Percentile;
        case "median":
          logger.warn(
            "Measure '" +
              measName +
              "' will be defined with aggregation 'average' because 'median' is not currently supported",
          );
          return SMLCalculationMethod.Average;
      }
    }
    logger.warn(
      `Measure '${measName}' will be defined with aggregation 'sum' because '${agg}' is an unknown or unsupported aggregation type`,
    );
    return SMLCalculationMethod.Sum;
  }

  static typeParamsToObject(
    typeIn: MetricInputSchemaOrString,
  ): MetricInputSchema {
    // object is SMLMetric {
    if (DbtTools.isString(typeIn)) {
      const newVal: MetricInputSchema = { name: typeIn };
      return newVal;
    }
    return typeIn as MetricInputSchema;
  }

  static toObjectFromStringOrObject(
    typeIn: string | object | undefined,
  ): object {
    if (DbtTools.isString(typeIn)) {
      const newVal = { name: typeIn };
      return newVal;
    }
    if (typeIn) return typeIn;
    return typeIn as unknown as object;
  }

  static isUniquelyNamedObject(valIn: undefined): boolean {
    if (valIn && "unique_name" in valIn /* && valIn.unique_name.length > 0 */)
      return true;
    return false;
  }

  static escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
  }

  static replaceAll(str: string, find: string, replace: string) {
    return str.replace(new RegExp(DbtTools.escapeRegExp(find), "g"), replace);
  }
}
