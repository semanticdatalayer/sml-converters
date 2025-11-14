import {
  SMLColumnDataType,
  SMLDataset,
  SMLDimension,
  SMLDimensionTimeUnit,
  SMLDimensionType,
  SMLHierarchyEmptyField,
  SMLObjectType,
} from "sml-sdk";


const dim_sql = `SELECT DATE_DAY::TIMESTAMP as PK_DATE,
            cast(to_char(DATE_DAY, '%Y%m%d') as decimal) as DATEKEY,
            to_char(DATE_DAY, '%A, %B %d, %Y') as DATE_NAME,
            CAST(EXTRACT(YEAR from DATE_DAY) AS STRING) as YEAR,
            concat('Calendar ',to_char(DATE_DAY, '%Y')) as YEAR_NAME,
            IFF(EXTRACT(QUARTER FROM DATE_DAY) < 3, DATE_TRUNC('year', DATE_DAY), DATEADD('quarter', 2, DATE_TRUNC('year', DATE_DAY))) as HALF_YEAR,
            IFF(EXTRACT(QUARTER FROM DATE_DAY) < 3, concat('Semester 1, ',to_char(DATE_DAY, '%Y')), concat('Semester 2, ', to_char(DATE_DAY, '%Y')))as HALF_YEAR_NAME,
            DATE_TRUNC('quarter', DATE_DAY) as QUARTER,
            concat('Quarter ', EXTRACT(QUARTER from DATE_DAY), ', ', EXTRACT(YEAR from DATE_DAY)) as QUARTER_NAME,
            DATE_TRUNC('month', DATE_DAY) as MONTH,
            to_char(DATE_DAY, '%B %Y') as MONTH_NAME,
            DATE_TRUNC('week', DATE_DAY) as WEEK,
            concat('Week ', EXTRACT(WEEK from DATE_DAY), to_char(DATE_DAY, ', %Y')) as WEEK_NAME,
            EXTRACT(DAYOFYEAR from DATE_DAY) as DAY_OF_YEAR,
            concat('Day ', EXTRACT(DAYOFYEAR from DATE_DAY)) as DAY_OF_YEAR_NAME,
            EXTRACT(DAYOFWEEK from DATE_DAY) as DAY_OF_WEEK,
            DAYNAME(DATE_DAY) as DAY_OF_WEEK_NAME,
            EXTRACT(WEEK from DATE_DAY) as WEEK_OF_YEAR,
            concat('Week ', EXTRACT(WEEK from DATE_DAY)) as WEEK_OF_YEAR_NAME,
            EXTRACT(MONTH from DATE_DAY) as MONTH_OF_YEAR,
            MONTHNAME(DATE_DAY) as MONTH_OF_YEAR_NAME,
            EXTRACT(QUARTER from DATE_DAY) as QUARTER_OF_YEAR,
            concat('Quarter ', EXTRACT(QUARTER from DATE_DAY)) as QUARTER_OF_YEAR_NAME
            FROM 
    (   SELECT 
            DATEADD(DAY, ROW_NUMBER() OVER (ORDER BY 1) - 1, '1990-01-01') date_day
        FROM 
            TABLE(GENERATOR(ROWCOUNT => 3650)) )`;

