import { ObjectType } from "../../ObjectType";
import {
  IYamlDimension,
  IYamlDimensionType,
  YamlDimensionRelationType,
  YamlDimensionTimeUnit,
  YamlHierarchyEmptyField,
} from "../../yaml/IYamlDimension";
import { CalculationMethod } from "../../yaml/IYamlMeasure";
import { getAggregatedResult, getFreezedObject } from "./utils";

const getDimension = (dim: IYamlDimension) => getFreezedObject(dim);

const orderDimension = getDimension({
  unique_name: "Order Dimension",
  label: "Order Dimension",
  object_type: ObjectType.Dimension,
  hierarchies: [
    {
      unique_name: "Order Dimension hierarchy",
      label: "Order Dimension",
      folder: "Orders",
      levels: [
        {
          unique_name: "currency",
        },
        {
          unique_name: "order",
        },
        {
          unique_name: "order_line_item",
          secondary_attributes: [
            {
              unique_name: "typeorder",
              label: "Order Type",
              is_hidden: false,
              folder: "Orders",
              dataset: "dimorder",
              name_column: "type",
              key_columns: ["type"],
              sort_column: "type",
            },
          ],
        },
      ],
    },
  ],
  level_attributes: [
    {
      unique_name: "currency",
      label: "Currency",
      dataset: "dimorder",
      name_column: "currency_name",
      key_columns: ["currencykey"],
    },
    {
      unique_name: "order",
      label: "Order",
      dataset: "dimorder",
      name_column: "salesordernumber",
      key_columns: ["salesordernumber", "currencykey"],
    },
    {
      unique_name: "order_line_item",
      label: "Order Line Item",
      description: "Order Line Item",
      is_unique_key: true,
      dataset: "dimorder",
      name_column: "salesorderlinenumber",
      key_columns: ["salesorderlinenumber", "salesordernumber", "currencykey"],
    },
  ],
});

const productDimension = getDimension({
  unique_name: "Product Dimension",
  label: "Product Dimension",
  object_type: ObjectType.Dimension,
  description: "Product Line, Category, and Name",
  hierarchies: [
    {
      unique_name: "Product Dimension hierarchy",
      label: "Product Hierarchy",
      folder: "Product Attributes",
      levels: [
        {
          unique_name: "Product Line",
        },
        {
          unique_name: "Product Category",
          secondary_attributes: [
            {
              unique_name: "d_productsubcategoryId",
              label: "Product Subcategory ID",
              description: "ID of the product category",
              is_hidden: false,
              dataset: "dimproduct",
              name_column: "productsubcategorykey",
              key_columns: ["productsubcategorykey"],
            },
          ],
        },
        {
          unique_name: "Product Name",
          metrics: [
            {
              unique_name: "List Price",
              label: "List Price",
              calculation_method: CalculationMethod.Sum,
              dataset: "dimproduct",
              column: "listprice",
            },
          ],
        },
      ],
    },
  ],
  level_attributes: [
    {
      unique_name: "Product Category",
      label: "Product Category",
      description: "Product Sub Category",
      dataset: "dimproduct",
      name_column: "productsubcategoryname",
      key_columns: ["productline", "productsubcategorykey"],
    },
    {
      unique_name: "Product Line",
      label: "Product Line",
      description: "Product Line",
      dataset: "dimproduct",
      name_column: "productline",
      key_columns: ["productline"],
    },
    {
      unique_name: "Product Name",
      label: "Product Name",
      description: "Full Product Name",
      is_unique_key: true,
      dataset: "dimproduct",
      name_column: "englishproductname",
      key_columns: ["productkey"],
    },
  ],
});

const weightDimension = getDimension({
  unique_name: "Weight Dimension",
  label: "Weight",
  object_type: ObjectType.Dimension,
  is_degenerate: true,
  hierarchies: [
    {
      unique_name: "Weight hierarchy",
      label: "Weight",
      folder: "Product Attributes",
      filter_empty: YamlHierarchyEmptyField.Yes,
      levels: [
        {
          unique_name: "Weight",
        },
      ],
    },
  ],
  level_attributes: [
    {
      unique_name: "Weight",
      label: "Weight",
      dataset: "factinternetsales",
      name_column: "weight",
      key_columns: ["weight"],
    },
  ],
});

