import { SMLObjectType, SMLMetricCalculated } from "sml-sdk";
// import { IYamlMetricCalculated } from "../../yaml/IYamlMeasure";
import { getAggregatedResult, getFreezedObject } from "./utils";

const getCalc = (input: SMLMetricCalculated) => getFreezedObject(input);

const averageLastProductUnitCountPerOrder = getCalc({
  unique_name: "Average Last Product Unit Count per Order",
  object_type: SMLObjectType.MetricCalc,
  label: "Average Last Product Unit Count per Order",
  expression: "([Measures].[lastproductunitprice] / [Measures].[orderquantity1])",
});

const estimatedCustomerCountOrderCustomPP445PrevYearGrowthPct = getCalc({
  unique_name: "Estimated Customer Count-Order CustomPP445-PrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Estimated Customer Count-Order CustomPP445-PrevYearGrowthPct",
  description: "Percent growth over Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Estimated Customer Count-Order CustomPP445-PrevYear]) THEN NULL \nELSE [Measures].[Estimated Customer Count-Order CustomPP445-PrevYearGrowth] / [Measures].[Estimated Customer Count-Order CustomPP445-PrevYear] \nEND",
  format: "percent",
});

const estimatedCustomerCountOrderRetail44530PrdMvAvgPrevYear = getCalc({
  unique_name: "Estimated Customer Count-Order Retail445-30PrdMvAvgPrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Estimated Customer Count-Order Retail445-30PrdMvAvgPrevYear",
  description: "Prev Year's 30 Period Moving  Average of Sales. Use on the [Order Retail445] Dimension",
  expression:
    "Avg(ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember).Lag(29): \nParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[customercountestimate1]\n)",
  format: "general number",
});

const estimatedCustomerCountOrderRetail44530PrdMvStdev = getCalc({
  unique_name: "Estimated Customer Count-Order Retail445-30PrdMvStdev",
  object_type: SMLObjectType.MetricCalc,
  label: "Estimated Customer Count-Order Retail445-30PrdMvStdev",
  description: "30 Period Standard Deviation Use at Day Level of [Order Retail445]",
  expression:
    "Stdev([Order Date Dimension].[Order Retail445].CurrentMember.Lag(29):[Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[customercountestimate1])",
  format: "general number",
});

const estimatedCustomerCountOrderRetail445Next = getCalc({
  unique_name: "Estimated Customer Count-Order Retail445-Next",
  object_type: SMLObjectType.MetricCalc,
  label: "Estimated Customer Count-Order Retail445-Next",
  description: "Next Period's  Sales Amount on Order Retail445",
  expression:
    "CASE WHEN ISEMPTY([Measures].[customercountestimate1]) \nTHEN NULL\nELSE\n([Order Date Dimension].[Order Retail445].CurrentMember.NextMember, [Measures].[customercountestimate1])\nEND\n                                ",
  format: "general number",
});

const lastProductUnitPriceOrderCustomPP445PrevYear = getCalc({
  unique_name: "Last Product Unit Price-Order CustomPP445-PrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Last Product Unit Price-Order CustomPP445-PrevYear",
  description: "Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[lastproductunitprice]) THEN \nNULL\nELSE (ParallelPeriod([Order Date Dimension].[Order CustomPP445].[Order customyear], 1, [Order Date Dimension].[Order CustomPP445].CurrentMember), [Measures].[lastproductunitprice]) END",
  format: "$#,##0.00",
});

const salesAmountOrderRetail44530PrdMvAvgPrevYearGrowthPct = getCalc({
  unique_name: "Sales Amount-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
  description: "Sales 30 Period Moving Avg  vs Prev Year as Percentage",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Sales Amount-Order Retail445-30PrdMvAvgPrevYear]) OR ISEMPTY([Measures].[Sales Amount-Order Retail445-30PrdMvAvg]) THEN \nNULL \nELSE \n([Measures].[Sales Amount-Order Retail445-30PrdMvAvg] - [Measures].[Sales Amount-Order Retail445-30PrdMvAvgPrevYear])  / [Measures].[Sales Amount-Order Retail445-30PrdMvAvgPrevYear]\nEND",
  format: "percent",
});

const soldProductNDCOrderRetail445Prev = getCalc({
  unique_name: "SoldProductNDC-Order Retail445-Prev",
  object_type: SMLObjectType.MetricCalc,
  label: "SoldProductNDC-Order Retail445-Prev ",
  description: "Order Reporting Hierarchy Previous Period Sales",
  expression:
    "CASE WHEN ISEMPTY([Measures].[soldproductNDC1]) \nTHEN NULL\nELSE\n([Order Date Dimension].[Order Retail445].CurrentMember.PrevMember, [Measures].[soldproductNDC1])\nEND\n                                ",
  format: "general number",
});

const soldProductNDCOrderRetail445YTDPrevYear = getCalc({
  unique_name: "SoldProductNDC-Order Retail445-YTDPrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "SoldProductNDC-Order Retail445-YTDPrevYear",
  description: "Previous Year's Year-to-date Sum of Sales ",
  expression:
    "Sum(\nPeriodsToDate([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember)), \n[Measures].[soldproductNDC1])\n                                ",
  format: "general number",
});

const averageEstCustomerCountPerOrder = getCalc({
  unique_name: "Average Est Customer Count per Order",
  object_type: SMLObjectType.MetricCalc,
  label: "Average Est Customer Count per Order",
  expression: "([Measures].[customercountestimate1] / [Measures].[orderquantity1])",
});

const averageSalesAmountSDCountPerOrder = getCalc({
  unique_name: "Average Sales Amount SD Count per Order",
  object_type: SMLObjectType.MetricCalc,
  label: "Average Sales Amount SD Count per Order",
  expression: "([Measures].[salesamountsstdev1] / [Measures].[orderquantity1])",
});

const averageSalesPerOrder = getCalc({
  unique_name: "Average Sales per Order",
  object_type: SMLObjectType.MetricCalc,
  label: "Average Sales per Order",
  expression: "([Measures].[salesamount1] / [Measures].[orderquantity1])",
});

const averageSoldProductPerOrder = getCalc({
  unique_name: "Average Sold Product per Order",
  object_type: SMLObjectType.MetricCalc,
  label: "Average Sold Product per Order",
  expression: "([Measures].[soldproductNDC1] / [Measures].[orderquantity1])",
});

const customerCountOrderCustomPP445PrevYearGrowthPct = getCalc({
  unique_name: "Customer Count-Order CustomPP445-PrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Customer Count-Order CustomPP445-PrevYearGrowthPct",
  description: "Percent growth over Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Customer Count-Order CustomPP445-PrevYear]) THEN NULL \nELSE [Measures].[Customer Count-Order CustomPP445-PrevYearGrowth] / [Measures].[Customer Count-Order CustomPP445-PrevYear] \nEND",
  format: "percent",
});

const customerCountOrderRetail44530PrdMvAvgPrevYear = getCalc({
  unique_name: "Customer Count-Order Retail445-30PrdMvAvgPrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Customer Count-Order Retail445-30PrdMvAvgPrevYear",
  description: "Prev Year's 30 Period Moving  Average of Sales. Use on the [Order Retail445] Dimension",
  expression:
    "Avg(ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember).Lag(29): \nParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[customercount1]\n)",
  format: "general number",
});

const customerCountOrderRetail44530PrdMvStdev = getCalc({
  unique_name: "Customer Count-Order Retail445-30PrdMvStdev",
  object_type: SMLObjectType.MetricCalc,
  label: "Customer Count-Order Retail445-30PrdMvStdev",
  description: "30 Period Standard Deviation Use at Day Level of [Order Retail445]",
  expression:
    "Stdev([Order Date Dimension].[Order Retail445].CurrentMember.Lag(29):[Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[customercount1])",
  format: "general number",
});

const customerCountOrderRetail445Next = getCalc({
  unique_name: "Customer Count-Order Retail445-Next",
  object_type: SMLObjectType.MetricCalc,
  label: "Customer Count-Order Retail445-Next",
  description: "Next Period's  Sales Amount on Order Retail445",
  expression:
    "CASE WHEN ISEMPTY([Measures].[customercount1]) \nTHEN NULL\nELSE\n([Order Date Dimension].[Order Retail445].CurrentMember.NextMember, [Measures].[customercount1])\nEND\n                                ",
  format: "general number",
});

const customerCountOrderRetail445Prev = getCalc({
  unique_name: "Customer Count-Order Retail445-Prev",
  object_type: SMLObjectType.MetricCalc,
  label: "Customer Count-Order Retail445-Prev ",
  description: "Order Reporting Hierarchy Previous Period Sales",
  expression:
    "CASE WHEN ISEMPTY([Measures].[customercount1]) \nTHEN NULL\nELSE\n([Order Date Dimension].[Order Retail445].CurrentMember.PrevMember, [Measures].[customercount1])\nEND\n                                ",
  format: "general number",
});

const estimatedCustomerCountOrderCustomPP445PrevYear = getCalc({
  unique_name: "Estimated Customer Count-Order CustomPP445-PrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Estimated Customer Count-Order CustomPP445-PrevYear",
  description: "Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[customercountestimate1]) THEN \nNULL\nELSE (ParallelPeriod([Order Date Dimension].[Order CustomPP445].[Order customyear], 1, [Order Date Dimension].[Order CustomPP445].CurrentMember), [Measures].[customercountestimate1]) END",
});

const estimatedCustomerCountOrderRetail44530PrdMvAvg = getCalc({
  unique_name: "Estimated Customer Count-Order Retail445-30PrdMvAvg",
  object_type: SMLObjectType.MetricCalc,
  label: "Estimated Customer Count-Order Retail445-30PrdMvAvg",
  description: "30 Period Moving Average of Sales Amount.  Meant to execute at Day Level  of ",
  expression:
    "Avg([Order Date Dimension].[Order Retail445].CurrentMember.Lag(29):[Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[customercountestimate1])",
  format: "general number",
});

const estimatedCustomerCountOrderRetail44530PrdMvLowerBand = getCalc({
  unique_name: "Estimated Customer Count-Order Retail445-30PrdMvLowerBand",
  object_type: SMLObjectType.MetricCalc,
  label: "Estimated Customer Count-Order Retail445-30PrdMvLowerBand",
  description: "Sales 30 Day Moving Average - 1 Stdev, use on [Order Retail445]",
  expression:
    "[Measures].[Estimated Customer Count-Order Retail445-30PrdMvAvg] - [Measures].[Estimated Customer Count-Order Retail445-30PrdMvStdev]",
  format: "general number",
});

