import { ICommonAttributeProps, IFormatting } from "./ISharedProps";
import { YamlColumnDataType } from "./IYamlDataset";
// import { IYamlObject } from "./IYamlObject"; overriden

import {SMLObject} from "sml-sdk";

export enum AggregationMethod {
  Sum = "SUM",
  Min = "MIN",
  Max = "MAX",
  Count = "COUNT",
  Avg = "AVG",
}

export enum CalculationMethod {
  Sum = "sum",
  Average = "average",
  Minimum = "minimum",
  Maximum = "maximum",
  CountDistinct = "count distinct",
  SumDistinct = "sum distinct",
  EstimatedCountDistinct = "estimated count distinct",
  NonDistinctCount = "count non-null",
  SampleStandardDeviation = "stddev_samp",
  PopulationStandardDeviation = "stddev_pop",
  SampleVariance = "var_samp",
  PopulationVariance = "var_pop",
  Percentile = "percentile",
  Enum = "enum",
}

export enum UnrelatedDimensionsHandling {
  Error = "error",
  Repeat = "repeat",
  Empty = "empty",
}

const CALC_METHODS_ALL = [
  CalculationMethod.Sum,
  CalculationMethod.Average,
  CalculationMethod.Minimum,
  CalculationMethod.Maximum,
  CalculationMethod.CountDistinct,
  CalculationMethod.SumDistinct,
  CalculationMethod.EstimatedCountDistinct,
  CalculationMethod.NonDistinctCount,
  CalculationMethod.SampleStandardDeviation,
  CalculationMethod.PopulationStandardDeviation,
  CalculationMethod.SampleVariance,
  CalculationMethod.PopulationVariance,
  CalculationMethod.Percentile,
];

const CALC_METHODS_NO_PERCENTILE = CALC_METHODS_ALL.filter((m) => m !== CalculationMethod.Percentile);

export const DEFAULT_CALCULATION_METHOD = CalculationMethod.Sum;

export type CalcMethodsMap = Record<YamlColumnDataType, CalculationMethod[]>;
export const calcMethodsMap: CalcMethodsMap = {
  [YamlColumnDataType.Int]: CALC_METHODS_ALL,
  [YamlColumnDataType.Long]: CALC_METHODS_ALL,
  [YamlColumnDataType.Float]: CALC_METHODS_ALL,
  [YamlColumnDataType.Double]: CALC_METHODS_ALL,
  [YamlColumnDataType.Decimal]: CALC_METHODS_ALL,
  [YamlColumnDataType.BigInt]: CALC_METHODS_ALL,
  [YamlColumnDataType.TinyInt]: CALC_METHODS_ALL,
  [YamlColumnDataType.Number]: CALC_METHODS_ALL,
  [YamlColumnDataType.Numeric]: CALC_METHODS_ALL,
  [YamlColumnDataType.DateTime]: CALC_METHODS_NO_PERCENTILE,
  [YamlColumnDataType.Date]: CALC_METHODS_NO_PERCENTILE,
  [YamlColumnDataType.Boolean]: CALC_METHODS_NO_PERCENTILE,
  [YamlColumnDataType.String]: CALC_METHODS_NO_PERCENTILE,
  [YamlColumnDataType.TimeStamp]: CALC_METHODS_NO_PERCENTILE,
};

export interface IYamlMeasureSemiAdditiveDegenerateDimension {
  name: string;
  level: string;
}

export type IYamlMeasureSemiAdditiveRelationships = Array<string | Array<string>>;

export interface IYamlMeasureSemiAdditive {
  position: string;
  relationships?: IYamlMeasureSemiAdditiveRelationships;
  degenerate_dimensions?: Array<IYamlMeasureSemiAdditiveDegenerateDimension>;
}

export interface IYamlMeasure extends SMLObject, ICommonAttributeProps, IFormatting {
  dataset: string;
  column: string;
  calculation_method: CalculationMethod;
  compression?: number;
  semi_additive?: IYamlMeasureSemiAdditive;
  unrelated_dimensions_handling?: UnrelatedDimensionsHandling;
  named_quantiles?: string;
}

export interface IYamlMeasureCalculated extends SMLObject, ICommonAttributeProps, IFormatting {
  expression: string;
  mdx_aggregate_function?: AggregationMethod;
}