const colorDimension = getDimension({
  unique_name: "Color Dimension",
  object_type: ObjectType.Dimension,
  label: "Color Dimension AAAAA",
  description: "Product Color ",
  is_degenerate: true,
  hierarchies: [
    {
      unique_name: "Color hierarchy",
      label: "Color",
      folder: "Product Attributes",
      levels: [
        {
          unique_name: "Color",
        },
      ],
    },
  ],
  level_attributes: [
    {
      unique_name: "Color",
      label: "Color",
      description: "Product Color",
      dataset: "factinternetsales",
      name_column: "color",
      key_columns: ["color"],
    },
  ],
});

const customerDimension = getDimension({
  unique_name: "Customer Dimension",
  label: "Customer Dimension",
  object_type: ObjectType.Dimension,
  description: "Customer Key",
  hierarchies: [
    {
      unique_name: "Customer Hierarchy",
      label: "Customer Hierarchy",
      folder: "Customer Attributes",
      levels: [
        {
          unique_name: "Customer Name",
          secondary_attributes: [
            {
              unique_name: "d_firstname",
              label: "First Name",
              is_hidden: false,
              dataset: "dimcustomer",
              name_column: "firstname",
              key_columns: ["firstname"],
            },
            {
              unique_name: "d_lastname",
              label: "Last Name",
              is_hidden: false,
              dataset: "dimcustomer",
              name_column: "lastname",
              key_columns: ["lastname"],
            },
            {
              unique_name: "Occupation",
              label: "Occupation",
              is_hidden: false,
              folder: "Customer Attributes",
              dataset: "dimcustomer",
              name_column: "occupation",
              key_columns: ["occupation"],
            },
          ],
        },
      ],
    },
  ],
  level_attributes: [
    {
      unique_name: "Customer Name",
      label: "Customer Name",
      description: "Customer Key",
      is_unique_key: true,
      dataset: "dimcustomer",
      name_column: "fullname",
      key_columns: ["customerkey"],
    },
  ],
  relationships: [
    {
      unique_name: "CustomerDimension_GeographyDimension",
      from: {
        hierarchy: "Customer Hierarchy",
        level: "Customer Name",
        dataset: "dimcustomer",
        join_columns: ["geographykey"],
      },
      to: {
        dimension: "Geography Dimension",
        level: "GeoKeyZip",
      },
      type: YamlDimensionRelationType.Embedded,
    },
    {
      unique_name: "CustomerDimension_GeographyDimension_1",
      from: {
        hierarchy: "Customer Hierarchy",
        level: "Customer Name",
        dataset: "dimcustomer",
        join_columns: ["geographykey"],
      },
      to: {
        dimension: "Geography Dimension",
        level: "GeoKeyCity",
      },
      type: YamlDimensionRelationType.Embedded,
    },
    {
      unique_name: "CustomerDimension_GenderDimension",
      from: {
        hierarchy: "Customer Hierarchy",
        level: "Customer Name",
        dataset: "dimcustomer",
        join_columns: ["gender"],
      },
      to: {
        dimension: "Gender Dimension",
        level: "Gender",
      },
      type: YamlDimensionRelationType.Embedded,
    },
  ],
});

