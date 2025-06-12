import {
  SMLObject,
  SMLCalculationMethod,
  SMLObjectType,
  SMLColumnDataType,
  SMLDimensionType,
  SMLDimensionRelationType,
  SMLDimensionTimeUnit,
  SMLHierarchyEmptyField,
} from 'sml-sdk'

import YamlCalculatedMeasureBuilder from "../models/src/builders/YamlObjectBuilders/YamlCalculatedMeasureBuilder";
import YamlCatalogBuilder from "../models/src/builders/YamlObjectBuilders/YamlCatalogBuilder";
import YamlCompositeModelBuilder from "../models/src/builders/YamlObjectBuilders/YamlCompositeModelBuilder";
import YamlDatasetBuilder from "../models/src/builders/YamlObjectBuilders/YamlDatasetBuilder";
import YamlDimensionBuilder from "../models/src/builders/YamlObjectBuilders/YamlDimensionBuilder";
import YamlMeasureBuilder from "../models/src/builders/YamlObjectBuilders/YamlMeasureBuilder";
import YamlModelBuilder from "../models/src/builders/YamlObjectBuilders/YamlModelBuilder";
import YamlModelRelationBuilder from "../models/src/builders/YamlObjectBuilders/YamlModelRelationBuilder";
import IYamlParsedFile from "../models/src/IYamlParsedFile";
// import { ObjectType } from "../models/src/ObjectType";
// import { YamlColumnDataType } from "../models/src/yaml/IYamlDataset";
// import {
//   IYamlDimensionType,
//   YamlDimensionRelationType,
//   YamlDimensionTimeUnit,
//   YamlHierarchyEmptyField,
// } from "../models/src/yaml/IYamlDimension";
// import { CalculationMethod } from "../models/src/yaml/IYamlMeasure";
// import { IYamlObject } from "../../../models/src/yaml/IYamlObject";

import { testConstants } from "./tools";

