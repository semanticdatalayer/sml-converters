import {
  SMLCalculationMethod,
  SMLDimensionLevel,
  SMLDimensionMetric,
  SMLDimensionSecondaryAttribute,
  SMLLevelAliasAttribute,
  SMLLevelParallelPeriod,
} from "sml-sdk";

// import { overridden
//   IYamlDimensionLevel,
//   IYamlDimensionMetric,
//   IYamlDimensionSecondaryAttribute,
//   IYamlLevelAliasAttribute,
//   IYamlLevelParallelPeriod,
// } from "../../src/yaml/IYamlDimension";
// import { CalculationMethod } from "../../src/yaml/IYamlMeasure";

export const DEFAULT_SECONDARY_ATTRIBUTE: SMLDimensionSecondaryAttribute = {
  unique_name: "unique name",
  label: "Label",
  dataset: "dataset",
  name_column: "name_column",
};

export const DEFAULT_METRIC: SMLDimensionMetric = {
  label: "no name",
  unique_name: "no unique name",
  calculation_method: SMLCalculationMethod.Maximum,
  dataset: "no dataset reference",
  column: "no column",
};

export const DEFAULT_PARALLEL_PERIOD: SMLLevelParallelPeriod = {
  level: "no name",
  key_columns: ["no name"],
};

export const DEFAULT_LEVEL_ALIAS: SMLLevelAliasAttribute = {
  label: "no name",
  unique_name: "no unique name",
  dataset: "no dataset reference",
  name_column: "no column",
};

export const DEFAULT_LEVEL: SMLDimensionLevel = {
  unique_name: "no unique name",
  secondary_attributes: [],
  aliases: [],
  metrics: [],
};