const dateDimension = getDimension({
  unique_name: "Date Dimension",
  label: "Date Dimension",
  object_type: ObjectType.Dimension,
  description: "Date Dimension that includes Gregorian, ISO8601 and Retail 445 calendars",
  type: IYamlDimensionType.Time,
  hierarchies: [
    {
      unique_name: "CustomPP445",
      label: "CustomPP445",
      description:
        "A 445 calendar with custom parallel period keys defined for each level.  The underlying data matches the results of the Retail445 hierarchy because the data table contains the standard key assignments generated by the default ParallelPeriod logic.  A real custom ParallelPeriod hierarchy would have different parallel period key assignments to satisfy the reporting business's reporting comparison requirements.",
      folder: "Date Attributes",
      filter_empty: YamlHierarchyEmptyField.Yes,
      levels: [
        {
          unique_name: "customyear",
        },
        {
          unique_name: "customquarter",
          secondary_attributes: [
            {
              unique_name: "d_Custom_Quarter_Of_Year",
              label: "Custom Quarter Of Year",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_quarter_of_year_name",
              key_columns: ["reporting_quarter_of_year_name"],
              sort_column: "reporting_quarter_of_year_name",
            },
          ],
        },
        {
          unique_name: "custommonth",
          secondary_attributes: [
            {
              unique_name: "d_Custom_Month_Name",
              label: "Custom Month Name",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_month_name2",
              key_columns: ["reporting_month_name2"],
              sort_column: "reporting_month_name2",
            },
            {
              unique_name: "d_Custom_Month_Of_Quarter",
              label: "Custom Month Of Quarter",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_month_of_quarter_name",
              key_columns: ["reporting_month_of_quarter_name"],
              sort_column: "reporting_month_of_quarter_name",
            },
            {
              unique_name: "d_Custom_Month_Of_Year",
              label: "Custom Month Of Year",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_month_of_year_name",
              key_columns: ["reporting_month_of_year_name"],
              sort_column: "reporting_month_of_year_name",
            },
          ],
        },
        {
          unique_name: "customweek",
          secondary_attributes: [
            {
              unique_name: "d_Custom_Week_Of_Month",
              label: "Custom Week Of Month",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_week_of_month_name",
              key_columns: ["reporting_week_of_month_name"],
              sort_column: "reporting_week_of_month_name",
            },
            {
              unique_name: "d_Custom_Week_Of_Year",
              label: "Custom Week Of Year",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_week_of_year_name",
              key_columns: ["reporting_week_of_year_name"],
              sort_column: "reporting_week_of_year_name",
            },
          ],
        },
        {
          unique_name: "customday",
          secondary_attributes: [
            {
              unique_name: "d_Custom_Day_Of_Month",
              label: "Custom Day Of Month",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_day_of_month_name",
              key_columns: ["reporting_day_of_month_name"],
              sort_column: "reporting_day_of_month_name",
            },
            {
              unique_name: "d_Custom_Day_Of_Week",
              label: "Custom Day Of Week",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_day_of_week_name",
              key_columns: ["reporting_day_of_week_name"],
              sort_column: "reporting_day_of_week_name",
            },
            {
              unique_name: "d_Custom_Day_Of_Year",
              label: "Custom Day Of Year",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_day_of_year_name",
              key_columns: ["reporting_day_of_year_name"],
              sort_column: "reporting_day_of_year_name",
            },
          ],
        },
      ],
    },
    {
      unique_name: "Date Month Hierarchy",
      label: "Date Month Hierarchy",
      description: "A Gregorian Date Hierarchy.  Organizes time by Year, Quarter, Month, Day.",
      folder: "Date Attributes",
      filter_empty: YamlHierarchyEmptyField.Yes,
      levels: [
        {
          unique_name: "YearMonth",
        },
        {
          unique_name: "Quarter",
          secondary_attributes: [
            {
              unique_name: "d_quarter_number",
              label: "Quarter Number",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "quarter_of_year",
              key_columns: ["quarter_of_year"],
              sort_column: "quarter_of_year",
            },
          ],
        },
        {
          unique_name: "Month1",
          secondary_attributes: [
            {
              unique_name: "d_month_of_year",
              label: "Month Of Year",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "month_of_year",
              key_columns: ["month_of_year"],
              sort_column: "month_of_year",
            },
          ],
        },
        {
          unique_name: "DayMonth",
          secondary_attributes: [
            {
              unique_name: "d_day_of_month",
              label: "Day Of Month",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "day_of_month",
              key_columns: ["day_of_month"],
              sort_column: "day_of_month",
            },
            {
              unique_name: "d_day_of_week_name",
              label: "Day Of Week Name",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "day_of_week_name",
              key_columns: ["day_of_week_name"],
              sort_column: "day_of_week_name",
            },
            {
              unique_name: "d_day_of_week_number",
              label: "Day Of Week Number",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "day_of_week",
              key_columns: ["day_of_week"],
              sort_column: "day_of_week",
            },
            {
              unique_name: "Day_Date",
              label: "Day Date",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "pk_date",
              key_columns: ["pk_date"],
              sort_column: "pk_date",
            },
            {
              unique_name: "W_Day_Date",
              label: "W Day Date",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "pk_date",
              key_columns: ["pk_date"],
              sort_column: "pk_date",
            },
            {
              unique_name: "w_day_of_week_name",
              label: "W Day Of Week Name",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "day_of_week_name",
              key_columns: ["day_of_week_name"],
              sort_column: "day_of_week_name",
            },
            {
              unique_name: "w_day_of_week_number",
              label: "W Day Of Week Number",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "day_of_week",
              key_columns: ["day_of_week"],
              sort_column: "day_of_week",
            },
          ],
        },
      ],
    },
    {
      unique_name: "Date Week Hierarchy",
      label: "Date Week Hierarchy",
      folder: "Date Attributes",
      filter_empty: YamlHierarchyEmptyField.Yes,
      levels: [
        {
          unique_name: "YearWeek",
        },
        {
          unique_name: "Week",
          secondary_attributes: [
            {
              unique_name: "d_week_of_year",
              label: "Week Of Year",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "week_of_year",
              key_columns: ["week_of_year"],
              sort_column: "week_of_year",
            },
          ],
        },
        {
          unique_name: "DayMonth",
        },
      ],
    },
    {
      unique_name: "Retail445",
      label: "Retail445",
      description: "A Retail 4-4-5 calendar",
      folder: "Date Attributes",
      filter_empty: YamlHierarchyEmptyField.Yes,
      levels: [
        {
          unique_name: "ReportIng_Year",
        },
        {
          unique_name: "ReportIng_Half_Year",
          secondary_attributes: [
            {
              unique_name: "Reporting_Half_Year_Of_Year",
              label: "ReportIng Half Year Of Year",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_half_year_of_year_name",
              key_columns: ["reporting_half_year_of_year"],
              sort_column: "reporting_half_year_of_year_name",
            },
          ],
        },
        {
          unique_name: "ReportIng_Quarter",
          secondary_attributes: [
            {
              unique_name: "Reporting_Quarter_Of_Year",
              label: "ReportIng Quarter Of Year",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_quarter_of_year_name",
              key_columns: ["reporting_quarter_of_year"],
              sort_column: "reporting_quarter_of_year_name",
            },
          ],
        },
        {
          unique_name: "ReportIng_Month",
          secondary_attributes: [
            {
              unique_name: "d_Reporting_Month_Name",
              label: "ReportIng Month Name",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_month_name2",
              key_columns: ["reporting_month_name"],
              sort_column: "reporting_month_name2",
            },
            {
              unique_name: "Reporting_Month_Of_Quarter",
              label: "ReportIng Month Of Quarter",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_month_of_quarter_name",
              key_columns: ["reporting_month_of_quarter"],
              sort_column: "reporting_month_of_quarter_name",
            },
            {
              unique_name: "Reporting_Month_Of_Year",
              label: "ReportIng Month Of Year",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_month_of_year_name",
              key_columns: ["reporting_month_of_year"],
              sort_column: "reporting_month_of_year_name",
            },
          ],
        },
        {
          unique_name: "ReportIng_Week",
          secondary_attributes: [
            {
              unique_name: "Reporting_Week_Of_Month",
              label: "ReportIng Week Of Month",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_week_of_month_name",
              key_columns: ["reporting_week_of_month"],
              sort_column: "reporting_week_of_month_name",
            },
            {
              unique_name: "Reporting_Week_Of_Year",
              label: "ReportIng Week Of Year",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_week_of_year_name",
              key_columns: ["reporting_week_of_year"],
              sort_column: "reporting_week_of_year_name",
            },
          ],
        },
        {
          unique_name: "Reporting_Day",
          secondary_attributes: [
            {
              unique_name: "Reporting_Day_Of_Month",
              label: "ReportIng Day Of Month",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_day_of_month_name",
              key_columns: ["reporting_day_of_month"],
              sort_column: "reporting_day_of_month_name",
            },
            {
              unique_name: "Reporting_Day_Of_Week",
              label: "ReportIng Day Of Week",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_day_of_week_name",
              key_columns: ["reporting_day_of_week"],
              sort_column: "reporting_day_of_week_name",
            },
            {
              unique_name: "Reporting_Day_Of_Year",
              label: "ReportIng Day Of Year",
              is_hidden: false,
              folder: "Date Attributes",
              dataset: "DateCustom",
              name_column: "reporting_day_of_year_name",
              key_columns: ["reporting_day_of_year"],
              sort_column: "reporting_day_of_year_name",
            },
          ],
        },
      ],
    },
  ],
  level_attributes: [
    {
      unique_name: "customday",
      label: "Custom Day",
      description:
        "A 445 calendar with custom parallel period keys defined for each level.  The underlying data matches the results of the Retail445 hierarchy because the data table contains the standard key assignments generated by the default ParallelPeriod logic.  A real custom ParallelPeriod hierarchy would have different parallel period key assignments to satisfy the reporting business's reporting comparison requirements.",
      is_unique_key: true,
      dataset: "DateCustom",
      name_column: "reporting_day",
      key_columns: ["datekey"],
      sort_column: "datekey",
      time_unit: YamlDimensionTimeUnit.Day,
    },
    {
      unique_name: "custommonth",
      label: "Custom Month",
      description: "Same as [Retail445].[Reporting Month] but has a custom parallel period key.",
      dataset: "DateCustom",
      name_column: "reporting_month_name2",
      key_columns: ["reporting_month"],
      sort_column: "reporting_month",
      time_unit: YamlDimensionTimeUnit.Month,
    },
    {
      unique_name: "customquarter",
      label: "Custom Quarter",
      description: "Same as [Retail445].[Reporting Quarter] but has a custom parallel period key.",
      dataset: "DateCustom",
      name_column: "reporting_quarter_name",
      key_columns: ["reporting_quarter"],
      sort_column: "reporting_quarter",
      time_unit: YamlDimensionTimeUnit.Quarter,
    },
    {
      unique_name: "customweek",
      label: "Custom Week",
      description: "Same as [Retail445].[Reporting Week] but has a custom parallel period key.",
      dataset: "DateCustom",
      name_column: "reporting_week_name",
      key_columns: ["reporting_week"],
      sort_column: "reporting_week",
      time_unit: YamlDimensionTimeUnit.Week,
    },
    {
      unique_name: "customyear",
      label: "Custom Year",
      description: "Same as [Retail445].[Reporting Year] but has a custom parallel period key.",
      dataset: "DateCustom",
      name_column: "reporting_year_name",
      key_columns: ["reporting_year"],
      sort_column: "reporting_year",
      time_unit: YamlDimensionTimeUnit.Year,
    },
    {
      unique_name: "DayMonth",
      label: "Day",
      description: "Day level of standard calendar Month Hierarchy",
      is_unique_key: true,
      dataset: "DateCustom",
      name_column: "date_name",
      key_columns: ["datekey"],
      sort_column: "datekey",
      time_unit: YamlDimensionTimeUnit.Day,
    },
    {
      unique_name: "Month1",
      label: "Month",
      dataset: "DateCustom",
      name_column: "month_name",
      key_columns: ["month"],
      sort_column: "month",
      time_unit: YamlDimensionTimeUnit.Month,
    },
    {
      unique_name: "Quarter",
      label: "Quarter",
      dataset: "DateCustom",
      name_column: "quarter_name",
      key_columns: ["quarter"],
      sort_column: "quarter",
      time_unit: YamlDimensionTimeUnit.Quarter,
    },
    {
      unique_name: "Reporting_Day",
      label: "Reporting Day",
      description: "A Retail 4-4-5 calendar",
      is_unique_key: true,
      dataset: "DateCustom",
      name_column: "reporting_day",
      key_columns: ["datekey"],
      sort_column: "datekey",
      time_unit: YamlDimensionTimeUnit.Day,
    },
    {
      unique_name: "ReportIng_Half_Year",
      label: "ReportIng Half Year",
      dataset: "DateCustom",
      name_column: "reporting_half_year_name",
      key_columns: ["reporting_half_year"],
      sort_column: "reporting_half_year",
      time_unit: YamlDimensionTimeUnit.HalfYear,
    },
    {
      unique_name: "ReportIng_Month",
      label: "ReportIng Month",
      dataset: "DateCustom",
      name_column: "reporting_month_name2",
      key_columns: ["reporting_month"],
      sort_column: "reporting_month",
      time_unit: YamlDimensionTimeUnit.Month,
    },
    {
      unique_name: "ReportIng_Quarter",
      label: "ReportIng Quarter",
      dataset: "DateCustom",
      name_column: "reporting_quarter_name",
      key_columns: ["reporting_quarter"],
      sort_column: "reporting_quarter",
      time_unit: YamlDimensionTimeUnit.Quarter,
    },
    {
      unique_name: "ReportIng_Week",
      label: "ReportIng Week",
      description: "Week level of the 4-4-5 calendar",
      dataset: "DateCustom",
      name_column: "reporting_week_name",
      key_columns: ["reporting_week"],
      sort_column: "reporting_week",
      time_unit: YamlDimensionTimeUnit.Week,
    },
    {
      unique_name: "ReportIng_Year",
      label: "ReportIng Year",
      dataset: "DateCustom",
      name_column: "reporting_year_name",
      key_columns: ["reporting_year"],
      sort_column: "reporting_year",
      time_unit: YamlDimensionTimeUnit.Year,
    },
    {
      unique_name: "Week",
      label: "Week",
      dataset: "DateCustom",
      name_column: "week_name",
      key_columns: ["week"],
      sort_column: "week",
      time_unit: YamlDimensionTimeUnit.Week,
    },
    {
      unique_name: "YearMonth",
      label: "Year",
      description: "Year level of the Standard Calendar Month Hierarchy.",
      dataset: "DateCustom",
      name_column: "year_name",
      key_columns: ["year"],
      sort_column: "year",
      time_unit: YamlDimensionTimeUnit.Year,
    },
    {
      unique_name: "YearWeek",
      label: "Year",
      dataset: "DateCustom",
      name_column: "year_name",
      key_columns: ["year"],
      sort_column: "year",
      time_unit: YamlDimensionTimeUnit.Year,
    },
  ],
});