// const dim_sql = `SELECT 
//     date_day::TIMESTAMP                          AS pk_date,
//     CAST(TO_CHAR(date_day, '%Y%m%d') AS DECIMAL) AS datekey,
//     TO_CHAR(date_day, '%A, %B %d, %Y')           AS date_name,
//     CAST(EXTRACT(YEAR FROM date_day) AS STRING)  AS YEAR,
//     concat('Calendar ',TO_CHAR(date_day, '%Y'))  AS year_name,
//     IFF(EXTRACT(QUARTER FROM date_day) < 3, DATE_TRUNC('year', date_day), DATEADD('quarter', 2, 
//     DATE_TRUNC('year', date_day))) AS half_year,
//     IFF(EXTRACT(QUARTER FROM date_day) < 3, concat('Semester 1, ',TO_CHAR(date_day, '%Y')), concat 
//     ('Semester 2, ', TO_CHAR(date_day, '%Y')))                                    AS half_year_name,
//     DATE_TRUNC('quarter', date_day)                                                      AS quarter,
//     concat('Quarter ', EXTRACT(QUARTER FROM date_day), ', ', EXTRACT(YEAR FROM date_day)) AS 
//                                      quarter_name,
//     DATE_TRUNC('month', date_day)                                           AS MONTH,
//     TO_CHAR(date_day, '%B %Y')                                              AS month_name,
//     DATE_TRUNC('week', date_day)                                            AS week,
//     concat('Week ', EXTRACT(WEEK FROM date_day), TO_CHAR(date_day, ', %Y')) AS week_name,
//     EXTRACT(DAYOFYEAR FROM date_day)                                        AS day_of_year,
//     concat('Day ', EXTRACT(DAYOFYEAR FROM date_day))                        AS day_of_year_name,
//     EXTRACT(DAYOFWEEK FROM date_day)                                        AS day_of_week,
//     DAYNAME(date_day)                                                       AS day_of_week_name,
//     EXTRACT(WEEK FROM date_day)                                             AS week_of_year,
//     concat('Week ', EXTRACT(WEEK FROM date_day))                            AS week_of_year_name,
//     EXTRACT(MONTH FROM date_day)                                            AS month_of_year,
//     MONTHNAME(date_day)                                                     AS month_of_year_name,
//     EXTRACT(QUARTER FROM date_day)                                          AS quarter_of_year,
//     concat('Quarter ', EXTRACT(QUARTER FROM date_day))                      AS quarter_of_year_name
// FROM 
//     (   SELECT 
//             DATEADD(DAY, ROW_NUMBER() OVER (ORDER BY 1) - 1, '1990-01-01') date_day
//         FROM 
//             TABLE(GENERATOR(ROWCOUNT => 3650)) )`;

export function getTimeDatasetDefinition(
  datasetName: string,
  connectionName: string,
): SMLDataset {
  return {
    object_type: SMLObjectType.Dataset,
    unique_name: datasetName,
    sql: dim_sql,
    connection_id: connectionName,
    label: datasetName,
    columns: [
      { name: "PK_DATE", data_type: SMLColumnDataType.DateTime },
      { name: "DATEKEY", data_type: SMLColumnDataType.Int },
      { name: "DATE_NAME", data_type: SMLColumnDataType.String },
      { name: "YEAR", data_type: SMLColumnDataType.String },
      { name: "YEAR_NAME", data_type: SMLColumnDataType.String },
      { name: "HALF_YEAR", data_type: SMLColumnDataType.Date },
      { name: "HALF_YEAR_NAME", data_type: SMLColumnDataType.String },
      { name: "QUARTER", data_type: SMLColumnDataType.Date },
      { name: "QUARTER_NAME", data_type: SMLColumnDataType.String },
      { name: "MONTH", data_type: SMLColumnDataType.Date },
      { name: "MONTH_NAME", data_type: SMLColumnDataType.String },
      { name: "WEEK", data_type: SMLColumnDataType.Date },
      { name: "WEEK_NAME", data_type: SMLColumnDataType.String },
      { name: "DAY_OF_YEAR", data_type: SMLColumnDataType.Int },
      { name: "DAY_OF_YEAR_NAME", data_type: SMLColumnDataType.String },
      { name: "DAY_OF_WEEK", data_type: SMLColumnDataType.Int },
      { name: "DAY_OF_WEEK_NAME", data_type: SMLColumnDataType.String },
      { name: "WEEK_OF_YEAR", data_type: SMLColumnDataType.Int },
      { name: "WEEK_OF_YEAR_NAME", data_type: SMLColumnDataType.String },
      { name: "MONTH_OF_YEAR", data_type: SMLColumnDataType.Int },
      { name: "MONTH_OF_YEAR_NAME", data_type: SMLColumnDataType.String },
      { name: "QUARTER_OF_YEAR", data_type: SMLColumnDataType.Int },
      { name: "QUARTER_OF_YEAR_NAME", data_type: SMLColumnDataType.String },
    ],
  } satisfies SMLDataset;
}

