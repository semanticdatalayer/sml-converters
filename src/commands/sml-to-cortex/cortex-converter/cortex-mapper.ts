import { 
    SMLMetric, 
    SMLMetricCalculated, 
    SMLDimensionMetric, 
    SMLDimensionLevelAttribute, 
    SMLDimensionSecondaryAttribute, 
    SMLLevelAliasAttribute, 
    SMLCalculationMethod , 
} from "sml-sdk";

import { Logger } from "../../../shared/logger";
import { 
    CortexDimension, 
    CortexMeasure, 
    CortexTimeDimension 
} from "../cortex-models/CortexModel";
import { ensureUnique, replacePlaceholder, transformName } from "./cortex-tools";

export function mapToSnowMeasure(
  metric: SMLMetric | SMLMetricCalculated | SMLDimensionMetric,
  mapDatasetsToDims: Map<string, Set<string>>,
  unsupported_aggregation: Array<string>,
  attrUniqueNames: Set<string>,
  logger: Logger): CortexMeasure {
  const updatedUniqueName = ensureUnique(transformName(metric.unique_name), attrUniqueNames, logger);
  const newMeas: CortexMeasure = {
    name: updatedUniqueName,
    description: metric.description,
    synonyms: [metric.label],
    expr: `'"${metric.unique_name}"'`,
    data_type: "NUMBER",
  };
  let agg = "";
  if ("calculation_method" in metric) {
    agg = toCortexAggregation(metric.calculation_method);
    if (agg) {
      newMeas.default_aggregation = agg;
    } else {
      unsupported_aggregation.push(`${metric.label} (${metric.calculation_method})`);
    }
  }
  if (mapDatasetsToDims.size > 0 && "dataset" in metric) {
    const dimSet = mapDatasetsToDims.get(metric.dataset);
    if (dimSet) newMeas.allowed_dimensions = Array.from(dimSet);
  }
  return newMeas;
}

export function mapToSnowDim(
  attribute: SMLDimensionLevelAttribute | SMLDimensionSecondaryAttribute | SMLLevelAliasAttribute,
  roleplay: string,
  numericColumns: Set<string>,
  attrUniqueNames: Set<string>,
  logger: Logger): CortexDimension {
  const updatedUniqueName = ensureUnique(
    transformName(replacePlaceholder(roleplay, attribute.unique_name)),
    attrUniqueNames,
    logger
  );
  return {
    name: updatedUniqueName,
    synonyms: [replacePlaceholder(roleplay, attribute.label)],
    description: attribute.description ? attribute.description : undefined,
    expr: `'"${replacePlaceholder(roleplay, attribute.unique_name)}"'`,
    data_type: "dataset" in attribute && numericColumns.has(`${attribute.dataset}.${attribute.name_column}`) ? "NUMBER" : "TEXT",
    unique: "is_unique_key" in attribute ? attribute.is_unique_key : false,
  } as CortexDimension;
}

export function mapToSnowTimeDim(
  attribute: SMLDimensionLevelAttribute | SMLDimensionSecondaryAttribute | SMLLevelAliasAttribute,
  role: string,
  attrUniqueNames: Set<string>,
  logger: Logger): CortexTimeDimension {
  const updatedUniqueName = ensureUnique(
    transformName(role.replace("{0}", attribute.unique_name)),
    attrUniqueNames,
    logger
  );
  return {
    name: updatedUniqueName,
    synonyms: [role.replace("{0}", attribute.label)],
    description: attribute.description ? attribute.description : undefined,
    expr: `'"${role.replace("{0}", attribute.unique_name)}"'`,
    data_type: "TIMESTAMP",
    unique: "is_unique_key" in attribute ? attribute.is_unique_key : false,
  } as CortexTimeDimension;
}

function toCortexAggregation(smlCalcMethod: SMLCalculationMethod): string {
  switch (smlCalcMethod) {
    case "sum":
      return smlCalcMethod;
    case "average":
      return "avg";
    case "minimum":
      return "min";
    case "maximum":
      return "max";
    case "count distinct":
      return "count_distinct";
    default: // Not supported by Cortex Analyst. Example is "count non-null"
      return "";
  }
}