const estimatedCustomerCountOrderRetail445Prev = getCalc({
  unique_name: "Estimated Customer Count-Order Retail445-Prev",
  object_type: SMLObjectType.MetricCalc,
  label: "Estimated Customer Count-Order Retail445-Prev ",
  description: "Order Reporting Hierarchy Previous Period Sales",
  expression:
    "CASE WHEN ISEMPTY([Measures].[customercountestimate1]) \nTHEN NULL\nELSE\n([Order Date Dimension].[Order Retail445].CurrentMember.PrevMember, [Measures].[customercountestimate1])\nEND\n                                ",
  format: "general number",
});

const estimatedCustomerCountOrderRetail445PrevPeriodGrowthPct = getCalc({
  unique_name: "Estimated Customer Count-Order Retail445-PrevPeriodGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Estimated Customer Count-Order Retail445-PrevPeriodGrowthPct",
  description: "Order Retail445 Previous Period Growth Percent",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Estimated Customer Count-Order Retail445-Prev]) THEN NULL\nELSE\n(([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[customercountestimate1]) - [Measures].[Estimated Customer Count-Order Retail445-Prev]) / [Measures].[Estimated Customer Count-Order Retail445-Prev]\nEND",
  format: "percent",
});

const estimatedCustomerCountOrderRetail445PrevYearGrowthPct = getCalc({
  unique_name: "Estimated Customer Count-Order Retail445-PrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Estimated Customer Count-Order Retail445-PrevYearGrowthPct",
  description: "Order Retail445 Sales Amount Year-over-year growth as percent",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Estimated Customer Count-Order Retail445-PrevYear]) THEN NULL \nELSE [Measures].[Estimated Customer Count-Order Retail445-PrevYearGrowth] / [Measures].[Estimated Customer Count-Order Retail445-PrevYear] \nEND",
  format: "percent",
});

const estimatedCustomerCountOrderRetail445YTD = getCalc({
  unique_name: "Estimated Customer Count-Order Retail445-YTD",
  object_type: SMLObjectType.MetricCalc,
  label: "Estimated Customer Count-Order Retail445-YTD",
  description: "Sales Amount Year-to-date Order Retail445",
  expression:
    "CASE WHEN ISEMPTY([Measures].[customercountestimate1]) THEN NULL \nELSE \nAvg(PeriodsToDate([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[customercountestimate1]) \nEND ",
  format: "general number",
});

const lastProductUnitPriceOrderCustomPP445PrevYearGrowthPct = getCalc({
  unique_name: "Last Product Unit Price-Order CustomPP445-PrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Last Product Unit Price-Order CustomPP445-PrevYearGrowthPct",
  description: "Percent growth over Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Last Product Unit Price-Order CustomPP445-PrevYear]) THEN NULL \nELSE [Measures].[Last Product Unit Price-Order CustomPP445-PrevYearGrowth] / [Measures].[Last Product Unit Price-Order CustomPP445-PrevYear] \nEND",
  format: "percent",
});

const lastProductUnitPriceOrderRetail44530PrdMvAvgPrevYear = getCalc({
  unique_name: "Last Product Unit Price-Order Retail445-30PrdMvAvgPrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Last Product Unit Price-Order Retail445-30PrdMvAvgPrevYear",
  description: "Prev Year's 30 Period Moving  Average of Sales. Use on the [Order Retail445] Dimension",
  expression:
    "Avg(ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember).Lag(29): \nParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[lastproductunitprice]\n)",
  format: "$#,##0.00",
});

const lastProductUnitPriceOrderRetail44530PrdMvStdev = getCalc({
  unique_name: "Last Product Unit Price-Order Retail445-30PrdMvStdev",
  object_type: SMLObjectType.MetricCalc,
  label: "Last Product Unit Price-Order Retail445-30PrdMvStdev",
  description: "30 Period Standard Deviation Use at Day Level of [Order Retail445]",
  expression:
    "Stdev([Order Date Dimension].[Order Retail445].CurrentMember.Lag(29):[Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[lastproductunitprice])",
  format: "$#,##0.00",
});

const lastProductUnitPriceOrderRetail445Next = getCalc({
  unique_name: "Last Product Unit Price-Order Retail445-Next",
  object_type: SMLObjectType.MetricCalc,
  label: "Last Product Unit Price-Order Retail445-Next",
  description: "Next Period's  Sales Amount on Order Retail445",
  expression:
    "CASE WHEN ISEMPTY([Measures].[lastproductunitprice]) \nTHEN NULL\nELSE\n([Order Date Dimension].[Order Retail445].CurrentMember.NextMember, [Measures].[lastproductunitprice])\nEND\n                                ",
  format: "$#,##0.00",
});

const lastProductUnitPriceOrderRetail445PrevYear = getCalc({
  unique_name: "Last Product Unit Price-Order Retail445-PrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Last Product Unit Price-Order Retail445-PrevYear",
  description: "Order Sales Amount Prev Year (Retail445)",
  expression:
    "CASE WHEN ISEMPTY([Measures].[lastproductunitprice]) THEN \nNULL \nELSE (ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[lastproductunitprice]) END",
  format: "$#,##0.00",
});

const maxTaxAmountOrderRetail44530PrdMvStdev = getCalc({
  unique_name: "Max Tax Amount-Order Retail445-30PrdMvStdev",
  object_type: SMLObjectType.MetricCalc,
  label: "Max Tax Amount-Order Retail445-30PrdMvStdev",
  description: "30 Period Standard Deviation Use at Day Level of [Order Retail445]",
  expression:
    "Stdev([Order Date Dimension].[Order Retail445].CurrentMember.Lag(29):[Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[maxtaxamount1])",
  format: "$#,##0.00",
});

const salesAmountSStdevOrderCustomPP445PrevYear = getCalc({
  unique_name: "Sales Amount SStdev-Order CustomPP445-PrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount SStdev-Order CustomPP445-PrevYear",
  description: "Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[salesamountsstdev1]) THEN \nNULL\nELSE (ParallelPeriod([Order Date Dimension].[Order CustomPP445].[Order customyear], 1, [Order Date Dimension].[Order CustomPP445].CurrentMember), [Measures].[salesamountsstdev1]) END",
  format: "$#,##0.00",
});

const salesAmountSStdevOrderCustomPP445PrevYearGrowthPct = getCalc({
  unique_name: "Sales Amount SStdev-Order CustomPP445-PrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount SStdev-Order CustomPP445-PrevYearGrowthPct",
  description: "Percent growth over Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Sales Amount SStdev-Order CustomPP445-PrevYear]) THEN NULL \nELSE [Measures].[Sales Amount SStdev-Order CustomPP445-PrevYearGrowth] / [Measures].[Sales Amount SStdev-Order CustomPP445-PrevYear] \nEND",
  format: "percent",
});

const salesAmountSStdevOrderRetail44530PrdMvStdev = getCalc({
  unique_name: "Sales Amount SStdev-Order Retail445-30PrdMvStdev",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount SStdev-Order Retail445-30PrdMvStdev",
  description: "30 Period Standard Deviation Use at Day Level of [Order Retail445]",
  expression:
    "Stdev([Order Date Dimension].[Order Retail445].CurrentMember.Lag(29):[Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[salesamountsstdev1])",
  format: "$#,##0.00",
});

const soldProductNDCOrderCustomPP445PrevYear = getCalc({
  unique_name: "SoldProductNDC-Order CustomPP445-PrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "SoldProductNDC-Order CustomPP445-PrevYear",
  description: "Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[soldproductNDC1]) THEN \nNULL\nELSE (ParallelPeriod([Order Date Dimension].[Order CustomPP445].[Order customyear], 1, [Order Date Dimension].[Order CustomPP445].CurrentMember), [Measures].[soldproductNDC1]) END",
  format: "general number",
});

const soldProductNDCOrderRetail44530PrdMvAvgPrevYear = getCalc({
  unique_name: "SoldProductNDC-Order Retail445-30PrdMvAvgPrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "SoldProductNDC-Order Retail445-30PrdMvAvgPrevYear",
  description: "Prev Year's 30 Period Moving  Average of Sales. Use on the [Order Retail445] Dimension",
  expression:
    "Avg(ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember).Lag(29): \nParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[soldproductNDC1]\n)",
  format: "general number",
});

const soldProductNDCOrderRetail44530PrdMvStdev = getCalc({
  unique_name: "SoldProductNDC-Order Retail445-30PrdMvStdev",
  object_type: SMLObjectType.MetricCalc,
  label: "SoldProductNDC-Order Retail445-30PrdMvStdev",
  description: "30 Period Standard Deviation Use at Day Level of [Order Retail445]",
  expression:
    "Stdev([Order Date Dimension].[Order Retail445].CurrentMember.Lag(29):[Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[soldproductNDC1])",
  format: "general number",
});

const soldProductNDCOrderRetail445Next = getCalc({
  unique_name: "SoldProductNDC-Order Retail445-Next",
  object_type: SMLObjectType.MetricCalc,
  label: "SoldProductNDC-Order Retail445-Next",
  description: "Next Period's  Sales Amount on Order Retail445",
  expression:
    "CASE WHEN ISEMPTY([Measures].[soldproductNDC1]) \nTHEN NULL\nELSE\n([Order Date Dimension].[Order Retail445].CurrentMember.NextMember, [Measures].[soldproductNDC1])\nEND\n                                ",
  format: "general number",
});

const averageCustomerCountPerOrder = getCalc({
  unique_name: "Average Customer Count per Order",
  object_type: SMLObjectType.MetricCalc,
  label: "Average Customer Count per Order",
  expression: "([Measures].[customercount1] / [Measures].[orderquantity1])",
});

const averageMaxTaxCountPerOrder = getCalc({
  unique_name: "Average Customer Count per Order",
  object_type: SMLObjectType.MetricCalc,
  label: "Average Customer Count per Order",
  expression: "([Measures].[customercount1] / [Measures].[orderquantity1])",
});

