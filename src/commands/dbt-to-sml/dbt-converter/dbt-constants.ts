import {
  SMLColumnDataType,
  SMLConnection,
  SMLDataset,
  SMLDimension,
  SMLDimensionTimeUnit,
  SMLDimensionType,
  SMLHierarchyEmptyField,
  SMLModel,
  SMLObjectType,
} from "sml-sdk";

import { DWType } from "../../../shared/dw-types";
import { SmlConvertResultBuilder } from "../../../shared/sml-convert-result";
import { DbtTools } from "./dbt-tools";

export class DbtConstants {
  static timeDimension() {
    const dimDate: SMLDimension = {
      object_type: SMLObjectType.Dimension,
      unique_name: "Date Dimension",
      label: "Date Dimension",
      description: "Date Dimension for ISO8601 calendar with 2 hierarchies",
      type: SMLDimensionType.Time,
      level_attributes: [
        {
          unique_name: "YearMonth",
          label: "Year",
          description: "Year level of the Standard Calendar Month Hierarchy",
          dataset: "dim_time_dataset",
          name_column: "year_name",
          key_columns: ["year"],
          time_unit: SMLDimensionTimeUnit.Year,
        },
        {
          unique_name: "Quarter",
          label: "Quarter",
          dataset: "dim_time_dataset",
          name_column: "quarter_name",
          key_columns: ["quarter"],
          sort_column: "quarter",
          time_unit: SMLDimensionTimeUnit.Quarter,
        },
        {
          unique_name: "Month1",
          label: "Month",
          dataset: "dim_time_dataset",
          name_column: "month_name",
          key_columns: ["month"],
          sort_column: "month",
          time_unit: SMLDimensionTimeUnit.Month,
        },
        {
          unique_name: "DayMonth",
          label: "Day",
          description: "Day level of standard calendar Month Hierarchy",
          is_unique_key: true,
          dataset: "dim_time_dataset",
          name_column: "date_name",
          key_columns: ["pk_date"],
          sort_column: "pk_date",
          allowed_calcs_for_dma: [
            "Siblings",
            "ParallelPeriod",
            "Ancestor",
            "Descendants",
            "PeriodsToDate",
          ],
          time_unit: SMLDimensionTimeUnit.Day,
        },
        {
          unique_name: "YearWeek",
          label: "Year",
          dataset: "dim_time_dataset",
          name_column: "year_name",
          key_columns: ["year"],
          sort_column: "year",
          time_unit: SMLDimensionTimeUnit.Year,
        },
        {
          unique_name: "Week",
          label: "Week",
          dataset: "dim_time_dataset",
          name_column: "week_name",
          key_columns: ["week"],
          sort_column: "week",
          time_unit: SMLDimensionTimeUnit.Week,
        },
      ],
      hierarchies: [
        {
          unique_name: "Date Month Hierarchy",
          label: "Date Month Hierarchy",
          description:
            "A Gregorian Date Hierarchy.  Organizes time by Year, Quarter, Month, Day",
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
        },
        {
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
        },
      ],
    };

    return dimDate;
  }