const genderDimension = getDimension({
  unique_name: "Gender Dimension",
  label: "Gender Dimension",
  object_type: ObjectType.Dimension,
  hierarchies: [
    {
      unique_name: "Gender Hierarchy",
      label: "Gender Hierarchy",
      folder: "Customer Attributes",
      levels: [
        {
          unique_name: "Gender",
        },
      ],
    },
  ],
  level_attributes: [
    {
      unique_name: "Gender",
      label: "Gender",
      is_unique_key: true,
      dataset: "dimgender",
      name_column: "gendername",
      key_columns: ["genderkey"],
    },
  ],
});

const geographyDimension = getDimension({
  unique_name: "Geography Dimension",
  label: "Geography Dimension",
  object_type: ObjectType.Dimension,
  hierarchies: [
    {
      unique_name: "Geography City",
      label: "Geography City",
      folder: "Customer Attributes",
      levels: [
        {
          unique_name: "CountryCity",
        },
        {
          unique_name: "State",
        },
        {
          unique_name: "City",
          secondary_attributes: [
            {
              unique_name: "d_city",
              label: "City",
              is_hidden: false,
              dataset: "dim_geo_city",
              name_column: "city",
              key_columns: ["city"],
            },
          ],
        },
        {
          unique_name: "GeoKeyCity",
          is_hidden: true,
        },
      ],
    },
    {
      unique_name: "Geography Zip",
      label: "Geography Zip",
      folder: "Customer Attributes",
      levels: [
        {
          unique_name: "CountryZip",
        },
        {
          unique_name: "Zip Code",
          secondary_attributes: [
            {
              unique_name: "d_postalcode",
              label: "Postal Code",
              is_hidden: false,
              dataset: "dim_geo_postalcode",
              name_column: "postalcode",
              key_columns: ["postalcode"],
            },
          ],
        },
        {
          unique_name: "GeoKeyZip",
          is_hidden: true,
        },
      ],
    },
  ],
  level_attributes: [
    {
      unique_name: "City",
      label: "City",
      dataset: "dim_geo_city",
      name_column: "citystatekey",
      key_columns: ["statekey", "city"],
    },
    {
      unique_name: "CountryCity",
      label: "Country",
      is_unique_key: true,
      dataset: "dim_geo_country",
      name_column: "country",
      key_columns: ["country"],
    },
    {
      unique_name: "CountryZip",
      label: "Country",
      dataset: "dim_geo_country",
      name_column: "country",
      key_columns: ["country"],
    },
    {
      unique_name: "GeoKeyCity",
      label: "GeoKey",
      is_hidden: true,
      is_unique_key: true,
      dataset: "dim_geo_city",
      name_column: "geographykey",
      key_columns: ["geographykey"],
    },
    {
      unique_name: "GeoKeyZip",
      label: "GeoKey",
      is_hidden: true,
      is_unique_key: true,
      dataset: "dim_geo_postalcode",
      name_column: "geographykey",
      key_columns: ["geographykey"],
    },
    {
      unique_name: "State",
      label: "State",
      is_unique_key: true,
      dataset: "dim_geo_state",
      name_column: "state",
      key_columns: ["statekey"],
    },
    {
      unique_name: "Zip Code",
      label: "Zip Code",
      is_unique_key: true,
      dataset: "dim_geo_postalcode",
      name_column: "countrypostalcode",
      key_columns: ["country", "postalcode"],
    },
  ],
  relationships: [
    {
      from: {
        dataset: "dim_geo_city",
        join_columns: ["statekey"],
      },
      to: {
        level: "State",
      },
      type: YamlDimensionRelationType.Snowflake,
    },
    {
      from: {
        dataset: "dim_geo_postalcode",
        join_columns: ["country"],
      },
      to: {
        level: "CountryZip",
      },
      type: YamlDimensionRelationType.Snowflake,
    },
    {
      from: {
        dataset: "dim_geo_state",
        join_columns: ["country"],
      },
      to: {
        level: "CountryCity",
      },
      type: YamlDimensionRelationType.Snowflake,
    },
    {
      unique_name: "dim_geo_postalcode_country_to_Row Level Security by Region",
      from: {
        dataset: "dim_geo_postalcode",
        hierarchy: "Geography Zip",
        join_columns: ["country"],
        level: "GeoKeyZip",
      },
      to: {
        row_security: "Row Level Security by Region",
      },
      type: YamlDimensionRelationType.Embedded,
    },
  ],
});