export function timeDimension() {
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
        name_column: "YEAR_NAME",
        key_columns: ["YEAR"],
        time_unit: SMLDimensionTimeUnit.Year,
      },
      {
        unique_name: "Quarter",
        label: "Quarter",
        dataset: "dim_time_dataset",
        name_column: "QUARTER_NAME",
        key_columns: ["QUARTER"],
        sort_column: "QUARTER",
        time_unit: SMLDimensionTimeUnit.Quarter,
      },
      {
        unique_name: "Month1",
        label: "Month",
        dataset: "dim_time_dataset",
        name_column: "MONTH_NAME",
        key_columns: ["MONTH"],
        sort_column: "MONTH",
        time_unit: SMLDimensionTimeUnit.Month,
      },
      {
        unique_name: "DayMonth",
        label: "Day",
        description: "Day level of standard calendar Month Hierarchy",
        is_unique_key: true,
        dataset: "dim_time_dataset",
        name_column: "DATE_NAME",
        key_columns: ["PK_DATE"],
        sort_column: "PK_DATE",
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
        name_column: "YEAR_NAME",
        key_columns: ["YEAR"],
        sort_column: "YEAR",
        time_unit: SMLDimensionTimeUnit.Year,
      },
      {
        unique_name: "Week",
        label: "Week",
        dataset: "dim_time_dataset",
        name_column: "WEEK_NAME",
        key_columns: ["WEEK"],
        sort_column: "WEEK",
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
                name_column: "QUARTER_OF_YEAR",
                key_columns: ["QUARTER_OF_YEAR"],
                sort_column: "QUARTER_OF_YEAR",
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
                name_column: "MONTH",
                key_columns: ["MONTH"],
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
                name_column: "DAY_OF_WEEK",
                key_columns: ["DAY_OF_WEEK"],
                sort_column: "DAY_OF_WEEK",
              },
              {
                unique_name: "d_day_of_week_name",
                label: "Day Of Week Name",
                is_hidden: false,
                folder: "Date Attributes",
                // associated_hierarchy: "Date Month Hierarchy",
                dataset: "dim_time_dataset",
                name_column: "DAY_OF_WEEK_NAME",
                key_columns: ["DAY_OF_WEEK_NAME"],
                sort_column: "DAY_OF_WEEK",
              },
              {
                unique_name: "Day_Date",
                label: "Day Date",
                is_hidden: false,
                folder: "Date Attributes",
                // associated_hierarchy: "Date Month Hierarchy",
                dataset: "dim_time_dataset",
                name_column: "PK_DATE",
                key_columns: ["PK_DATE"],
                sort_column: "PK_DATE",
              },
              {
                unique_name: "w_day_of_week_name",
                label: "W Day Of Week Name",
                is_hidden: false,
                folder: "Date Attributes",
                // associated_hierarchy: "Date Month Hierarchy",
                dataset: "dim_time_dataset",
                name_column: "DAY_OF_WEEK_NAME",
                key_columns: ["DAY_OF_WEEK_NAME"],
                sort_column: "DAY_OF_WEEK_NAME",
              },
              {
                unique_name: "w_day_of_week_number",
                label: "W Day Of Week Number",
                is_hidden: false,
                folder: "Date Attributes",
                // associated_hierarchy: "Date Month Hierarchy",
                dataset: "dim_time_dataset",
                name_column: "DAY_OF_WEEK",
                key_columns: ["DAY_OF_WEEK"],
                sort_column: "DAY_OF_WEEK",
              },
              {
                unique_name: "W_Day_Date",
                label: "W Day Date",
                is_hidden: false,
                folder: "Date Attributes",
                // associated_hierarchy: "Date Month Hierarchy",
                dataset: "dim_time_dataset",
                name_column: "PK_DATE",
                key_columns: ["PK_DATE"],
                sort_column: "PK_DATE",
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
                name_column: "WEEK_OF_YEAR",
                key_columns: ["WEEK_OF_YEAR"],
                sort_column: "WEEK_OF_YEAR",
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