const customerCountOrderRetail44530PrdMvAvg = getCalc({
  unique_name: "Customer Count-Order Retail445-30PrdMvAvg",
  object_type: SMLObjectType.MetricCalc,
  label: "Customer Count-Order Retail445-30PrdMvAvg",
  description: "30 Period Moving Average of Sales Amount.  Meant to execute at Day Level  of ",
  expression:
    "Avg([Order Date Dimension].[Order Retail445].CurrentMember.Lag(29):[Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[customercount1])",
  format: "general number",
});

const customerCountOrderRetail44530PrdMvLowerBand = getCalc({
  unique_name: "Customer Count-Order Retail445-30PrdMvLowerBand",
  object_type: SMLObjectType.MetricCalc,
  label: "Customer Count-Order Retail445-30PrdMvLowerBand",
  description: "Sales 30 Day Moving Average - 1 Stdev, use on [Order Retail445]",
  expression:
    "[Measures].[Customer Count-Order Retail445-30PrdMvAvg] - [Measures].[Customer Count-Order Retail445-30PrdMvStdev]",
  format: "general number",
});

const customerCountOrderRetail445PrevPeriodGrowthPct = getCalc({
  unique_name: "Customer Count-Order Retail445-PrevPeriodGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Customer Count-Order Retail445-PrevPeriodGrowthPct",
  description: "Order Retail445 Previous Period Growth Percent",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Customer Count-Order Retail445-Prev]) THEN NULL\nELSE\n(([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[customercount1]) - [Measures].[Customer Count-Order Retail445-Prev]) / [Measures].[Customer Count-Order Retail445-Prev]\nEND",
  format: "percent",
});

const customerCountOrderRetail445PrevYearGrowthPct = getCalc({
  unique_name: "Customer Count-Order Retail445-PrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Customer Count-Order Retail445-PrevYearGrowthPct",
  description: "Order Retail445 Sales Amount Year-over-year growth as percent",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Customer Count-Order Retail445-PrevYear]) THEN NULL \nELSE [Measures].[Customer Count-Order Retail445-PrevYearGrowth] / [Measures].[Customer Count-Order Retail445-PrevYear] \nEND",
  format: "percent",
});

const estimatedCustomerCountOrderCustomPP445PrevYearGrowth = getCalc({
  unique_name: "Estimated Customer Count-Order CustomPP445-PrevYearGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "Estimated Customer Count-Order CustomPP445-PrevYearGrowth",
  description: "Growth over Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Estimated Customer Count-Order CustomPP445-PrevYear]) or ISEMPTY(([Order Date Dimension].[Order CustomPP445].CurrentMember, [Measures].[customercountestimate1])) THEN\nNULL \nELSE \n([Order Date Dimension].[Order CustomPP445].CurrentMember, [Measures].[customercountestimate1]) - [Measures].[Estimated Customer Count-Order CustomPP445-PrevYear]\nEND",
  format: "general number",
});

const estimatedCustomerCountOrderRetail44530PrdMvAvgPrevYearGrowthPct = getCalc({
  unique_name: "Estimated Customer Count-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Estimated Customer Count-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
  description: "Sales 30 Period Moving Avg  vs Prev Year as Percentage",
  expression:
    "([Measures].[Estimated Customer Count-Order Retail445-30PrdMvAvg] - [Measures].[Estimated Customer Count-Order Retail445-30PrdMvAvgPrevYear])  / [Measures].[Estimated Customer Count-Order Retail445-30PrdMvAvgPrevYear]",
  format: "percent",
});

const estimatedCustomerCountOrderRetail44530PrdMvUpperBand = getCalc({
  unique_name: "Estimated Customer Count-Order Retail445-30PrdMvUpperBand",
  object_type: SMLObjectType.MetricCalc,
  label: "Estimated Customer Count-Order Retail445-30PrdMvUpperBand",
  description: "Sales 30 Day Moving Average + 1 Standard Deviation use on [Order Retail445]",
  expression:
    "[Measures].[Estimated Customer Count-Order Retail445-30PrdMvAvg] + [Measures].[Estimated Customer Count-Order Retail445-30PrdMvStdev]",
  format: "general number",
});

const estimatedCustomerCountOrderRetail445PrevPeriodGrowth = getCalc({
  unique_name: "Estimated Customer Count-Order Retail445-PrevPeriodGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "Estimated Customer Count-Order Retail445-PrevPeriodGrowth",
  description: "Order Retail 445 Growth since previous period.",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Estimated Customer Count-Order Retail445-Prev]) OR ISEMPTY([Measures].[customercountestimate1])\nTHEN NULL \nELSE \n([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[customercountestimate1]) - [Measures].[Estimated Customer Count-Order Retail445-Prev]\nEND",
  format: "general number",
});

const estimatedCustomerCountOrderRetail445PrevYear = getCalc({
  unique_name: "Estimated Customer Count-Order Retail445-PrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Estimated Customer Count-Order Retail445-PrevYear",
  description: "Order Sales Amount Prev Year (Retail445)",
  expression:
    "CASE WHEN ISEMPTY([Measures].[customercountestimate1]) THEN \nNULL \nELSE (ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[customercountestimate1]) END",
  format: "general number",
});

const lastProductUnitPriceOrderRetail44530PrdMvAvg = getCalc({
  unique_name: "Last Product Unit Price-Order Retail445-30PrdMvAvg",
  object_type: SMLObjectType.MetricCalc,
  label: "Last Product Unit Price-Order Retail445-30PrdMvAvg",
  description: "30 Period Moving Average of Sales Amount.  Meant to execute at Day Level  of ",
  expression:
    "Avg([Order Date Dimension].[Order Retail445].CurrentMember.Lag(29):[Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[lastproductunitprice])",
  format: "$#,##0.00",
});

const lastProductUnitPriceOrderRetail44530PrdMvLowerBand = getCalc({
  unique_name: "Last Product Unit Price-Order Retail445-30PrdMvLowerBand",
  object_type: SMLObjectType.MetricCalc,
  label: "Last Product Unit Price-Order Retail445-30PrdMvLowerBand",
  description: "Sales 30 Day Moving Average - 1 Stdev, use on [Order Retail445]",
  expression:
    "[Measures].[Last Product Unit Price-Order Retail445-30PrdMvAvg] - [Measures].[Last Product Unit Price-Order Retail445-30PrdMvStdev]",
  format: "$#,##0.00",
});

const lastProductUnitPriceOrderRetail445Prev = getCalc({
  unique_name: "Last Product Unit Price-Order Retail445-Prev",
  object_type: SMLObjectType.MetricCalc,
  label: "Last Product Unit Price-Order Retail445-Prev ",
  description: "Order Reporting Hierarchy Previous Period Sales",
  expression:
    "CASE WHEN ISEMPTY([Measures].[lastproductunitprice]) \nTHEN NULL\nELSE\n([Order Date Dimension].[Order Retail445].CurrentMember.PrevMember, [Measures].[lastproductunitprice])\nEND\n                                ",
  format: "$#,##0.00",
});

const lastProductUnitPriceOrderRetail445PrevPeriodGrowthPct = getCalc({
  unique_name: "Last Product Unit Price-Order Retail445-PrevPeriodGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Last Product Unit Price-Order Retail445-PrevPeriodGrowthPct",
  description: "Order Retail445 Previous Period Growth Percent",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Last Product Unit Price-Order Retail445-Prev]) THEN NULL\nELSE\n(([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[lastproductunitprice]) - [Measures].[Last Product Unit Price-Order Retail445-Prev]) / [Measures].[Last Product Unit Price-Order Retail445-Prev]\nEND",
  format: "percent",
});

const lastProductUnitPriceOrderRetail445PrevYearGrowthPct = getCalc({
  unique_name: "Last Product Unit Price-Order Retail445-PrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Last Product Unit Price-Order Retail445-PrevYearGrowthPct",
  description: "Order Retail445 Sales Amount Year-over-year growth as percent",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Last Product Unit Price-Order Retail445-PrevYear]) THEN NULL \nELSE [Measures].[Last Product Unit Price-Order Retail445-PrevYearGrowth] / [Measures].[Last Product Unit Price-Order Retail445-PrevYear] \nEND",
  format: "percent",
});

const lastProductUnitPriceOrderRetail445YTD = getCalc({
  unique_name: "Last Product Unit Price-Order Retail445-YTD",
  object_type: SMLObjectType.MetricCalc,
  label: "Last Product Unit Price-Order Retail445-YTD",
  description: "Sales Amount Year-to-date Order Retail445",
  expression:
    "CASE WHEN ISEMPTY([Measures].[lastproductunitprice]) THEN NULL \nELSE \nAvg(PeriodsToDate([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[lastproductunitprice]) \nEND ",
  format: "$#,##0.00",
});

const lastProductUnitPriceOrderRetail445YTDPrevYear = getCalc({
  unique_name: "Last Product Unit Price-Order Retail445-YTDPrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Last Product Unit Price-Order Retail445-YTDPrevYear",
  description: "Previous Year's Year-to-date Avg Last product price ",
  expression:
    "Avg(\nPeriodsToDate([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember)), \n[Measures].[lastproductunitprice])\n                                ",
  format: "$#,##0.00",
});

const maxTaxAmountOrderCustomPP445PrevYear = getCalc({
  unique_name: "Max Tax Amount-Order CustomPP445-PrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Max Tax Amount-Order CustomPP445-PrevYear",
  description: "Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[maxtaxamount1]) THEN \nNULL\nELSE (ParallelPeriod([Order Date Dimension].[Order CustomPP445].[Order customyear], 1, [Order Date Dimension].[Order CustomPP445].CurrentMember), [Measures].[maxtaxamount1]) END",
  format: "$#,##0.00",
});

const maxTaxAmountOrderCustomPP445PrevYearGrowthPct = getCalc({
  unique_name: "Max Tax Amount-Order CustomPP445-PrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Max Tax Amount-Order CustomPP445-PrevYearGrowthPct",
  description: "Percent growth over Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Max Tax Amount-Order CustomPP445-PrevYear]) THEN NULL \nELSE [Measures].[Max Tax Amount-Order CustomPP445-PrevYearGrowth] / [Measures].[Max Tax Amount-Order CustomPP445-PrevYear] \nEND",
  format: "percent",
});

