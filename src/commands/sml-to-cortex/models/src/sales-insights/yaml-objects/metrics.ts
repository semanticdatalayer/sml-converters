import { ObjectType } from "../../ObjectType";
import { CalculationMethod, IYamlMeasure } from "../../yaml/IYamlMeasure";
import { getAggregatedResult, getFreezedObject } from "./utils";

const getMetric = (metric: IYamlMeasure): IYamlMeasure => getFreezedObject(metric);

const calculatedtax1 = getMetric({
  unique_name: "calculatedtax1",
  object_type: ObjectType.Measure,
  label: "Calculated Tax",
  calculation_method: CalculationMethod.Sum,
  format: "$#,##0.00",
  dataset: "factinternetsales",
  column: "Calculated Tax",
});

const customercount1 = getMetric({
  unique_name: "customercount1",
  object_type: ObjectType.Measure,
  label: "Customer Count",
  calculation_method: CalculationMethod.CountDistinct,
  format: "general number",
  dataset: "factinternetsales",
  column: "customerkey",
});

const lastproductunitprice = getMetric({
  unique_name: "lastproductunitprice",
  object_type: ObjectType.Measure,
  label: "Last Product Unit Price",
  calculation_method: CalculationMethod.Maximum,
  format: "$#,##0.00",
  semi_additive: {
    position: "last",
  },
  dataset: "factinternetsales",
  column: "unitprice",
});

const maxOrderDate = getMetric({
  unique_name: "maxOrderDate",
  object_type: ObjectType.Measure,
  label: "MaxOrderDate",
  calculation_method: CalculationMethod.Maximum,
  dataset: "factinternetsales",
  column: "orderdatekey",
});

const maxtaxamount1 = getMetric({
  unique_name: "maxtaxamount1",
  object_type: ObjectType.Measure,
  label: "Max Tax Amount",
  calculation_method: CalculationMethod.Maximum,
  format: "$#,##0.00",
  dataset: "factinternetsales",
  column: "taxamt",
});

const orderquantity1 = getMetric({
  unique_name: "orderquantity1",
  object_type: ObjectType.Measure,
  label: "Order Quantity",
  calculation_method: CalculationMethod.Sum,
  format: "general number",
  dataset: "factinternetsales",
  column: "orderquantity",
});

const salesamount1 = getMetric({
  unique_name: "salesamount1",
  object_type: ObjectType.Measure,
  label: "Sales Amount",
  calculation_method: CalculationMethod.Sum,
  format: "$#,##0.00",
  dataset: "factinternetsales",
  column: "salesamount",
});

const soldproductNDC1 = getMetric({
  unique_name: "soldproductNDC1",
  object_type: ObjectType.Measure,
  label: "SoldProductNDC",
  description: "Sold Product Non-Distinct Count",
  calculation_method: CalculationMethod.NonDistinctCount,
  format: "general number",
  dataset: "factinternetsales",
  column: "productkey",
});

const MinOrderDate = getMetric({
  unique_name: "MinOrderDate",
  object_type: ObjectType.Measure,
  label: "MinOrderDate",
  calculation_method: CalculationMethod.Minimum,
  dataset: "factinternetsales",
  column: "orderdatekey",
});

const customercountestimate1 = getMetric({
  unique_name: "customercountestimate1",
  object_type: ObjectType.Measure,
  label: "Estimated Customer Count",
  calculation_method: CalculationMethod.EstimatedCountDistinct,
  format: "general number",
  dataset: "factinternetsales",
  column: "customerkey",
});

const salesamountAvg1 = getMetric({
  unique_name: "salesamountAvg1",
  object_type: ObjectType.Measure,
  label: "Sales Amount Avg",
  description: "Average Sales Amount",
  calculation_method: CalculationMethod.Average,
  format: "$#,##0.00",
  dataset: "factinternetsales",
  column: "salesamount",
});

const salesamountsstdev1 = getMetric({
  unique_name: "salesamountsstdev1",
  object_type: ObjectType.Measure,
  label: "Sales Amount SStdev",
  calculation_method: CalculationMethod.SampleStandardDeviation,
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

export const metrics = getAggregatedResult<IYamlMeasure, typeof allMetrics>(allMetrics);
