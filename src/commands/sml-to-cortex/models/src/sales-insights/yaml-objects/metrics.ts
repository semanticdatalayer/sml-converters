import {
  SMLObjectType,
  SMLCalculationMethod,
  SMLMetric
} from 'sml-sdk'
// import { ObjectType as SMLObjectType } from "../../ObjectType";
// import { CalculationMethod as SMLCalculationMethod, IYamlMeasure as SMLMetric } from "../../yaml/IYamlMeasure";
import { getAggregatedResult, getFreezedObject } from "./utils";

const getMetric = (metric: SMLMetric): SMLMetric => getFreezedObject(metric);

const calculatedtax1 = getMetric({
  unique_name: "calculatedtax1",
  object_type: SMLObjectType.Metric,
  label: "Calculated Tax",
  calculation_method: SMLCalculationMethod.Sum,
  format: "$#,##0.00",
  dataset: "factinternetsales",
  column: "Calculated Tax",
});

const customercount1 = getMetric({
  unique_name: "customercount1",
  object_type: SMLObjectType.Metric,
  label: "Customer Count",
  calculation_method: SMLCalculationMethod.CountDistinct,
  format: "general number",
  dataset: "factinternetsales",
  column: "customerkey",
});

const lastproductunitprice = getMetric({
  unique_name: "lastproductunitprice",
  object_type: SMLObjectType.Metric,
  label: "Last Product Unit Price",
  calculation_method: SMLCalculationMethod.Maximum,
  format: "$#,##0.00",
  semi_additive: {
    position: "last",
  },
  dataset: "factinternetsales",
  column: "unitprice",
});

const maxOrderDate = getMetric({
  unique_name: "maxOrderDate",
  object_type: SMLObjectType.Metric,
  label: "MaxOrderDate",
  calculation_method: SMLCalculationMethod.Maximum,
  dataset: "factinternetsales",
  column: "orderdatekey",
});

const maxtaxamount1 = getMetric({
  unique_name: "maxtaxamount1",
  object_type: SMLObjectType.Metric,
  label: "Max Tax Amount",
  calculation_method: SMLCalculationMethod.Maximum,
  format: "$#,##0.00",
  dataset: "factinternetsales",
  column: "taxamt",
});

const orderquantity1 = getMetric({
  unique_name: "orderquantity1",
  object_type: SMLObjectType.Metric,
  label: "Order Quantity",
  calculation_method: SMLCalculationMethod.Sum,
  format: "general number",
  dataset: "factinternetsales",
  column: "orderquantity",
});

const salesamount1 = getMetric({
  unique_name: "salesamount1",
  object_type: SMLObjectType.Metric,
  label: "Sales Amount",
  calculation_method: SMLCalculationMethod.Sum,
  format: "$#,##0.00",
  dataset: "factinternetsales",
  column: "salesamount",
});

const soldproductNDC1 = getMetric({
  unique_name: "soldproductNDC1",
  object_type: SMLObjectType.Metric,
  label: "SoldProductNDC",
  description: "Sold Product Non-Distinct Count",
  calculation_method: SMLCalculationMethod.NonDistinctCount,
  format: "general number",
  dataset: "factinternetsales",
  column: "productkey",
});

const MinOrderDate = getMetric({
  unique_name: "MinOrderDate",
  object_type: SMLObjectType.Metric,
  label: "MinOrderDate",
  calculation_method: SMLCalculationMethod.Minimum,
  dataset: "factinternetsales",
  column: "orderdatekey",
});

const customercountestimate1 = getMetric({
  unique_name: "customercountestimate1",
  object_type: SMLObjectType.Metric,
  label: "Estimated Customer Count",
  calculation_method: SMLCalculationMethod.EstimatedCountDistinct,
  format: "general number",
  dataset: "factinternetsales",
  column: "customerkey",
});

const salesamountAvg1 = getMetric({
  unique_name: "salesamountAvg1",
  object_type: SMLObjectType.Metric,
  label: "Sales Amount Avg",
  description: "Average Sales Amount",
  calculation_method: SMLCalculationMethod.Average,
  format: "$#,##0.00",
  dataset: "factinternetsales",
  column: "salesamount",
});

const salesamountsstdev1 = getMetric({
  unique_name: "salesamountsstdev1",
  object_type: SMLObjectType.Metric,
  label: "Sales Amount SStdev",
  calculation_method: SMLCalculationMethod.SampleStandardDeviation,
  format: "$#,##0.00",
  dataset: "factinternetsales",
  column: "salesamount",
});

const allMetrics = {
  calculatedtax1,
  customercount1,
  lastproductunitprice,
  maxOrderDate,
  maxtaxamount1,
  orderquantity1,
  salesamount1,
  soldproductNDC1,
  MinOrderDate,
  customercountestimate1,
  salesamountAvg1,
  salesamountsstdev1,
};

export const metrics = getAggregatedResult<SMLMetric, typeof allMetrics>(allMetrics);