const maxTaxAmountOrderRetail44530PrdMvAvg = getCalc({
  unique_name: "Max Tax Amount-Order Retail445-30PrdMvAvg",
  object_type: SMLObjectType.MetricCalc,
  label: "Max Tax Amount-Order Retail445-30PrdMvAvg",
  description: "30 Period Moving Average of Sales Amount.  Meant to execute at Day Level  of ",
  expression:
    "Avg([Order Date Dimension].[Order Retail445].CurrentMember.Lag(29):[Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[maxtaxamount1])",
  format: "$#,##0.00",
});

const maxTaxAmountOrderRetail44530PrdMvAvgPrevYear = getCalc({
  unique_name: "Max Tax Amount-Order Retail445-30PrdMvAvgPrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Max Tax Amount-Order Retail445-30PrdMvAvgPrevYear",
  description: "Prev Year's 30 Period Moving  Average of Sales. Use on the [Order Retail445] Dimension",
  expression:
    "Avg(ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember).Lag(29): \nParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[maxtaxamount1]\n)",
  format: "$#,##0.00",
});

const maxTaxAmountOrderRetail445Next = getCalc({
  unique_name: "Max Tax Amount-Order Retail445-Next",
  object_type: SMLObjectType.MetricCalc,
  label: "Max Tax Amount-Order Retail445-Next",
  description: "Next Period's  Sales Amount on Order Retail445",
  expression:
    "CASE WHEN ISEMPTY([Measures].[maxtaxamount1]) \nTHEN NULL\nELSE\n([Order Date Dimension].[Order Retail445].CurrentMember.NextMember, [Measures].[maxtaxamount1])\nEND\n                                ",
  format: "$#,##0.00",
});

const maxTaxAmountOrderRetail445Prev = getCalc({
  unique_name: "Max Tax Amount-Order Retail445-Prev",
  object_type: SMLObjectType.MetricCalc,
  label: "Max Tax Amount-Order Retail445-Prev ",
  description: "Order Reporting Hierarchy Previous Period Sales",
  expression:
    "CASE WHEN ISEMPTY([Measures].[maxtaxamount1]) \nTHEN NULL\nELSE\n([Order Date Dimension].[Order Retail445].CurrentMember.PrevMember, [Measures].[maxtaxamount1])\nEND\n                                ",
  format: "$#,##0.00",
});

const maxTaxAmountOrderRetail445PrevPeriodGrowthPct = getCalc({
  unique_name: "Max Tax Amount-Order Retail445-PrevPeriodGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Max Tax Amount-Order Retail445-PrevPeriodGrowthPct",
  description: "Order Retail445 Previous Period Growth Percent",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Max Tax Amount-Order Retail445-Prev]) THEN NULL\nELSE\n(([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[maxtaxamount1]) - [Measures].[Max Tax Amount-Order Retail445-Prev]) / [Measures].[Max Tax Amount-Order Retail445-Prev]\nEND",
  format: "percent",
});

const salesAmountSStdevOrderRetail44530PrdMvAvgPrevYear = getCalc({
  unique_name: "Sales Amount SStdev-Order Retail445-30PrdMvAvgPrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount SStdev-Order Retail445-30PrdMvAvgPrevYear",
  description: "Prev Year's 30 Period Moving  Average of Sales. Use on the [Order Retail445] Dimension",
  expression:
    "Avg(ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember).Lag(29): \nParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[salesamountsstdev1]\n)",
  format: "$#,##0.00",
});

const salesAmountSStdevOrderRetail445Next = getCalc({
  unique_name: "Sales Amount SStdev-Order Retail445-Next",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount SStdev-Order Retail445-Next",
  description: "Next Period's  Sales Amount on Order Retail445",
  expression:
    "CASE WHEN ISEMPTY([Measures].[salesamountsstdev1]) \nTHEN NULL\nELSE\n([Order Date Dimension].[Order Retail445].CurrentMember.NextMember, [Measures].[salesamountsstdev1])\nEND\n                                ",
  format: "$#,##0.00",
});

const salesAmountSStdevOrderRetail445PrevPeriodGrowthPct = getCalc({
  unique_name: "Sales Amount SStdev-Order Retail445-PrevPeriodGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount SStdev-Order Retail445-PrevPeriodGrowthPct",
  description: "Order Retail445 Previous Period Growth Percent",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Sales Amount SStdev-Order Retail445-Prev]) THEN NULL\nELSE\n(([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[salesamountsstdev1]) - [Measures].[Sales Amount SStdev-Order Retail445-Prev]) / [Measures].[Sales Amount SStdev-Order Retail445-Prev]\nEND",
  format: "percent",
});

const salesAmountSStdevOrderRetail445PrevYear = getCalc({
  unique_name: "Sales Amount SStdev-Order Retail445-PrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount SStdev-Order Retail445-PrevYear",
  description: "Order Sales Amount Prev Year (Retail445)",
  expression:
    "CASE WHEN ISEMPTY([Measures].[salesamountsstdev1]) THEN \nNULL \nELSE (ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[salesamountsstdev1]) END",
  format: "$#,##0.00",
});

const salesAmountSStdevOrderRetail445PrevYearGrowthPct = getCalc({
  unique_name: "Sales Amount SStdev-Order Retail445-PrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount SStdev-Order Retail445-PrevYearGrowthPct",
  description: "Order Retail445 Sales Amount Year-over-year growth as percent",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Sales Amount SStdev-Order Retail445-PrevYear]) THEN NULL \nELSE [Measures].[Sales Amount SStdev-Order Retail445-PrevYearGrowth] / [Measures].[Sales Amount SStdev-Order Retail445-PrevYear] \nEND",
  format: "percent",
});

const salesAmountSStdevOrderRetail445YTD = getCalc({
  unique_name: "Sales Amount SStdev-Order Retail445-YTD",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount SStdev-Order Retail445-YTD",
  description: "Sales Amount Year-to-date Order Retail445",
  expression:
    "CASE WHEN ISEMPTY([Measures].[salesamountsstdev1]) THEN NULL \nELSE \nAvg(PeriodsToDate([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[salesamountsstdev1]) \nEND ",
  format: "$#,##0.00",
});

const salesAmountOrderCustomPP445PrevYearGrowthPct = getCalc({
  unique_name: "Sales Amount-Order CustomPP445-PrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount-Order CustomPP445-PrevYearGrowthPct",
  description: "Percent growth over Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Sales Amount-Order CustomPP445-PrevYear]) THEN NULL \nELSE [Measures].[Sales Amount-Order CustomPP445-PrevYearGrowth] / [Measures].[Sales Amount-Order CustomPP445-PrevYear] \nEND",
  format: "percent",
});

const salesAmountOrderRetail44530PrdMvStdev = getCalc({
  unique_name: "Sales Amount-Order Retail445-30PrdMvStdev",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount-Order Retail445-30PrdMvStdev",
  description: "30 Period Standard Deviation Use at Day Level of [Order Retail445]",
  expression:
    "Stdev([Order Date Dimension].[Order Retail445].CurrentMember.Lag(29):[Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[salesamount1])",
  format: "$#,##0.00",
});

const soldProductNDCOrderCustomPP445PrevYearGrowthPct = getCalc({
  unique_name: "SoldProductNDC-Order CustomPP445-PrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "SoldProductNDC-Order CustomPP445-PrevYearGrowthPct",
  description: "Percent growth over Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[SoldProductNDC-Order CustomPP445-PrevYear]) THEN NULL \nELSE [Measures].[SoldProductNDC-Order CustomPP445-PrevYearGrowth] / [Measures].[SoldProductNDC-Order CustomPP445-PrevYear] \nEND",
  format: "percent",
});

const soldProductNDCOrderRetail44530PrdMvAvg = getCalc({
  unique_name: "SoldProductNDC-Order Retail445-30PrdMvAvg",
  object_type: SMLObjectType.MetricCalc,
  label: "SoldProductNDC-Order Retail445-30PrdMvAvg",
  description: "30 Period Moving Average of Sales Amount.  Meant to execute at Day Level  of ",
  expression:
    "Avg([Order Date Dimension].[Order Retail445].CurrentMember.Lag(29):[Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[soldproductNDC1])",
  format: "general number",
});

const soldProductNDCOrderRetail445YTD = getCalc({
  unique_name: "SoldProductNDC-Order Retail445-YTD",
  object_type: SMLObjectType.MetricCalc,
  label: "SoldProductNDC-Order Retail445-YTD",
  description: "Sales Amount Year-to-date Order Retail445",
  expression:
    "CASE WHEN ISEMPTY([Measures].[soldproductNDC1]) THEN NULL \nELSE \nSum(PeriodsToDate([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[soldproductNDC1]) \nEND ",
  format: "general number",
});

const customerCountOrderCustomPP445PrevYear = getCalc({
  unique_name: "Customer Count-Order CustomPP445-PrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Customer Count-Order CustomPP445-PrevYear",
  description: "Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[customercount1]) THEN \nNULL\nELSE (ParallelPeriod([Order Date Dimension].[Order CustomPP445].[Order customyear], 1, [Order Date Dimension].[Order CustomPP445].CurrentMember), [Measures].[customercount1]) END",
});

const customerCountOrderCustomPP445PrevYearGrowth = getCalc({
  unique_name: "Customer Count-Order CustomPP445-PrevYearGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "Customer Count-Order CustomPP445-PrevYearGrowth",
  description: "Growth over Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Customer Count-Order CustomPP445-PrevYear]) or ISEMPTY(([Order Date Dimension].[Order CustomPP445].CurrentMember, [Measures].[customercount1])) THEN\nNULL \nELSE \n([Order Date Dimension].[Order CustomPP445].CurrentMember, [Measures].[customercount1]) - [Measures].[Customer Count-Order CustomPP445-PrevYear]\nEND",
  format: "general number",
});

const customerCountOrderRetail44530PrdMvAvgPrevYearGrowthPct = getCalc({
  unique_name: "Customer Count-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Customer Count-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
  description: "Sales 30 Period Moving Avg  vs Prev Year as Percentage",
  expression:
    "([Measures].[Customer Count-Order Retail445-30PrdMvAvg] - [Measures].[Customer Count-Order Retail445-30PrdMvAvgPrevYear])  / [Measures].[Customer Count-Order Retail445-30PrdMvAvgPrevYear]\n                                ",
  format: "percent",
});