  static timeDataset(
    connection: SMLConnection,
    dbType: DWType,
    identifiersNameUpper: boolean,
  ): SMLDataset {
    const dsName = "dim_time";
    const dateColumns = {
      date_day: "date_day",
      name: "name",
      pk_date: "pk_date",
      datekey: "datekey",
      date_name: "date_name",
      year: "year",
      year_name: "year_name",
      half_year: "half_year",
      half_year_name: "half_year_name",
      quarter: "quarter",
      quarter_name: "quarter_name",
      month: "month",
      month_name: "month_name",
      week: "week",
      week_name: "week_name",
      day_of_year: "day_of_year",
      day_of_year_name: "day_of_year_name",
      day_of_week: "day_of_week",
      day_of_week_name: "day_of_week_name",
      week_of_year: "week_of_year",
      week_of_year_name: "week_of_year_name",
      month_of_year: "month_of_year",
      month_of_year_name: "month_of_year_name",
      quarter_of_year: "quarter_of_year",
      quarter_of_year_name: "quarter_of_year_name",
    };
    const dateColumnsUpper = {
      date_day: "DATE_DAY",
      name: "NAME",
      pk_date: "PK_DATE",
      datekey: "DATEKEY",
      date_name: "DATE_NAME",
      year: "YEAR",
      year_name: "YEAR_NAME",
      half_year: "HALF_YEAR",
      half_year_name: "HALF_YEAR_NAME",
      quarter: "QUARTER",
      quarter_name: "QUARTER_NAME",
      month: "MONTH",
      month_name: "MONTH_NAME",
      week: "WEEK",
      week_name: "WEEK_NAME",
      day_of_year: "DAY_OF_YEAR",
      day_of_year_name: "DAY_OF_YEAR_NAME",
      day_of_week: "DAY_OF_WEEK",
      day_of_week_name: "DAY_OF_WEEK_NAME",
      week_of_year: "WEEK_OF_YEAR",
      week_of_year_name: "WEEK_OF_YEAR_NAME",
      month_of_year: "MONTH_OF_YEAR",
      month_of_year_name: "MONTH_OF_YEAR_NAME",
      quarter_of_year: "QUARTER_OF_YEAR",
      quarter_of_year_name: "QUARTER_OF_YEAR_NAME",
    };

    if (dbType.localeCompare("bigquery") == 0) {
      const sql = `SELECT TIMESTAMP(${dateColumns.date_day}) as ${dateColumns.pk_date},
        cast(FORMAT_DATE("%Y%m%d", ${dateColumns.date_day}) as decimal) as ${dateColumns.datekey},
        FORMAT_DATE('%A, %B %d, %Y', ${dateColumns.date_day}) as ${dateColumns.date_name},
        CAST(EXTRACT(YEAR from ${dateColumns.date_day}) AS STRING) as ${dateColumns.year},
        concat("Calendar ",FORMAT_DATE('%Y', ${dateColumns.date_day})) as ${dateColumns.year_name},
        IF(EXTRACT(QUARTER FROM ${dateColumns.date_day}) < 3, DATE_TRUNC(${dateColumns.date_day},YEAR), DATE_ADD(DATE_TRUNC(${dateColumns.date_day},YEAR), INTERVAL 2 QUARTER)) as ${dateColumns.half_year},
        IF(EXTRACT(QUARTER FROM ${dateColumns.date_day}) < 3, concat("Semester 1, ",FORMAT_DATE('%Y', ${dateColumns.date_day})), concat("Semester 2, ", FORMAT_DATE('%Y', ${dateColumns.date_day}))) as ${dateColumns.half_year_name},
        DATE_TRUNC(${dateColumns.date_day}, QUARTER) as ${dateColumns.quarter},
        FORMAT_DATE('Quarter %Q, %Y', ${dateColumns.date_day}) as ${dateColumns.quarter_name},
        DATE_TRUNC(${dateColumns.date_day}, MONTH) as ${dateColumns.month},
        FORMAT_DATE('%B %Y', ${dateColumns.date_day}) as ${dateColumns.month_name},
        DATE_TRUNC(${dateColumns.date_day}, WEEK) as ${dateColumns.week},
        concat("Week ", EXTRACT(WEEK from ${dateColumns.date_day}), FORMAT_DATE(', %Y', ${dateColumns.date_day})) as ${dateColumns.week_name},
        EXTRACT(DAYOFYEAR from ${dateColumns.date_day}) as ${dateColumns.day_of_year},
        concat("Day ", EXTRACT(DAYOFYEAR from ${dateColumns.date_day})) as ${dateColumns.day_of_year_name},
        EXTRACT(DAYOFWEEK from ${dateColumns.date_day}) as ${dateColumns.day_of_week},
        FORMAT_DATE('%a', ${dateColumns.date_day}) as ${dateColumns.day_of_week_name},
        EXTRACT(WEEK from ${dateColumns.date_day}) as ${dateColumns.week_of_year},
        concat("Week ", EXTRACT(WEEK from ${dateColumns.date_day})) as ${dateColumns.week_of_year_name},
        EXTRACT(MONTH from ${dateColumns.date_day}) as ${dateColumns.month_of_year},
        FORMAT_DATE('%B', ${dateColumns.date_day}) as ${dateColumns.month_of_year_name},
        EXTRACT(QUARTER from ${dateColumns.date_day}) as ${dateColumns.quarter_of_year},
        concat("Quarter ", EXTRACT(QUARTER from ${dateColumns.date_day})) as ${dateColumns.quarter_of_year_name}
        FROM ${connection.schema}.metricflow_time_spine`;
      return getTimeDatasetDefinition(dsName, sql, connection.unique_name);
    }

    if (dbType.localeCompare("snowflake") == 0) {
      let sql = "";
      if (identifiersNameUpper) {
        sql = `SELECT ${dateColumnsUpper.date_day}::TIMESTAMP as ${dateColumnsUpper.pk_date},
          cast(to_char(${dateColumnsUpper.date_day}, '%Y%m%d') as decimal) as ${dateColumnsUpper.datekey},
          to_char(${dateColumnsUpper.date_day}, '%A, %B %d, %Y') as ${dateColumnsUpper.date_name},
          CAST(EXTRACT(YEAR from ${dateColumnsUpper.date_day}) AS STRING) as ${dateColumnsUpper.year},
          concat('Calendar ',to_char(${dateColumnsUpper.date_day}, '%Y')) as ${dateColumnsUpper.year_name},
          IFF(EXTRACT(QUARTER FROM ${dateColumnsUpper.date_day}) < 3, DATE_TRUNC('year', ${dateColumnsUpper.date_day}), DATEADD('quarter', 2, DATE_TRUNC('year', ${dateColumnsUpper.date_day}))) as ${dateColumnsUpper.half_year},
          IFF(EXTRACT(QUARTER FROM ${dateColumnsUpper.date_day}) < 3, concat('Semester 1, ',to_char(${dateColumnsUpper.date_day}, '%Y')), concat('Semester 2, ', to_char(${dateColumnsUpper.date_day}, '%Y')))as ${dateColumnsUpper.half_year_name},
          DATE_TRUNC('quarter', ${dateColumnsUpper.date_day}) as ${dateColumnsUpper.quarter},
          concat('Quarter ', EXTRACT(QUARTER from ${dateColumnsUpper.date_day}), ', ', EXTRACT(YEAR from ${dateColumnsUpper.date_day})) as ${dateColumnsUpper.quarter_name},
          DATE_TRUNC('month', ${dateColumnsUpper.date_day}) as ${dateColumnsUpper.month},
          to_char(${dateColumnsUpper.date_day}, '%B %Y') as ${dateColumnsUpper.month_name},
          DATE_TRUNC('week', ${dateColumnsUpper.date_day}) as ${dateColumnsUpper.week},
          concat('Week ', EXTRACT(WEEK from ${dateColumnsUpper.date_day}), to_char(${dateColumnsUpper.date_day}, ', %Y')) as ${dateColumnsUpper.week_name},
          EXTRACT(DAYOFYEAR from ${dateColumnsUpper.date_day}) as ${dateColumnsUpper.day_of_year},
          concat('Day ', EXTRACT(DAYOFYEAR from ${dateColumnsUpper.date_day})) as ${dateColumnsUpper.day_of_year_name},
          EXTRACT(DAYOFWEEK from ${dateColumnsUpper.date_day}) as ${dateColumnsUpper.day_of_week},
          DAYNAME(${dateColumnsUpper.date_day}) as ${dateColumnsUpper.day_of_week_name},
          EXTRACT(WEEK from ${dateColumnsUpper.date_day}) as ${dateColumnsUpper.week_of_year},
          concat('Week ', EXTRACT(WEEK from ${dateColumnsUpper.date_day})) as ${dateColumnsUpper.week_of_year_name},
          EXTRACT(MONTH from ${dateColumnsUpper.date_day}) as ${dateColumnsUpper.month_of_year},
          MONTHNAME(${dateColumnsUpper.date_day}) as ${dateColumnsUpper.month_of_year_name},
          EXTRACT(QUARTER from ${dateColumnsUpper.date_day}) as ${dateColumnsUpper.quarter_of_year},
          concat('Quarter ', EXTRACT(QUARTER from ${dateColumnsUpper.date_day})) as ${dateColumnsUpper.quarter_of_year_name}
          FROM ${connection.database}.${connection.schema}.METRICFLOW_TIME_SPINE`;
      } else {
        sql = `SELECT ${dateColumns.date_day}::TIMESTAMP as ${dateColumns.pk_date},
          cast(to_char(${dateColumns.date_day}, '%Y%m%d') as decimal) as ${dateColumns.datekey},
          to_char(${dateColumns.date_day}, '%A, %B %d, %Y') as ${dateColumns.date_name},
          CAST(EXTRACT(YEAR from ${dateColumns.date_day}) AS STRING) as ${dateColumns.year},
          concat('Calendar ',to_char(${dateColumns.date_day}, '%Y')) as ${dateColumns.year_name},
          IFF(EXTRACT(QUARTER FROM ${dateColumns.date_day}) < 3, DATE_TRUNC('year', ${dateColumns.date_day}), DATEADD('quarter', 2, DATE_TRUNC('year', ${dateColumns.date_day}))) as ${dateColumns.half_year},
          IFF(EXTRACT(QUARTER FROM ${dateColumns.date_day}) < 3, concat('Semester 1, ',to_char(${dateColumns.date_day}, '%Y')), concat('Semester 2, ', to_char(${dateColumns.date_day}, '%Y')))as ${dateColumns.half_year_name},
          DATE_TRUNC('quarter', ${dateColumns.date_day}) as ${dateColumns.quarter},
          concat('Quarter ', EXTRACT(QUARTER from ${dateColumns.date_day}), ', ', EXTRACT(YEAR from ${dateColumns.date_day})) as ${dateColumns.quarter_name},
          DATE_TRUNC('month', ${dateColumns.date_day}) as ${dateColumns.month},
          to_char(${dateColumns.date_day}, '%B %Y') as ${dateColumns.month_name},
          DATE_TRUNC('week', ${dateColumns.date_day}) as ${dateColumns.week},
          concat('Week ', EXTRACT(WEEK from ${dateColumns.date_day}), to_char(${dateColumns.date_day}, ', %Y')) as ${dateColumns.week_name},
          EXTRACT(DAYOFYEAR from ${dateColumns.date_day}) as ${dateColumns.day_of_year},
          concat("Day ", EXTRACT(DAYOFYEAR from ${dateColumns.date_day})) as ${dateColumns.day_of_year_name},
          EXTRACT(DAYOFWEEK from ${dateColumns.date_day}) as ${dateColumns.day_of_week},
          DAYNAME(${dateColumns.date_day}) as ${dateColumns.day_of_week_name},
          EXTRACT(WEEK from ${dateColumns.date_day}) as ${dateColumns.week_of_year},
          concat('Week ', EXTRACT(WEEK from ${dateColumns.date_day})) as ${dateColumns.week_of_year_name},
          EXTRACT(MONTH from ${dateColumns.date_day}) as ${dateColumns.month_of_year},
          MONTHNAME(${dateColumns.date_day}) as ${dateColumns.month_of_year_name},
          EXTRACT(QUARTER from ${dateColumns.date_day}) as ${dateColumns.quarter_of_year},
          concat("Quarter ", EXTRACT(QUARTER from ${dateColumns.date_day})) as ${dateColumns.quarter_of_year_name}
          FROM ${connection.database}.${connection.schema}.metricflow_time_spine`;
      }
      return getTimeDatasetDefinition(dsName, sql, connection.unique_name);
    }

    throw new Error(`Database type of '${dbType}' is not yet supported`);
  }

