import { IXmlProjectAttribute } from "./IXmlProjectAttribute";
import { IXmlProjectAttributeKey } from "./IXmlProjectAttributeKey";

export interface IXmlMeasure {
  attribute: IXmlProjectAttribute;
  attributeKey?: IXmlProjectAttributeKey;
}

export enum XmlMetricAggregation {
  Sum = "sum",
  Min = "min",
  Max = "max",
  Maximum = "maximum",
  Minimum = "minimum",
  Average = "avg",
  PopulationVariance = "var_pop",
  SampleVariance = "var_samp",
  PopulationStandardDeviation = "stddev_pop",
  SampleStandardDeviation = "stddev_samp",
  DistinctCount = "count-distinct",
  DistinctCountEstimate = "count-distinct-estimate",
  NonDistinctCount = "count-nonnull",
}

export enum XmlDefaultAggregationType {
  Sum = "SUM",
  Min = "MIN",
  Max = "MAX",
  Average = "AVG",
  PopulationVariance = "VAR_POP",
  SampleVariance = "VAR_SAMP",
  PopulationStandardDeviation = "STDDEV_POP",
  SampleStandardDeviation = "STDDEV_SAMP",
  DistinctCount = "count-distinct",
  DistinctCountEstimate = "count-distinct-estimate",
  NonDistinctCount = "count-nonnull",
  Percentile = "PRE",
}