const customerCountOrderRetail44530PrdMvUpperBand = getCalc({
  unique_name: "Customer Count-Order Retail445-30PrdMvUpperBand",
  object_type: SMLObjectType.MetricCalc,
  label: "Customer Count-Order Retail445-30PrdMvUpperBand",
  description: "Sales 30 Day Moving Average + 1 Standard Deviation use on [Order Retail445]",
  expression:
    "[Measures].[Customer Count-Order Retail445-30PrdMvAvg] + [Measures].[Customer Count-Order Retail445-30PrdMvStdev]",
  format: "general number",
});

const customerCountOrderRetail445PrevPeriodGrowth = getCalc({
  unique_name: "Customer Count-Order Retail445-PrevPeriodGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "Customer Count-Order Retail445-PrevPeriodGrowth",
  description: "Order Retail 445 Growth since previous period.",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Customer Count-Order Retail445-Prev]) OR ISEMPTY([Measures].[customercount1])\nTHEN NULL \nELSE \n([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[customercount1]) - [Measures].[Customer Count-Order Retail445-Prev]\nEND",
  format: "general number",
});

const customerCountOrderRetail445PrevYear = getCalc({
  unique_name: "Customer Count-Order Retail445-PrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Customer Count-Order Retail445-PrevYear",
  description: "Order Sales Amount Prev Year (Retail445)",
  expression:
    "CASE WHEN ISEMPTY([Measures].[customercount1]) THEN \nNULL \nELSE (ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[customercount1]) END",
  format: "general number",
});

const customerCountOrderRetail445YTD = getCalc({
  unique_name: "Customer Count-Order Retail445-YTD",
  object_type: SMLObjectType.MetricCalc,
  label: "Customer Count-Order Retail445-YTD",
  description: "Sales Amount Year-to-date Order Retail445",
  expression:
    "CASE WHEN ISEMPTY([Measures].[customercount1]) THEN NULL \nELSE \nAvg(PeriodsToDate([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[customercount1]) \nEND ",
  format: "general number",
});

const estimatedCustomerCountOrderRetail445PrevYearGrowth = getCalc({
  unique_name: "Estimated Customer Count-Order Retail445-PrevYearGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "Estimated Customer Count-Order Retail445-PrevYearGrowth",
  description: "Parallel Period Sales Growth  Since the Previous Year",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Estimated Customer Count-Order Retail445-PrevYear]) or ISEMPTY(([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[customercountestimate1])) THEN\nNULL \nELSE \n([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[customercountestimate1]) - [Measures].[Estimated Customer Count-Order Retail445-PrevYear]\nEND\n                                ",
  format: "general number",
});

const estimatedCustomerCountOrderRetail445YTDPrevYear = getCalc({
  unique_name: "Estimated Customer Count-Order Retail445-YTDPrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Estimated Customer Count-Order Retail445-YTDPrevYear",
  description: "Previous Year's Year-to-date Sum of Sales ",
  expression:
    "Avg(\nPeriodsToDate([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember)), \n[Measures].[customercountestimate1])\n                                ",
  format: "general number",
});

const lastProductUnitPriceOrderCustomPP445PrevYearGrowth = getCalc({
  unique_name: "Last Product Unit Price-Order CustomPP445-PrevYearGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "Last Product Unit Price-Order CustomPP445-PrevYearGrowth",
  description: "Growth over Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Last Product Unit Price-Order CustomPP445-PrevYear]) or ISEMPTY(([Order Date Dimension].[Order CustomPP445].CurrentMember, [Measures].[lastproductunitprice])) THEN\nNULL \nELSE \n([Order Date Dimension].[Order CustomPP445].CurrentMember, [Measures].[lastproductunitprice]) - [Measures].[Last Product Unit Price-Order CustomPP445-PrevYear]\nEND",
  format: "$#,##0.00",
});

const lastProductUnitPriceOrderRetail44530PrdMvAvgPrevYearGrowthPct = getCalc({
  unique_name: "Last Product Unit Price-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Last Product Unit Price-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
  description: "Sales 30 Period Moving Avg  vs Prev Year as Percentage",
  expression:
    "([Measures].[Last Product Unit Price-Order Retail445-30PrdMvAvg] - [Measures].[Last Product Unit Price-Order Retail445-30PrdMvAvgPrevYear])  / [Measures].[Last Product Unit Price-Order Retail445-30PrdMvAvgPrevYear]",
  format: "percent",
});

const lastProductUnitPriceOrderRetail44530PrdMvUpperBand = getCalc({
  unique_name: "Last Product Unit Price-Order Retail445-30PrdMvUpperBand",
  object_type: SMLObjectType.MetricCalc,
  label: "Last Product Unit Price-Order Retail445-30PrdMvUpperBand",
  description: "Sales 30 Day Moving Average + 1 Standard Deviation use on [Order Retail445]",
  expression:
    "[Measures].[Last Product Unit Price-Order Retail445-30PrdMvAvg] + [Measures].[Last Product Unit Price-Order Retail445-30PrdMvStdev]",
  format: "$#,##0.00",
});

const lastProductUnitPriceOrderRetail445PrevPeriodGrowth = getCalc({
  unique_name: "Last Product Unit Price-Order Retail445-PrevPeriodGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "Last Product Unit Price-Order Retail445-PrevPeriodGrowth",
  description: "Order Retail 445 Growth since previous period.",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Last Product Unit Price-Order Retail445-Prev]) OR ISEMPTY([Measures].[lastproductunitprice])\nTHEN NULL \nELSE \n([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[lastproductunitprice]) - [Measures].[Last Product Unit Price-Order Retail445-Prev]\nEND",
  format: "$#,##0.00",
});

const maxTaxAmountOrderRetail44530PrdMvAvgPrevYearGrowthPct = getCalc({
  unique_name: "Max Tax Amount-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Max Tax Amount-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
  description: "Sales 30 Period Moving Avg  vs Prev Year as Percentage",
  expression:
    "([Measures].[Max Tax Amount-Order Retail445-30PrdMvAvg] - [Measures].[Max Tax Amount-Order Retail445-30PrdMvAvgPrevYear])  / [Measures].[Max Tax Amount-Order Retail445-30PrdMvAvgPrevYear]",
  format: "percent",
});

const maxTaxAmountOrderRetail44530PrdMvLowerBand = getCalc({
  unique_name: "Max Tax Amount-Order Retail445-30PrdMvLowerBand",
  object_type: SMLObjectType.MetricCalc,
  label: "Max Tax Amount-Order Retail445-30PrdMvLowerBand",
  description: "Sales 30 Day Moving Average - 1 Stdev, use on [Order Retail445]",
  expression:
    "[Measures].[Max Tax Amount-Order Retail445-30PrdMvAvg] - [Measures].[Max Tax Amount-Order Retail445-30PrdMvStdev]",
  format: "$#,##0.00",
});

const maxTaxAmountOrderRetail44530PrdMvUpperBand = getCalc({
  unique_name: "Max Tax Amount-Order Retail445-30PrdMvUpperBand",
  object_type: SMLObjectType.MetricCalc,
  label: "Max Tax Amount-Order Retail445-30PrdMvUpperBand",
  description: "Sales 30 Day Moving Average + 1 Standard Deviation use on [Order Retail445]",
  expression:
    "[Measures].[Max Tax Amount-Order Retail445-30PrdMvAvg] + [Measures].[Max Tax Amount-Order Retail445-30PrdMvStdev]",
  format: "$#,##0.00",
});

const maxTaxAmountOrderRetail445PrevYearGrowthPct = getCalc({
  unique_name: "Max Tax Amount-Order Retail445-PrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Max Tax Amount-Order Retail445-PrevYearGrowthPct",
  description: "Order Retail445 Sales Amount Year-over-year growth as percent",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Max Tax Amount-Order Retail445-PrevYear]) THEN NULL \nELSE [Measures].[Max Tax Amount-Order Retail445-PrevYearGrowth] / [Measures].[Max Tax Amount-Order Retail445-PrevYear] \nEND",
  format: "percent",
});

const maxTaxAmountOrderRetail445YTD = getCalc({
  unique_name: "Max Tax Amount-Order Retail445-YTD",
  object_type: SMLObjectType.MetricCalc,
  label: "Max Tax Amount-Order Retail445-YTD",
  description: "Sales Amount Year-to-date Order Retail445",
  expression:
    "CASE WHEN ISEMPTY([Measures].[maxtaxamount1]) THEN NULL \nELSE \nAggregate(PeriodsToDate([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[maxtaxamount1]) \nEND ",
  format: "$#,##0.00",
});

const salesAmountSStdevOrderCustomPP445PrevYearGrowth = getCalc({
  unique_name: "Sales Amount SStdev-Order CustomPP445-PrevYearGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount SStdev-Order CustomPP445-PrevYearGrowth",
  description: "Growth over Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Sales Amount SStdev-Order CustomPP445-PrevYear]) or ISEMPTY(([Order Date Dimension].[Order CustomPP445].CurrentMember, [Measures].[salesamountsstdev1])) THEN\nNULL \nELSE \n([Order Date Dimension].[Order CustomPP445].CurrentMember, [Measures].[salesamountsstdev1]) - [Measures].[Sales Amount SStdev-Order CustomPP445-PrevYear]\nEND",
  format: "$#,##0.00",
});

const salesAmountSStdevOrderRetail44530PrdMvAvg = getCalc({
  unique_name: "Sales Amount SStdev-Order Retail445-30PrdMvAvg",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount SStdev-Order Retail445-30PrdMvAvg",
  description: "30 Period Moving Average of Sales Amount.  Meant to execute at Day Level  of ",
  expression:
    "Avg([Order Date Dimension].[Order Retail445].CurrentMember.Lag(29):[Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[salesamountsstdev1])",
  format: "$#,##0.00",
});

const salesAmountSStdevOrderRetail44530PrdMvAvgPrevYearGrowthPct = getCalc({
  unique_name: "Sales Amount SStdev-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount SStdev-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
  description: "Sales 30 Period Moving Avg  vs Prev Year as Percentage",
  expression:
    "([Measures].[Sales Amount SStdev-Order Retail445-30PrdMvAvg] - [Measures].[Sales Amount SStdev-Order Retail445-30PrdMvAvgPrevYear])  / [Measures].[Sales Amount SStdev-Order Retail445-30PrdMvAvgPrevYear]",
  format: "percent",
});