  static createSimpleModel(result: SmlConvertResultBuilder): SMLModel {
    const model: SMLModel = {
      object_type: SMLObjectType.Model,
      unique_name: result.catalog.label,
      label: result.catalog.label,
      relationships: [],
      metrics: [],
    };

    return model;
  }
}

function getTimeDatasetDefinition(
  dsName: string,
  sql: string,
  connectionName: string,
): SMLDataset {
  return {
    object_type: SMLObjectType.Dataset,
    unique_name: DbtTools.dsName(dsName),
    sql: sql,
    connection_id: connectionName,
    label: DbtTools.dsName(dsName),
    columns: [
      { name: "pk_date", data_type: SMLColumnDataType.DateTime },
      { name: "datekey", data_type: SMLColumnDataType.Int },
      { name: "date_name", data_type: SMLColumnDataType.String },
      { name: "year", data_type: SMLColumnDataType.String },
      { name: "year_name", data_type: SMLColumnDataType.String },
      { name: "half_year", data_type: SMLColumnDataType.Date },
      { name: "half_year_name", data_type: SMLColumnDataType.String },
      { name: "quarter", data_type: SMLColumnDataType.Date },
      { name: "quarter_name", data_type: SMLColumnDataType.String },
      { name: "month", data_type: SMLColumnDataType.Date },
      { name: "month_name", data_type: SMLColumnDataType.String },
      { name: "week", data_type: SMLColumnDataType.Date },
      { name: "week_name", data_type: SMLColumnDataType.String },
      { name: "day_of_year", data_type: SMLColumnDataType.Int },
      { name: "day_of_year_name", data_type: SMLColumnDataType.String },
      { name: "day_of_week", data_type: SMLColumnDataType.Int },
      { name: "day_of_week_name", data_type: SMLColumnDataType.String },
      { name: "week_of_year", data_type: SMLColumnDataType.Int },
      { name: "week_of_year_name", data_type: SMLColumnDataType.String },
      { name: "month_of_year", data_type: SMLColumnDataType.Int },
      { name: "month_of_year_name", data_type: SMLColumnDataType.String },
      { name: "quarter_of_year", data_type: SMLColumnDataType.Int },
      { name: "quarter_of_year_name", data_type: SMLColumnDataType.String },
    ],
  } satisfies SMLDataset;
}