export default class StaticModelFiles {
  public static getStaticCatalogFiles(asCatalogName: string): IYamlParsedFile<SMLObject>[] {
    const result = new Array<IYamlParsedFile<SMLObject>>();

    const catalog = YamlCatalogBuilder.create()
      .with({
        version: 1.0,
        label: asCatalogName + " Catalog",
        object_type: SMLObjectType.Catalog,
        unique_name: asCatalogName,
        aggressive_agg_promotion: false,
        build_speculative_aggs: false,
      })
      .buildYamlFile();
    result.push(catalog);

    // result.addModel(
    const model = YamlModelBuilder.create()
      .uniqueName(testConstants.MODEL_NAME) // + ".model")
      .with({
        label: testConstants.MODEL_NAME,
      })
      .addRelationship(
        YamlModelRelationBuilder.create()
          .addFrom({ dataset: "factinternetsales", join_columns: ["orderdatekey"] })
          .addTo({ dimension: "Date Dimension", level: "DayMonth" })
          .withName("factinternetsales_Date_Dimension")
          .with({ role_play: "Order {0}" })
          .build()
      )
      .addRelationship(
        YamlModelRelationBuilder.create()
          .addFrom({ dataset: "factinternetsales", join_columns: ["customerkey"] })
          .addTo({ dimension: "Customer Dimension", level: "_Customer Name (^%123) in $" })
          .withName("factinternetsales_Customer_Dimension_First")
          .build()
      )
      .addMetric("salesamount1")
      .addMetric("orderquantity1")
      .addMetric("_calculated tax 9% in $")
      .addMetric("Average Sales per Order")
      .addMetric("% Orders Created")
      .addMetric("Orders Created")
      .buildYamlFile();
    result.push(model);

    const model2 = YamlModelBuilder.create()
      .uniqueName(testConstants.SECOND_MODEL_NAME)
      .with({
        label: testConstants.SECOND_MODEL_NAME,
      })
      .addRelationship(
        YamlModelRelationBuilder.create()
          .addFrom({ dataset: "factdemotab", join_columns: ["customerkey"] })
          .addTo({ dimension: "Customer Dimension", level: "_Customer Name (^%123) in $" })
          .withName("factdemotab_Customer_Dimension")
          .build()
      )
      .addMetric("m_taxamt_sum")
      .buildYamlFile();
    result.push(model2);

    const compModel = YamlCompositeModelBuilder.create()
      .uniqueName(testConstants.COMPOSITE_MODEL_NAME)
      .with({
        label: testConstants.COMPOSITE_MODEL_NAME,
      })
      .addModel(testConstants.MODEL_NAME)
      .addModel(testConstants.SECOND_MODEL_NAME)
      .addMetric("Average Sales per Order")
      .addMetric("% Orders Created")
      .buildYamlFile();
    result.push(compModel);

    const timeDim = YamlDimensionBuilder.create()
      .uniqueName("Date Dimension")
      .with({
        label: "Date Dimension",
        description: "Date Dimension for ISO8601 calendar with 2 hierarchies",
        type: SMLDimensionType.Time,
      })
      .addLevelAttribute({
        unique_name: "YearMonth",
        label: "Year",
        description: "Year level of the Standard Calendar Month Hierarchy",
        dataset: "dim_time_dataset",
        name_column: "year_name",
        key_columns: ["year"],
        time_unit: SMLDimensionTimeUnit.Year,
      })
      .addLevelAttribute({
        unique_name: "Quarter",
        label: "Quarter",
        dataset: "dim_time_dataset",
        name_column: "quarter_name",
        key_columns: ["quarter"],
        sort_column: "quarter",
        time_unit: SMLDimensionTimeUnit.Quarter,
      })
      .addLevelAttribute({
        unique_name: "Month1",
        label: "Month",
        dataset: "dim_time_dataset",
        name_column: "month_name",
        key_columns: ["month"],
        sort_column: "month",
        time_unit: SMLDimensionTimeUnit.Month,
      })
      .addLevelAttribute({
        unique_name: "DayMonth",
        label: "Day",
        description: "Day level of standard calendar Month Hierarchy",
        is_unique_key: true,
        dataset: "dim_time_dataset",
        name_column: "date_name",
        key_columns: ["pk_date"],
        sort_column: "pk_date",
        allowed_calcs_for_dma: ["Siblings", "ParallelPeriod", "Ancestor", "Descendants", "PeriodsToDate"],
        time_unit: SMLDimensionTimeUnit.Day,
      })
      .addLevelAttribute({
        unique_name: "YearWeek",
        label: "Year",
        dataset: "dim_time_dataset",
        name_column: "year_name",
        key_columns: ["year"],
        sort_column: "year",
        time_unit: SMLDimensionTimeUnit.Year,
      })
      .addLevelAttribute({
        unique_name: "Week",
        label: "Week",
        dataset: "dim_time_dataset",
        name_column: "week_name",
        key_columns: ["week"],
        sort_column: "week",
        time_unit: SMLDimensionTimeUnit.Week,
      })
      .addLevelAttribute({
        unique_name: "DayWeek",
        label: "Day",
        dataset: "dim_time_dataset",
        name_column: "date_name",
        key_columns: ["pk_date"],
        sort_column: "pk_date",
      })
      .addHierarchy({
        unique_name: "Date Month Hierarchy",
        label: "Date Month Hierarchy",
        description: "A Gregorian Date Hierarchy.  Organizes time by Year, Quarter, Month, Day",
        folder: "Date Attributes",
        filter_empty: SMLHierarchyEmptyField.Yes,
        levels: [
          { unique_name: "YearMonth" },
          {
            unique_name: "Quarter",
            secondary_attributes: [
              {
                unique_name: "d_quarter_number",
                label: "Quarter Number",
                is_hidden: false,
                folder: "Date Attributes",
                dataset: "dim_time_dataset",
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
                unique_name: "d_month_start",
                label: "Month Start",
                folder: "Date Attributes",
                dataset: "dim_time_dataset",
                name_column: "month",
                key_columns: ["month"],
              },
            ],
          },
          {
            unique_name: "DayMonth",
            secondary_attributes: [
              {
                unique_name: "d_day_of_week_number",
                label: "Day Of Week Number",
                is_hidden: false,
                folder: "Date Attributes",
                // associated_hierarchy: "Date Month Hierarchy",
                dataset: "dim_time_dataset",
                name_column: "day_of_week",
                key_columns: ["day_of_week"],
                sort_column: "day_of_week",
              },
              {
                unique_name: "d_day_of_week_name",
                label: "Day Of Week Name",
                is_hidden: false,
                folder: "Date Attributes",
                // associated_hierarchy: "Date Month Hierarchy",
                dataset: "dim_time_dataset",
                name_column: "day_of_week_name",
                key_columns: ["day_of_week_name"],
                sort_column: "day_of_week",
              },
              {
                unique_name: "Day_Date",
                label: "Day Date",
                is_hidden: false,
                folder: "Date Attributes",
                // associated_hierarchy: "Date Month Hierarchy",
                dataset: "dim_time_dataset",
                name_column: "pk_date",
                key_columns: ["pk_date"],
                sort_column: "pk_date",
              },
              {
                unique_name: "w_day_of_week_name",
                label: "W Day Of Week Name",
                is_hidden: false,
                folder: "Date Attributes",
                // associated_hierarchy: "Date Month Hierarchy",
                dataset: "dim_time_dataset",
                name_column: "day_of_week_name",
                key_columns: ["day_of_week_name"],
                sort_column: "day_of_week_name",
              },
              {
                unique_name: "w_day_of_week_number",
                label: "W Day Of Week Number",
                is_hidden: false,
                folder: "Date Attributes",
                // associated_hierarchy: "Date Month Hierarchy",
                dataset: "dim_time_dataset",
                name_column: "day_of_week",
                key_columns: ["day_of_week"],
                sort_column: "day_of_week",
              },
              {
                unique_name: "W_Day_Date",
                label: "W Day Date",
                is_hidden: false,
                folder: "Date Attributes",
                // associated_hierarchy: "Date Month Hierarchy",
                dataset: "dim_time_dataset",
                name_column: "pk_date",
                key_columns: ["pk_date"],
                sort_column: "pk_date",
              },
            ],
          },
        ],
      })
      .addHierarchy({
        unique_name: "Date Week Hierarchy",
        label: "Date Week Hierarchy",
        folder: "Date Attributes",
        filter_empty: SMLHierarchyEmptyField.Yes,
        levels: [
          { unique_name: "YearWeek" },
          {
            unique_name: "Week",
            secondary_attributes: [
              {
                unique_name: "d_week_of_year",
                label: "Week Of Year",
                is_hidden: false,
                folder: "Date Attributes",
                // associated_hierarchy: "Date Month Hierarchy",
                dataset: "dim_time_dataset",
                name_column: "week_of_year",
                key_columns: ["week_of_year"],
                sort_column: "week_of_year",
              },
            ],
          },
          { unique_name: "DayMonth" },
        ],
      })
      .buildYamlFile();
    result.push(timeDim);

    const customerDim = YamlDimensionBuilder.create()
      .uniqueName("Customer Dimension")
      .with({ label: "Customer Dimension" })
      .addHierarchy({
        unique_name: "Customer Hierarchy",
        label: "Customer Hierarchy",
        folder: "Customer Attributes",
        levels: [
          {
            unique_name: "_Customer Name (^%123) in $",
            secondary_attributes: [
              {
                unique_name: "d_firstname",
                label: "First Name",
                dataset: "dimcustomer",
                key_columns: ["firstname"],
                name_column: "firstname",
              },
              {
                unique_name: "orders_created",
                label: "Orders Created by Customer",
                dataset: "dimcustomer",
                key_columns: ["lastname"],
                name_column: "lastname",
              },
            ], // secondary_attributes: createOthers(rightSemanticModel.dimensions, dbt_tools_1.DbtTools.dsName(rightModelName), rightEntity.name),
            aliases: [
              {
                unique_name: "d_firstname_alias",
                label: "First Name Alias",
                dataset: "dimcustomer",
                name_column: "firstname",
              },
            ],
            metrics: [
              {
                unique_name: "m_geokey_avg",
                label: "Average Key",
                dataset: "dimcustomer",
                column: "geographykey",
                calculation_method: SMLCalculationMethod.Average,
              },
            ], // secondary_attributes: createOthers(rightSemanticModel.dimensions, dbt_tools_1.DbtTools.dsName(rightModelName), rightEntity.name),
          },
        ],
      })
      .addLevelAttribute({
        unique_name: "_Customer Name (^%123) in $",
        label: "Customer Name",
        is_unique_key: true,
        dataset: "dimcustomer",
        key_columns: ["customerkey"],
        name_column: "fullname",
      })
      .addRelationship({
        unique_name: "CustomerDimension_GenderDimension",
        from: {
          hierarchy: "Customer Hierarchy",
          level: "_Customer Name (^%123) in $",
          dataset: "dimcustomer",
          join_columns: ["gender"],
        },
        to: {
          dimension: "Gender Dimension",
          level: "Gender",
        },
        type: SMLDimensionRelationType.Embedded,
      })
      .buildYamlFile();
    result.push(customerDim);

    const genderDim = YamlDimensionBuilder.create()
      .uniqueName("Gender Dimension")
      .with({ label: "Gender Dimension" })
      .addHierarchy({
        unique_name: "Gender Hierarchy",
        label: "Gender Hierarchy",
        folder: "Customer Attributes",
        levels: [
          {
            unique_name: "Gender",
          },
        ],
      })
      .addLevelAttribute({
        unique_name: "Gender",
        label: "Gender",
        dataset: "dimgender",
        key_columns: ["genderkey"],
        name_column: "gendername",
      })
      .buildYamlFile();
    result.push(genderDim);

    const productDim = YamlDimensionBuilder.create()
      .uniqueName("Product Dimension")
      .with({ label: "Product Dimension" })
      .addHierarchy({
        unique_name: "Product Hierarchy",
        label: "Product Hierarchy",
        levels: [
          {
            unique_name: "Product Name",
          },
        ],
      })
      .addLevelAttribute({
        unique_name: "Product Name",
        label: "Product Name",
        dataset: "dimproduct",
        key_columns: ["productkey"],
        name_column: "productkey",
      })
      .buildYamlFile();
    result.push(productDim);

    const factDataset = YamlDatasetBuilder.create()
      .uniqueName("factinternetsales")
      .setSource({ table: "factinternetsales" })
      // .withConnection()
      .with({ label: "factinternetsales" })
      .addColumn("customerkey", SMLColumnDataType.Long)
      .addColumn("productkey", SMLColumnDataType.Long)
      .addColumn("orderdate", SMLColumnDataType.String)
      .addColumn("orderdatekey", SMLColumnDataType.Long)
      .addColumn("orderquantity", SMLColumnDataType.Long)
      .addColumn("salesamount", SMLColumnDataType.Double)
      .buildYamlFile();
    result.push(factDataset);

    const fact2Dataset = YamlDatasetBuilder.create()
      .uniqueName("factdemotab")
      .setSource({ table: "factdemotab" })
      .with({ label: "factdemotab" })
      .addColumn("customerkey", SMLColumnDataType.Long)
      .addColumn("productkey", SMLColumnDataType.Long)
      .addColumn("salesordernumber", SMLColumnDataType.String)
      .addColumn("taxamt", SMLColumnDataType.Double)
      .buildYamlFile();
    result.push(fact2Dataset);

    const meas1 = YamlMeasureBuilder.create()
      .uniqueName("salesamount1")
      .with({
        label: "Sales Amount",
        calculation_method: SMLCalculationMethod.Sum,
        dataset: "factinternetsales",
        column: "salesamount",
      })
      .buildYamlFile();
    result.push(meas1);

    const meas2 = YamlMeasureBuilder.create()
      .uniqueName("orderquantity1")
      .with({
        label: "Order Quantity",
        calculation_method: SMLCalculationMethod.Sum,
        dataset: "factinternetsales",
        column: "orderquantity",
      })
      .buildYamlFile();
    result.push(meas2);

    const meas3 = YamlMeasureBuilder.create()
      .uniqueName("% Orders Created")
      .with({
        label: "Percentage of Orders Created",
        calculation_method: SMLCalculationMethod.Maximum,
        dataset: "factinternetsales",
        column: "orderquantity",
      })
      .buildYamlFile();
    result.push(meas3);

    const meas4 = YamlMeasureBuilder.create()
      .uniqueName("Orders Created")
      .with({
        label: "Orders Created",
        calculation_method: SMLCalculationMethod.Minimum,
        dataset: "factinternetsales",
        column: "orderquantity",
      })
      .buildYamlFile();
    result.push(meas4);

    const meas5 = YamlMeasureBuilder.create()
      .uniqueName("_calculated tax 9% in $")
      .with({
        label: "Calculated Tax 9% in $",
        calculation_method: SMLCalculationMethod.Sum,
        dataset: "factinternetsales",
        column: "Calculated Tax",
      })
      .buildYamlFile();
    result.push(meas5);

    // result.addMeasures(
    const meas6 = YamlMeasureBuilder.create()
      .uniqueName("m_taxamt_sum")
      .with({
        label: "Tax Amount",
        calculation_method: SMLCalculationMethod.Sum,
        dataset: "factdemotab",
        column: "taxamt",
      })
      .buildYamlFile();
    result.push(meas6);

    const calc = YamlCalculatedMeasureBuilder.create()
      .uniqueName("Average Sales per Order")
      .with({
        label: "Average Sales per Order",
        expression: "([Measures].[Sales_Amount_1] / [Measures].[orderquantity1])",
      })
      .buildYamlFile();
    result.push(calc);

    return result;
  }
}