const salesAmountSStdevOrderRetail44530PrdMvLowerBand = getCalc({
  unique_name: "Sales Amount SStdev-Order Retail445-30PrdMvLowerBand",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount SStdev-Order Retail445-30PrdMvLowerBand",
  description: "Sales 30 Day Moving Average - 1 Stdev, use on [Order Retail445]",
  expression:
    "[Measures].[Sales Amount SStdev-Order Retail445-30PrdMvAvg] - [Measures].[Sales Amount SStdev-Order Retail445-30PrdMvStdev]",
  format: "$#,##0.00",
});

const salesAmountSStdevOrderRetail445Prev = getCalc({
  unique_name: "Sales Amount SStdev-Order Retail445-Prev",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount SStdev-Order Retail445-Prev ",
  description: "Order Reporting Hierarchy Previous Period Sales",
  expression:
    "CASE WHEN ISEMPTY([Measures].[salesamountsstdev1]) \nTHEN NULL\nELSE\n([Order Date Dimension].[Order Retail445].CurrentMember.PrevMember, [Measures].[salesamountsstdev1])\nEND\n                                ",
  format: "$#,##0.00",
});

const salesAmountOrderCustomPP445PrevYear = getCalc({
  unique_name: "Sales Amount-Order CustomPP445-PrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount-Order CustomPP445-PrevYear",
  description: "Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[salesamount1]) THEN \nNULL\nELSE (ParallelPeriod([Order Date Dimension].[Order CustomPP445].[Order customyear], 1, [Order Date Dimension].[Order CustomPP445].CurrentMember), [Measures].[salesamount1]) END",
  format: "$#,##0.00",
});

const salesAmountOrderRetail44530PrdMvAvgPrevYear = getCalc({
  unique_name: "Sales Amount-Order Retail445-30PrdMvAvgPrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount-Order Retail445-30PrdMvAvgPrevYear",
  description: "Prev Year's 30 Period Moving  Average of Sales. Use on the [Order Retail445] Dimension",
  expression:
    "Avg(ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember).Lag(29): \nParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[salesamount1]\n)",
  format: "$#,##0.00",
});

const salesAmountOrderRetail445Next = getCalc({
  unique_name: "Sales Amount-Order Retail445-Next",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount-Order Retail445-Next",
  description: "Next Period's  Sales Amount on Order Retail445",
  expression:
    "CASE WHEN ISEMPTY([Measures].[salesamount1]) \nTHEN NULL\nELSE\n([Order Date Dimension].[Order Retail445].CurrentMember.NextMember, [Measures].[salesamount1])\nEND\n                                ",
  format: "$#,##0.00",
});

const salesAmountOrderRetail445Prev = getCalc({
  unique_name: "Sales Amount-Order Retail445-Prev",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount-Order Retail445-Prev ",
  description: "Order Reporting Hierarchy Previous Period Sales",
  expression:
    "CASE WHEN ISEMPTY([Measures].[salesamount1]) \nTHEN NULL\nELSE\n([Order Date Dimension].[Order Retail445].CurrentMember.PrevMember, [Measures].[salesamount1])\nEND\n                                ",
  format: "$#,##0.00",
});

const salesAmountOrderRetail445PrevPeriodGrowthPct = getCalc({
  unique_name: "Sales Amount-Order Retail445-PrevPeriodGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount-Order Retail445-PrevPeriodGrowthPct",
  description: "Order Retail445 Previous Period Growth Percent",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Sales Amount-Order Retail445-Prev]) THEN NULL\nELSE\n(([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[salesamount1]) - [Measures].[Sales Amount-Order Retail445-Prev]) / [Measures].[Sales Amount-Order Retail445-Prev]\nEND",
  format: "percent",
});

const salesAmountOrderRetail445PrevYearGrowthPct = getCalc({
  unique_name: "Sales Amount-Order Retail445-PrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount-Order Retail445-PrevYearGrowthPct",
  description: "Order Retail445 Sales Amount Year-over-year growth as percent",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Sales Amount-Order Retail445-PrevYear]) THEN NULL \nELSE [Measures].[Sales Amount-Order Retail445-PrevYearGrowth] / [Measures].[Sales Amount-Order Retail445-PrevYear] \nEND",
  format: "percent",
});

const soldProductNDCOrderRetail44530PrdMvAvgPrevYearGrowthPct = getCalc({
  unique_name: "SoldProductNDC-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "SoldProductNDC-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
  description: "Sales 30 Period Moving Avg  vs Prev Year as Percentage",
  expression:
    "([Measures].[SoldProductNDC-Order Retail445-30PrdMvAvg] - [Measures].[SoldProductNDC-Order Retail445-30PrdMvAvgPrevYear])  / [Measures].[SoldProductNDC-Order Retail445-30PrdMvAvgPrevYear]",
  format: "percent",
});

const soldProductNDCOrderRetail44530PrdMvLowerBand = getCalc({
  unique_name: "SoldProductNDC-Order Retail445-30PrdMvLowerBand",
  object_type: SMLObjectType.MetricCalc,
  label: "SoldProductNDC-Order Retail445-30PrdMvLowerBand",
  description: "Sales 30 Day Moving Average - 1 Stdev, use on [Order Retail445]",
  expression:
    "[Measures].[SoldProductNDC-Order Retail445-30PrdMvAvg] - [Measures].[SoldProductNDC-Order Retail445-30PrdMvStdev]",
  format: "general number",
});

const soldProductNDCOrderRetail445PrevPeriodGrowth = getCalc({
  unique_name: "SoldProductNDC-Order Retail445-PrevPeriodGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "SoldProductNDC-Order Retail445-PrevPeriodGrowth",
  description: "Order Retail 445 Growth since previous period.",
  expression:
    "CASE WHEN ISEMPTY([Measures].[SoldProductNDC-Order Retail445-Prev]) OR ISEMPTY([Measures].[soldproductNDC1])\nTHEN NULL \nELSE \n([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[soldproductNDC1]) - [Measures].[SoldProductNDC-Order Retail445-Prev]\nEND",
  format: "general number",
});

const soldProductNDCOrderRetail445PrevPeriodGrowthPct = getCalc({
  unique_name: "SoldProductNDC-Order Retail445-PrevPeriodGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "SoldProductNDC-Order Retail445-PrevPeriodGrowthPct",
  description: "Order Retail445 Previous Period Growth Percent",
  expression:
    "CASE WHEN ISEMPTY([Measures].[SoldProductNDC-Order Retail445-Prev]) THEN NULL\nELSE\n(([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[soldproductNDC1]) - [Measures].[SoldProductNDC-Order Retail445-Prev]) / [Measures].[SoldProductNDC-Order Retail445-Prev]\nEND",
  format: "percent",
});

const soldProductNDCOrderRetail445PrevYear = getCalc({
  unique_name: "SoldProductNDC-Order Retail445-PrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "SoldProductNDC-Order Retail445-PrevYear",
  description: "Order Sales Amount Prev Year (Retail445)",
  expression:
    "CASE WHEN ISEMPTY([Measures].[soldproductNDC1]) THEN \nNULL \nELSE (ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[soldproductNDC1]) END",
  format: "general number",
});

const soldProductNDCOrderRetail445PrevYearGrowthPct = getCalc({
  unique_name: "SoldProductNDC-Order Retail445-PrevYearGrowthPct",
  object_type: SMLObjectType.MetricCalc,
  label: "SoldProductNDC-Order Retail445-PrevYearGrowthPct",
  description: "Order Retail445 Sales Amount Year-over-year growth as percent",
  expression:
    "CASE WHEN ISEMPTY([Measures].[SoldProductNDC-Order Retail445-PrevYear]) THEN NULL \nELSE [Measures].[SoldProductNDC-Order Retail445-PrevYearGrowth] / [Measures].[SoldProductNDC-Order Retail445-PrevYear] \nEND",
  format: "percent",
});

const customerCountOrderRetail445YTDPrevYear = getCalc({
  unique_name: "Customer Count-Order Retail445-YTDPrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Customer Count-Order Retail445-YTDPrevYear",
  description: "Previous Year's Year-to-date Sum of Sales ",
  expression:
    "Avg(\nPeriodsToDate([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember)), \n[Measures].[customercount1])\n                                ",
  format: "general number",
});

const lastProductUnitPriceOrderRetail445PrevYearGrowth = getCalc({
  unique_name: "Last Product Unit Price-Order Retail445-PrevYearGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "Last Product Unit Price-Order Retail445-PrevYearGrowth",
  description: "Parallel Period Sales Growth  Since the Previous Year",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Last Product Unit Price-Order Retail445-PrevYear]) or ISEMPTY(([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[lastproductunitprice])) THEN\nNULL \nELSE \n([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[lastproductunitprice]) - [Measures].[Last Product Unit Price-Order Retail445-PrevYear]\nEND\n                                ",
  format: "$#,##0.00",
});

const maxTaxAmountOrderCustomPP445PrevYearGrowth = getCalc({
  unique_name: "Max Tax Amount-Order CustomPP445-PrevYearGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "Max Tax Amount-Order CustomPP445-PrevYearGrowth",
  description: "Growth over Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Max Tax Amount-Order CustomPP445-PrevYear]) or ISEMPTY(([Order Date Dimension].[Order CustomPP445].CurrentMember, [Measures].[maxtaxamount1])) THEN\nNULL \nELSE \n([Order Date Dimension].[Order CustomPP445].CurrentMember, [Measures].[maxtaxamount1]) - [Measures].[Max Tax Amount-Order CustomPP445-PrevYear]\nEND",
  format: "$#,##0.00",
});

const maxTaxAmountOrderRetail445PrevPeriodGrowth = getCalc({
  unique_name: "Max Tax Amount-Order Retail445-PrevPeriodGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "Max Tax Amount-Order Retail445-PrevPeriodGrowth",
  description: "Order Retail 445 Growth since previous period.",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Max Tax Amount-Order Retail445-Prev]) OR ISEMPTY([Measures].[maxtaxamount1])\nTHEN NULL \nELSE \n([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[maxtaxamount1]) - [Measures].[Max Tax Amount-Order Retail445-Prev]\nEND",
  format: "$#,##0.00",
});

