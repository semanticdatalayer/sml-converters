import { SMLObjectType, SMLModel } from "sml-sdk";
import { getAggregatedResult, getFreezedObject } from "./utils";

const getModel = (input: SMLModel) => getFreezedObject(input);

const InternetSales = getModel({
  unique_name: "Internet Sales",
  object_type: SMLObjectType.Model,
  label: "Internet Sales",
  dimensions: ["Color Dimension", "Size Dimension", "Style Dimension", "Weight Dimension"],
  drillthroughs: [
    {
      unique_name: "Customer Details",
      attributes: [
        {
          dimension: "Customer Dimension",
          name: "Customer Name",
        },
        {
          dimension: "Geography Dimension",
          name: "State",
        },
        {
          dimension: "Geography Dimension",
          name: "Zip Code",
        },
        {
          dimension: "Geography Dimension",
          name: "City",
        },
      ],
      metrics: ["orderquantity1", "salesamount1"],
    },
    {
      unique_name: "Shipping Details",
      attributes: [
        {
          dimension: "Color Dimension",
          name: "Color",
        },
        {
          dimension: "Customer Dimension",
          name: "Customer Name",
        },
        {
          dimension: "Size Dimension",
          name: "Size",
        },
        {
          dimension: "Style Dimension",
          name: "Style",
        },
        {
          dimension: "Product Dimension",
          name: "Product Name",
        },
      ],
      metrics: ["orderquantity1", "salesamount1"],
    },
  ],
  include_default_drillthrough: true,
  metrics: [
    {
      unique_name: "calculatedtax1",
      folder: "Sales Metrics",
    },
    {
      unique_name: "customercount1",
      folder: "Customer Metrics",
    },
    {
      unique_name: "customercountestimate1",
      folder: "Customer Metrics",
    },
    {
      unique_name: "lastproductunitprice",
      folder: "Product Metrics",
    },
    {
      unique_name: "maxOrderDate",
      folder: "Time Relative",
    },
    {
      unique_name: "maxtaxamount1",
      folder: "Sales Metrics",
    },
    {
      unique_name: "MinOrderDate",
      folder: "Time Relative",
    },
    {
      unique_name: "orderquantity1",
      folder: "Sales Metrics",
    },
    {
      unique_name: "salesamount1",
      folder: "Sales Metrics",
    },
    {
      unique_name: "salesamountAvg1",
      folder: "Sales Metrics",
    },
    {
      unique_name: "salesamountsstdev1",
      folder: "Sales Metrics",
    },
    {
      unique_name: "soldproductNDC1",
      folder: "Sales Metrics",
    },
    {
      unique_name: "Average Customer Count per Order",
      folder: "Time Relative",
    },
    {
      unique_name: "Average Est Customer Count per Order",
      folder: "Time Relative",
    },
    {
      unique_name: "Average Last Product Unit Count per Order",
      folder: "Time Relative",
    },
    {
      unique_name: "Average Max Tax Count per Order",
      folder: "Time Relative",
    },
    {
      unique_name: "Average Sales Amount SD Count per Order",
      folder: "Time Relative",
    },
    {
      unique_name: "Average Sales per Order",
      folder: "Time Relative",
    },
    {
      unique_name: "Average Sold Product per Order",
      folder: "Time Relative",
    },
    {
      unique_name: "Customer Count-Order CustomPP445-PrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Customer Count-Order CustomPP445-PrevYearGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "Customer Count-Order CustomPP445-PrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Customer Count-Order Retail445-30PrdMvAvg",
      folder: "Time Relative",
    },
    {
      unique_name: "Customer Count-Order Retail445-30PrdMvAvgPrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Customer Count-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Customer Count-Order Retail445-30PrdMvLowerBand",
      folder: "Time Relative",
    },
    {
      unique_name: "Customer Count-Order Retail445-30PrdMvStdev",
      folder: "Time Relative",
    },
    {
      unique_name: "Customer Count-Order Retail445-30PrdMvUpperBand",
      folder: "Time Relative",
    },
    {
      unique_name: "Customer Count-Order Retail445-Next",
      folder: "Time Relative",
    },
    {
      unique_name: "Customer Count-Order Retail445-Prev",
      folder: "Time Relative",
    },
    {
      unique_name: "Customer Count-Order Retail445-PrevPeriodGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "Customer Count-Order Retail445-PrevPeriodGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Customer Count-Order Retail445-PrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Customer Count-Order Retail445-PrevYearGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "Customer Count-Order Retail445-PrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Customer Count-Order Retail445-YTD",
      folder: "Time Relative",
    },
    {
      unique_name: "Customer Count-Order Retail445-YTDPrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Estimated Customer Count-Order CustomPP445-PrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Estimated Customer Count-Order CustomPP445-PrevYearGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "Estimated Customer Count-Order CustomPP445-PrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Estimated Customer Count-Order Retail445-30PrdMvAvg",
      folder: "Time Relative",
    },
    {
      unique_name: "Estimated Customer Count-Order Retail445-30PrdMvAvgPrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Estimated Customer Count-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Estimated Customer Count-Order Retail445-30PrdMvLowerBand",
      folder: "Time Relative",
    },
    {
      unique_name: "Estimated Customer Count-Order Retail445-30PrdMvStdev",
      folder: "Time Relative",
    },
    {
      unique_name: "Estimated Customer Count-Order Retail445-30PrdMvUpperBand",
      folder: "Time Relative",
    },
    {
      unique_name: "Estimated Customer Count-Order Retail445-Next",
      folder: "Time Relative",
    },
    {
      unique_name: "Estimated Customer Count-Order Retail445-Prev",
      folder: "Time Relative",
    },
    {
      unique_name: "Estimated Customer Count-Order Retail445-PrevPeriodGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "Estimated Customer Count-Order Retail445-PrevPeriodGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Estimated Customer Count-Order Retail445-PrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Estimated Customer Count-Order Retail445-PrevYearGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "Estimated Customer Count-Order Retail445-PrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Estimated Customer Count-Order Retail445-YTD",
      folder: "Time Relative",
    },
    {
      unique_name: "Estimated Customer Count-Order Retail445-YTDPrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Last Product Unit Price-Order CustomPP445-PrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Last Product Unit Price-Order CustomPP445-PrevYearGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "Last Product Unit Price-Order CustomPP445-PrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Last Product Unit Price-Order Retail445-30PrdMvAvg",
      folder: "Time Relative",
    },
    {
      unique_name: "Last Product Unit Price-Order Retail445-30PrdMvAvgPrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Last Product Unit Price-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Last Product Unit Price-Order Retail445-30PrdMvLowerBand",
      folder: "Time Relative",
    },
    {
      unique_name: "Last Product Unit Price-Order Retail445-30PrdMvStdev",
      folder: "Time Relative",
    },
    {
      unique_name: "Last Product Unit Price-Order Retail445-30PrdMvUpperBand",
      folder: "Time Relative",
    },
    {
      unique_name: "Last Product Unit Price-Order Retail445-Next",
      folder: "Time Relative",
    },
    {
      unique_name: "Last Product Unit Price-Order Retail445-Prev",
      folder: "Time Relative",
    },
    {
      unique_name: "Last Product Unit Price-Order Retail445-PrevPeriodGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "Last Product Unit Price-Order Retail445-PrevPeriodGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Last Product Unit Price-Order Retail445-PrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Last Product Unit Price-Order Retail445-PrevYearGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "Last Product Unit Price-Order Retail445-PrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Last Product Unit Price-Order Retail445-YTD",
      folder: "Time Relative",
    },
    {
      unique_name: "Last Product Unit Price-Order Retail445-YTDPrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Max Tax Amount-Order CustomPP445-PrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Max Tax Amount-Order CustomPP445-PrevYearGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "Max Tax Amount-Order CustomPP445-PrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Max Tax Amount-Order Retail445-30PrdMvAvg",
      folder: "Time Relative",
    },
    {
      unique_name: "Max Tax Amount-Order Retail445-30PrdMvAvgPrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Max Tax Amount-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Max Tax Amount-Order Retail445-30PrdMvLowerBand",
      folder: "Time Relative",
    },
    {
      unique_name: "Max Tax Amount-Order Retail445-30PrdMvStdev",
      folder: "Time Relative",
    },
    {
      unique_name: "Max Tax Amount-Order Retail445-30PrdMvUpperBand",
      folder: "Time Relative",
    },
    {
      unique_name: "Max Tax Amount-Order Retail445-Next",
      folder: "Time Relative",
    },
    {
      unique_name: "Max Tax Amount-Order Retail445-Prev",
      folder: "Time Relative",
    },
    {
      unique_name: "Max Tax Amount-Order Retail445-PrevPeriodGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "Max Tax Amount-Order Retail445-PrevPeriodGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Max Tax Amount-Order Retail445-PrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Max Tax Amount-Order Retail445-PrevYearGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "Max Tax Amount-Order Retail445-PrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Max Tax Amount-Order Retail445-YTD",
      folder: "Time Relative",
    },
    {
      unique_name: "Max Tax Amount-Order Retail445-YTDPrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount SStdev-Order CustomPP445-PrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount SStdev-Order CustomPP445-PrevYearGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount SStdev-Order CustomPP445-PrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount SStdev-Order Retail445-30PrdMvAvg",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount SStdev-Order Retail445-30PrdMvAvgPrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount SStdev-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount SStdev-Order Retail445-30PrdMvLowerBand",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount SStdev-Order Retail445-30PrdMvStdev",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount SStdev-Order Retail445-30PrdMvUpperBand",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount SStdev-Order Retail445-Next",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount SStdev-Order Retail445-Prev",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount SStdev-Order Retail445-PrevPeriodGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount SStdev-Order Retail445-PrevPeriodGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount SStdev-Order Retail445-PrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount SStdev-Order Retail445-PrevYearGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount SStdev-Order Retail445-PrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount SStdev-Order Retail445-YTD",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount SStdev-Order Retail445-YTDPrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount-Order CustomPP445-PrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount-Order CustomPP445-PrevYearGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount-Order CustomPP445-PrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount-Order Retail445-30PrdMvAvg",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount-Order Retail445-30PrdMvAvgPrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount-Order Retail445-30PrdMvLowerBand",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount-Order Retail445-30PrdMvStdev",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount-Order Retail445-30PrdMvUpperBand",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount-Order Retail445-Next",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount-Order Retail445-Prev",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount-Order Retail445-PrevPeriodGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount-Order Retail445-PrevPeriodGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount-Order Retail445-PrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount-Order Retail445-PrevYearGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount-Order Retail445-PrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount-Order Retail445-YTD",
      folder: "Time Relative",
    },
    {
      unique_name: "Sales Amount-Order Retail445-YTDPrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "SoldProductNDC-Order CustomPP445-PrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "SoldProductNDC-Order CustomPP445-PrevYearGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "SoldProductNDC-Order CustomPP445-PrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "SoldProductNDC-Order Retail445-30PrdMvAvg",
      folder: "Time Relative",
    },
    {
      unique_name: "SoldProductNDC-Order Retail445-30PrdMvAvgPrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "SoldProductNDC-Order Retail445-30PrdMvAvgPrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "SoldProductNDC-Order Retail445-30PrdMvLowerBand",
      folder: "Time Relative",
    },
    {
      unique_name: "SoldProductNDC-Order Retail445-30PrdMvStdev",
      folder: "Time Relative",
    },
    {
      unique_name: "SoldProductNDC-Order Retail445-30PrdMvUpperBand",
      folder: "Time Relative",
    },
    {
      unique_name: "SoldProductNDC-Order Retail445-Next",
      folder: "Time Relative",
    },
    {
      unique_name: "SoldProductNDC-Order Retail445-Prev",
      folder: "Time Relative",
    },
    {
      unique_name: "SoldProductNDC-Order Retail445-PrevPeriodGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "SoldProductNDC-Order Retail445-PrevPeriodGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "SoldProductNDC-Order Retail445-PrevYear",
      folder: "Time Relative",
    },
    {
      unique_name: "SoldProductNDC-Order Retail445-PrevYearGrowth",
      folder: "Time Relative",
    },
    {
      unique_name: "SoldProductNDC-Order Retail445-PrevYearGrowthPct",
      folder: "Time Relative",
    },
    {
      unique_name: "SoldProductNDC-Order Retail445-YTD",
      folder: "Time Relative",
    },
    {
      unique_name: "SoldProductNDC-Order Retail445-YTDPrevYear",
      folder: "Time Relative",
    },
  ],
  perspectives: [
    {
      unique_name: "Internet Sales - No PII",
      dimensions: [
        {
          hierarchies: [
            {
              levels: ["Customer Name"],
              name: "Customer Hierarchy",
            },
          ],
          name: "Customer Dimension",
          secondary_attributes: ["d_firstname", "d_lastname"],
        },
      ],
    },
  ],
  relationships: [
    {
      unique_name: "factinternetsales_Date_Dimension_Order",
      from: {
        dataset: "factinternetsales",
        join_columns: ["orderdatekey"],
      },
      role_play: "Order {0}",
      to: {
        dimension: "Date Dimension",
        level: "customday",
      },
    },
    {
      unique_name: "factinternetsales_Date_Dimension_Ship",
      from: {
        dataset: "factinternetsales",
        join_columns: ["shipdatekey"],
      },
      role_play: "Ship {0}",
      to: {
        dimension: "Date Dimension",
        level: "customday",
      },
    },
    {
      unique_name: "factinternetsales_Order_Dimension",
      from: {
        dataset: "factinternetsales",
        join_columns: ["salesorderlinenumber", "salesordernumber", "currencykey"],
      },
      to: {
        dimension: "Order Dimension",
        level: "order_line_item",
      },
    },
    {
      unique_name: "factinternetsales_Product_Dimension",
      from: {
        dataset: "factinternetsales",
        join_columns: ["productkey"],
      },
      to: {
        dimension: "Product Dimension",
        level: "Product Name",
      },
    },
    {
      unique_name: "factinternetsales_Date_Dimension_Order_1",
      from: {
        dataset: "factinternetsales",
        join_columns: ["orderdatekey"],
      },
      role_play: "Order {0}",
      to: {
        dimension: "Date Dimension",
        level: "Reporting_Day",
      },
    },
    {
      unique_name: "factinternetsales_Date_Dimension_Ship_1",
      from: {
        dataset: "factinternetsales",
        join_columns: ["shipdatekey"],
      },
      role_play: "Ship {0}",
      to: {
        dimension: "Date Dimension",
        level: "Reporting_Day",
      },
    },
    {
      unique_name: "factinternetsales_Customer_Dimension",
      from: {
        dataset: "factinternetsales",
        join_columns: ["customerkey"],
      },
      to: {
        dimension: "Customer Dimension",
        level: "Customer Name",
      },
    },
    {
      unique_name: "factinternetsales_Date_Dimension_Order_2",
      from: {
        dataset: "factinternetsales",
        join_columns: ["orderdatekey"],
      },
      role_play: "Order {0}",
      to: {
        dimension: "Date Dimension",
        level: "DayMonth",
      },
    },
    {
      unique_name: "factinternetsales_Date_Dimension_Ship_2",
      from: {
        dataset: "factinternetsales",
        join_columns: ["shipdatekey"],
      },
      role_play: "Ship {0}",
      to: {
        dimension: "Date Dimension",
        level: "DayMonth",
      },
    },
    {
      unique_name: "factinternetsales_orderdate_to_Row Level Security by Region",
      from: {
        dataset: "factinternetsales",
        join_columns: ["orderdate"],
      },
      to: {
        row_security: "Row Level Security by Region",
      },
    },
  ],
  aggregates: [
    {
      unique_name: "Sales amount by Gender",
      label: "Sales amount by Gender",
      attributes: [
        {
          dimension: "Gender Dimension",
          name: "Gender",
        },
      ],
      metrics: ["salesamount1"],
    },
    {
      unique_name: "Sales amount by Color",
      label: "Sales amount by Color",
      attributes: [
        {
          dimension: "Color Dimension",
          name: "Color",
        },
      ],
      metrics: ["salesamount1"],
    },
  ],
});

const allModels = {
  InternetSales,
};

export const models = getAggregatedResult<SMLModel, typeof allModels>(allModels);