const styleDimension = getDimension({
  unique_name: "Style Dimension",
  label: "Style Dimension",
  object_type: ObjectType.Dimension,
  description: "Product Style",
  is_degenerate: true,
  hierarchies: [
    {
      unique_name: "Style hierarchy",
      label: "Style",
      folder: "Product Attributes",
      levels: [
        {
          unique_name: "Style",
        },
      ],
    },
  ],
  level_attributes: [
    {
      unique_name: "Style",
      label: "Style",
      description: "Product Style",
      dataset: "factinternetsales",
      name_column: "style",
      key_columns: ["style"],
    },
  ],
});

const sizeDimension = getDimension({
  unique_name: "Size Dimension",
  label: "Size Dimension",
  object_type: ObjectType.Dimension,
  description: "Product Size",
  is_degenerate: true,
  hierarchies: [
    {
      unique_name: "Size hierarchy",
      label: "Size",
      folder: "Product Attributes",
      levels: [
        {
          unique_name: "Size",
        },
      ],
    },
  ],
  level_attributes: [
    {
      unique_name: "Size",
      label: "Size",
      dataset: "factinternetsales",
      name_column: "size",
      key_columns: ["size"],
    },
  ],
});

const allDimensions = {
  orderDimension,
  productDimension,
  weightDimension,
  colorDimension,
  customerDimension,
  dateDimension,
  genderDimension,
  geographyDimension,
  styleDimension,
  sizeDimension,
};

export const dimensions = getAggregatedResult<IYamlDimension, typeof allDimensions>(allDimensions);