const maxTaxAmountOrderRetail445PrevYear = getCalc({
  unique_name: "Max Tax Amount-Order Retail445-PrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Max Tax Amount-Order Retail445-PrevYear",
  description: "Order Sales Amount Prev Year (Retail445)",
  expression:
    "CASE WHEN ISEMPTY([Measures].[maxtaxamount1]) THEN \nNULL \nELSE (ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[maxtaxamount1]) END",
  format: "$#,##0.00",
});

const salesAmountSStdevOrderRetail44530PrdMvUpperBand = getCalc({
  unique_name: "Sales Amount SStdev-Order Retail445-30PrdMvUpperBand",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount SStdev-Order Retail445-30PrdMvUpperBand",
  description: "Sales 30 Day Moving Average + 1 Standard Deviation use on [Order Retail445]",
  expression:
    "[Measures].[Sales Amount SStdev-Order Retail445-30PrdMvAvg] + [Measures].[Sales Amount SStdev-Order Retail445-30PrdMvStdev]",
  format: "$#,##0.00",
});

const salesAmountSSalesAmountSStdevOrderRetail445PrevYearGrowthStdevOrderRetail44530PrdMvUpperBand = getCalc({
  unique_name: "Sales Amount SStdev-Order Retail445-PrevYearGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount SStdev-Order Retail445-PrevYearGrowth",
  description: "Parallel Period Sales Growth  Since the Previous Year",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Sales Amount SStdev-Order Retail445-PrevYear]) or ISEMPTY(([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[salesamountsstdev1])) THEN\nNULL \nELSE \n([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[salesamountsstdev1]) - [Measures].[Sales Amount SStdev-Order Retail445-PrevYear]\nEND\n                                ",
  format: "$#,##0.00",
});

const salesAmountSStdevOrderRetail445YTDPrevYear = getCalc({
  unique_name: "Sales Amount SStdev-Order Retail445-YTDPrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount SStdev-Order Retail445-YTDPrevYear",
  description: "Previous Year's Year-to-date Sum of Sales ",
  expression:
    "Avg(\nPeriodsToDate([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember)), \n[Measures].[salesamountsstdev1])\n                                ",
  format: "$#,##0.00",
});

const salesAmountOrderCustomPP445PrevYearGrowth = getCalc({
  unique_name: "Sales Amount-Order CustomPP445-PrevYearGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount-Order CustomPP445-PrevYearGrowth",
  description: "Growth over Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Sales Amount-Order CustomPP445-PrevYear]) or ISEMPTY(([Order Date Dimension].[Order CustomPP445].CurrentMember, [Measures].[salesamount1])) THEN\nNULL \nELSE \n([Order Date Dimension].[Order CustomPP445].CurrentMember, [Measures].[salesamount1]) - [Measures].[Sales Amount-Order CustomPP445-PrevYear]\nEND",
  format: "$#,##0.00",
});

const salesAmountOrderRetail44530PrdMvAvg = getCalc({
  unique_name: "Sales Amount-Order Retail445-30PrdMvAvg",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount-Order Retail445-30PrdMvAvg",
  description: "30 Period Moving Average of Sales Amount.  Meant to execute at Day Level  of ",
  expression:
    "Avg([Order Date Dimension].[Order Retail445].CurrentMember.Lag(29):[Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[salesamount1])",
  format: "$#,##0.00",
});

const salesAmountOrderRetail44530PrdMvLowerBand = getCalc({
  unique_name: "Sales Amount-Order Retail445-30PrdMvLowerBand",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount-Order Retail445-30PrdMvLowerBand",
  description: "Sales 30 Day Moving Average - 1 Stdev, use on [Order Retail445]",
  expression:
    "[Measures].[Sales Amount-Order Retail445-30PrdMvAvg] - [Measures].[Sales Amount-Order Retail445-30PrdMvStdev]",
  format: "$#,##0.00",
});

const salesAmountOrderRetail445YTD = getCalc({
  unique_name: "Sales Amount-Order Retail445-YTD",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount-Order Retail445-YTD",
  description: "Sales Amount Year-to-date Order Retail445",
  expression:
    "CASE WHEN ISEMPTY([Measures].[salesamount1]) THEN NULL \nELSE \nAggregate(PeriodsToDate([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[salesamount1]) \nEND ",
  format: "$#,##0.00",
});

const soldProductNDCOrderCustomPP445PrevYearGrowth = getCalc({
  unique_name: "SoldProductNDC-Order CustomPP445-PrevYearGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "SoldProductNDC-Order CustomPP445-PrevYearGrowth",
  description: "Growth over Previous Period Sales with a custom lookback key.  Use with [Order CustomPP445]",
  expression:
    "CASE WHEN ISEMPTY([Measures].[SoldProductNDC-Order CustomPP445-PrevYear]) or ISEMPTY(([Order Date Dimension].[Order CustomPP445].CurrentMember, [Measures].[soldproductNDC1])) THEN\nNULL \nELSE \n([Order Date Dimension].[Order CustomPP445].CurrentMember, [Measures].[soldproductNDC1]) - [Measures].[SoldProductNDC-Order CustomPP445-PrevYear]\nEND",
  format: "general number",
});

const soldProductNDCOrderRetail44530PrdMvUpperBand = getCalc({
  unique_name: "SoldProductNDC-Order Retail445-30PrdMvUpperBand",
  object_type: SMLObjectType.MetricCalc,
  label: "SoldProductNDC-Order Retail445-30PrdMvUpperBand",
  description: "Sales 30 Day Moving Average + 1 Standard Deviation use on [Order Retail445]",
  expression:
    "[Measures].[SoldProductNDC-Order Retail445-30PrdMvAvg] + [Measures].[SoldProductNDC-Order Retail445-30PrdMvStdev]",
  format: "general number",
});

const maxTaxAmountOrderRetail445YTDPrevYear = getCalc({
  unique_name: "Max Tax Amount-Order Retail445-YTDPrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Max Tax Amount-Order Retail445-YTDPrevYear",
  description: "Previous Year's Year-to-date Sum of Sales ",
  expression:
    "Aggregate(\nPeriodsToDate([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember)), \n[Measures].[maxtaxamount1])\n                                ",
  format: "$#,##0.00",
});

const salesAmountSStdevOrderRetail445PrevPeriodGrowth = getCalc({
  unique_name: "Sales Amount SStdev-Order Retail445-PrevPeriodGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount SStdev-Order Retail445-PrevPeriodGrowth",
  description: "Order Retail 445 Growth since previous period.",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Sales Amount SStdev-Order Retail445-Prev]) OR ISEMPTY([Measures].[salesamountsstdev1])\nTHEN NULL \nELSE \n([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[salesamountsstdev1]) - [Measures].[Sales Amount SStdev-Order Retail445-Prev]\nEND",
  format: "$#,##0.00",
});

const salesAmountOrderRetail44530PrdMvUpperBand = getCalc({
  unique_name: "Sales Amount-Order Retail445-30PrdMvUpperBand",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount-Order Retail445-30PrdMvUpperBand",
  description: "Sales 30 Day Moving Average + 1 Standard Deviation use on [Order Retail445]",
  expression:
    "[Measures].[Sales Amount-Order Retail445-30PrdMvAvg] + [Measures].[Sales Amount-Order Retail445-30PrdMvStdev]",
  format: "$#,##0.00",
});

const salesAmountOrderRetail445PrevPeriodGrowth = getCalc({
  unique_name: "Sales Amount-Order Retail445-PrevPeriodGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount-Order Retail445-PrevPeriodGrowth",
  description: "Order Retail 445 Growth since previous period.",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Sales Amount-Order Retail445-Prev]) OR ISEMPTY([Measures].[salesamount1])\nTHEN NULL \nELSE \n([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[salesamount1]) - [Measures].[Sales Amount-Order Retail445-Prev]\nEND",
  format: "$#,##0.00",
});

const salesAmountOrderRetail445PrevYear = getCalc({
  unique_name: "Sales Amount-Order Retail445-PrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount-Order Retail445-PrevYear",
  description: "Order Sales Amount Prev Year (Retail445)",
  expression:
    "CASE WHEN ISEMPTY([Measures].[salesamount1]) THEN \nNULL \nELSE (ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember), [Measures].[salesamount1]) END",
  format: "$#,##0.00",
});

const salesAmountOrderRetail445PrevYearGrowth = getCalc({
  unique_name: "Sales Amount-Order Retail445-PrevYearGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount-Order Retail445-PrevYearGrowth",
  description: "Parallel Period Sales Growth  Since the Previous Year",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Sales Amount-Order Retail445-PrevYear]) or ISEMPTY(([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[salesamount1])) THEN\nNULL \nELSE \n([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[salesamount1]) - [Measures].[Sales Amount-Order Retail445-PrevYear]\nEND\n                                ",
  format: "$#,##0.00",
});

const soldProductNDCOrderRetail445PrevYearGrowth = getCalc({
  unique_name: "SoldProductNDC-Order Retail445-PrevYearGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "SoldProductNDC-Order Retail445-PrevYearGrowth",
  description: "Parallel Period Sales Growth  Since the Previous Year",
  expression:
    "CASE WHEN ISEMPTY([Measures].[SoldProductNDC-Order Retail445-PrevYear]) or ISEMPTY(([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[soldproductNDC1])) THEN\nNULL \nELSE \n([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[soldproductNDC1]) - [Measures].[SoldProductNDC-Order Retail445-PrevYear]\nEND\n                                ",
  format: "general number",
});

const customerCountOrderRetail445PrevYearGrowth = getCalc({
  unique_name: "Customer Count-Order Retail445-PrevYearGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "Customer Count-Order Retail445-PrevYearGrowth",
  description: "Parallel Period Sales Growth  Since the Previous Year",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Customer Count-Order Retail445-PrevYear]) or ISEMPTY(([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[customercount1])) THEN\nNULL \nELSE \n([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[customercount1]) - [Measures].[Customer Count-Order Retail445-PrevYear]\nEND\n                                ",
  format: "general number",
});

const salesAmountOrderRetail445YTDPrevYear = getCalc({
  unique_name: "Sales Amount-Order Retail445-YTDPrevYear",
  object_type: SMLObjectType.MetricCalc,
  label: "Sales Amount-Order Retail445-YTDPrevYear",
  description: "Previous Year's Year-to-date Sum of Sales ",
  expression:
    "Aggregate(\nPeriodsToDate([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], ParallelPeriod([Order Date Dimension].[Order Retail445].[Order ReportIng_Year], 1, [Order Date Dimension].[Order Retail445].CurrentMember)), \n[Measures].[salesamount1])\n                                ",
  format: "$#,##0.00",
});

const maxTaxAmountOrderRetail445PrevYearGrowth = getCalc({
  unique_name: "Max Tax Amount-Order Retail445-PrevYearGrowth",
  object_type: SMLObjectType.MetricCalc,
  label: "Max Tax Amount-Order Retail445-PrevYearGrowth",
  description: "Parallel Period Sales Growth  Since the Previous Year",
  expression:
    "CASE WHEN ISEMPTY([Measures].[Max Tax Amount-Order Retail445-PrevYear]) or ISEMPTY(([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[maxtaxamount1])) THEN\nNULL \nELSE \n([Order Date Dimension].[Order Retail445].CurrentMember, [Measures].[maxtaxamount1]) - [Measures].[Max Tax Amount-Order Retail445-PrevYear]\nEND\n                                ",
  format: "$#,##0.00",
});

const allCalculations = {
  averageLastProductUnitCountPerOrder,
  estimatedCustomerCountOrderCustomPP445PrevYearGrowthPct,
  estimatedCustomerCountOrderRetail44530PrdMvAvgPrevYear,
  estimatedCustomerCountOrderRetail44530PrdMvStdev,
  estimatedCustomerCountOrderRetail445Next,
  lastProductUnitPriceOrderCustomPP445PrevYear,
  salesAmountOrderRetail44530PrdMvAvgPrevYearGrowthPct,
  soldProductNDCOrderRetail445Prev,
  soldProductNDCOrderRetail445YTDPrevYear,
  averageEstCustomerCountPerOrder,
  averageSalesAmountSDCountPerOrder,
  averageSalesPerOrder,
  averageSoldProductPerOrder,
  customerCountOrderCustomPP445PrevYearGrowthPct,
  customerCountOrderRetail44530PrdMvAvgPrevYear,
  customerCountOrderRetail44530PrdMvStdev,
  customerCountOrderRetail445Next,
  customerCountOrderRetail445Prev,
  estimatedCustomerCountOrderCustomPP445PrevYear,
  estimatedCustomerCountOrderRetail44530PrdMvAvg,
  estimatedCustomerCountOrderRetail44530PrdMvLowerBand,
  estimatedCustomerCountOrderRetail445Prev,
  estimatedCustomerCountOrderRetail445PrevPeriodGrowthPct,
  estimatedCustomerCountOrderRetail445PrevYearGrowthPct,
  estimatedCustomerCountOrderRetail445YTD,
  lastProductUnitPriceOrderCustomPP445PrevYearGrowthPct,
  lastProductUnitPriceOrderRetail44530PrdMvAvgPrevYear,
  lastProductUnitPriceOrderRetail44530PrdMvStdev,
  lastProductUnitPriceOrderRetail445Next,
  lastProductUnitPriceOrderRetail445PrevYear,
  maxTaxAmountOrderRetail44530PrdMvStdev,
  salesAmountSStdevOrderCustomPP445PrevYear,
  salesAmountSStdevOrderCustomPP445PrevYearGrowthPct,
  salesAmountSStdevOrderRetail44530PrdMvStdev,
  soldProductNDCOrderCustomPP445PrevYear,
  soldProductNDCOrderRetail44530PrdMvAvgPrevYear,
  soldProductNDCOrderRetail44530PrdMvStdev,
  soldProductNDCOrderRetail445Next,
  averageCustomerCountPerOrder,
  averageMaxTaxCountPerOrder,
  customerCountOrderRetail44530PrdMvAvg,
  customerCountOrderRetail44530PrdMvLowerBand,
  customerCountOrderRetail445PrevPeriodGrowthPct,
  customerCountOrderRetail445PrevYearGrowthPct,
  estimatedCustomerCountOrderCustomPP445PrevYearGrowth,
  estimatedCustomerCountOrderRetail44530PrdMvAvgPrevYearGrowthPct,
  estimatedCustomerCountOrderRetail44530PrdMvUpperBand,
  estimatedCustomerCountOrderRetail445PrevPeriodGrowth,
  estimatedCustomerCountOrderRetail445PrevYear,
  lastProductUnitPriceOrderRetail44530PrdMvAvg,
  lastProductUnitPriceOrderRetail44530PrdMvLowerBand,
  lastProductUnitPriceOrderRetail445Prev,
  lastProductUnitPriceOrderRetail445PrevPeriodGrowthPct,
  lastProductUnitPriceOrderRetail445PrevYearGrowthPct,
  lastProductUnitPriceOrderRetail445YTD,
  lastProductUnitPriceOrderRetail445YTDPrevYear,
  maxTaxAmountOrderCustomPP445PrevYear,
  maxTaxAmountOrderCustomPP445PrevYearGrowthPct,
  maxTaxAmountOrderRetail44530PrdMvAvg,
  maxTaxAmountOrderRetail44530PrdMvAvgPrevYear,
  maxTaxAmountOrderRetail445Next,
  maxTaxAmountOrderRetail445Prev,
  maxTaxAmountOrderRetail445PrevPeriodGrowthPct,
  salesAmountSStdevOrderRetail44530PrdMvAvgPrevYear,
  salesAmountSStdevOrderRetail445Next,
  salesAmountSStdevOrderRetail445PrevPeriodGrowthPct,
  salesAmountSStdevOrderRetail445PrevYear,
  salesAmountSStdevOrderRetail445PrevYearGrowthPct,
  salesAmountSStdevOrderRetail445YTD,
  salesAmountOrderCustomPP445PrevYearGrowthPct,
  salesAmountOrderRetail44530PrdMvStdev,
  soldProductNDCOrderCustomPP445PrevYearGrowthPct,
  soldProductNDCOrderRetail44530PrdMvAvg,
  soldProductNDCOrderRetail445YTD,
  customerCountOrderCustomPP445PrevYear,
  customerCountOrderCustomPP445PrevYearGrowth,
  customerCountOrderRetail44530PrdMvAvgPrevYearGrowthPct,
  customerCountOrderRetail44530PrdMvUpperBand,
  customerCountOrderRetail445PrevPeriodGrowth,
  customerCountOrderRetail445PrevYear,
  customerCountOrderRetail445YTD,
  estimatedCustomerCountOrderRetail445PrevYearGrowth,
  estimatedCustomerCountOrderRetail445YTDPrevYear,
  lastProductUnitPriceOrderCustomPP445PrevYearGrowth,
  lastProductUnitPriceOrderRetail44530PrdMvAvgPrevYearGrowthPct,
  lastProductUnitPriceOrderRetail44530PrdMvUpperBand,
  lastProductUnitPriceOrderRetail445PrevPeriodGrowth,
  maxTaxAmountOrderRetail44530PrdMvAvgPrevYearGrowthPct,
  maxTaxAmountOrderRetail44530PrdMvLowerBand,
  maxTaxAmountOrderRetail44530PrdMvUpperBand,
  maxTaxAmountOrderRetail445PrevYearGrowthPct,
  maxTaxAmountOrderRetail445YTD,
  salesAmountSStdevOrderCustomPP445PrevYearGrowth,
  salesAmountSStdevOrderRetail44530PrdMvAvg,
  salesAmountSStdevOrderRetail44530PrdMvAvgPrevYearGrowthPct,
  salesAmountSStdevOrderRetail44530PrdMvLowerBand,
  salesAmountSStdevOrderRetail445Prev,
  salesAmountOrderCustomPP445PrevYear,
  salesAmountOrderRetail44530PrdMvAvgPrevYear,
  salesAmountOrderRetail445Next,
  salesAmountOrderRetail445Prev,
  salesAmountOrderRetail445PrevPeriodGrowthPct,
  salesAmountOrderRetail445PrevYearGrowthPct,
  soldProductNDCOrderRetail44530PrdMvAvgPrevYearGrowthPct,
  soldProductNDCOrderRetail44530PrdMvLowerBand,
  soldProductNDCOrderRetail445PrevPeriodGrowth,
  soldProductNDCOrderRetail445PrevPeriodGrowthPct,
  soldProductNDCOrderRetail445PrevYear,
  soldProductNDCOrderRetail445PrevYearGrowthPct,
  customerCountOrderRetail445YTDPrevYear,
  lastProductUnitPriceOrderRetail445PrevYearGrowth,
  maxTaxAmountOrderCustomPP445PrevYearGrowth,
  maxTaxAmountOrderRetail445PrevPeriodGrowth,
  maxTaxAmountOrderRetail445PrevYear,
  salesAmountSStdevOrderRetail44530PrdMvUpperBand,
  salesAmountSSalesAmountSStdevOrderRetail445PrevYearGrowthStdevOrderRetail44530PrdMvUpperBand,
  salesAmountSStdevOrderRetail445YTDPrevYear,
  salesAmountOrderCustomPP445PrevYearGrowth,
  salesAmountOrderRetail44530PrdMvAvg,
  salesAmountOrderRetail44530PrdMvLowerBand,
  salesAmountOrderRetail445YTD,
  soldProductNDCOrderCustomPP445PrevYearGrowth,
  soldProductNDCOrderRetail44530PrdMvUpperBand,
  maxTaxAmountOrderRetail445YTDPrevYear,
  salesAmountSStdevOrderRetail445PrevPeriodGrowth,
  salesAmountOrderRetail44530PrdMvUpperBand,
  salesAmountOrderRetail445PrevPeriodGrowth,
  salesAmountOrderRetail445PrevYear,
  salesAmountOrderRetail445PrevYearGrowth,
  soldProductNDCOrderRetail445PrevYearGrowth,
  customerCountOrderRetail445PrevYearGrowth,
  salesAmountOrderRetail445YTDPrevYear,
  maxTaxAmountOrderRetail445PrevYearGrowth,
};

export const calculations = getAggregatedResult<SMLMetricCalculated, typeof allCalculations>(allCalculations);
