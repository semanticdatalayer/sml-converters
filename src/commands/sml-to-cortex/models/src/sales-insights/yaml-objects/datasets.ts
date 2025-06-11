import { ObjectType } from "../../ObjectType";
import { IYamlDataset } from "../../yaml/IYamlDataset";
import { getAggregatedResult, getFreezedObject } from "./utils";

const getDataset = (dataset: IYamlDataset) => getFreezedObject(dataset);

const dateCustom: IYamlDataset = getDataset({
  unique_name: "DateCustom",
  object_type: ObjectType.Dataset,
  label: "DateCustom",
  connection_id: "Postgres",
  table: "datecustom",
  columns: [
    {
      name: "date_name",
      data_type: "string",
    },
    {
      name: "datekey",
      data_type: "long",
    },
    {
      name: "day_of_half_year",
      data_type: "long",
    },
    {
      name: "day_of_half_year_name",
      data_type: "string",
    },
    {
      name: "day_of_month",
      data_type: "long",
    },
    {
      name: "day_of_month_name",
      data_type: "string",
    },
    {
      name: "day_of_quarter",
      data_type: "long",
    },
    {
      name: "day_of_quarter_name",
      data_type: "string",
    },
    {
      name: "day_of_week",
      data_type: "long",
    },
    {
      name: "day_of_week_name",
      data_type: "string",
    },
    {
      name: "day_of_year",
      data_type: "long",
    },
    {
      name: "day_of_year_name",
      data_type: "string",
    },
    {
      name: "half_year",
      data_type: "datetime",
    },
    {
      name: "half_year_name",
      data_type: "string",
    },
    {
      name: "half_year_of_year",
      data_type: "long",
    },
    {
      name: "half_year_of_year_name",
      data_type: "string",
    },
    {
      name: "iso_8601_day",
      data_type: "datetime",
    },
    {
      name: "iso_8601_day_name",
      data_type: "string",
    },
    {
      name: "iso_8601_day_of_week",
      data_type: "long",
    },
    {
      name: "iso_8601_day_of_week_name",
      data_type: "string",
    },
    {
      name: "iso_8601_day_of_year",
      data_type: "long",
    },
    {
      name: "iso_8601_day_of_year_name",
      data_type: "string",
    },
    {
      name: "iso_8601_week",
      data_type: "datetime",
    },
    {
      name: "iso_8601_week_name",
      data_type: "string",
    },
    {
      name: "iso_8601_week_of_year",
      data_type: "long",
    },
    {
      name: "iso_8601_week_of_year_name_reporting_day_ctl",
      data_type: "string",
    },
    {
      name: "iso_8601_year",
      data_type: "datetime",
    },
    {
      name: "iso_8601_year_name",
      data_type: "string",
    },
    {
      name: "month",
      data_type: "datetime",
    },
    {
      name: "month_name",
      data_type: "string",
    },
    {
      name: "month_of_half_year",
      data_type: "long",
    },
    {
      name: "month_of_half_year_name",
      data_type: "string",
    },
    {
      name: "month_of_quarter",
      data_type: "long",
    },
    {
      name: "month_of_quarter_name",
      data_type: "string",
    },
    {
      name: "month_of_year",
      data_type: "long",
    },
    {
      name: "month_of_year_name",
      data_type: "string",
    },
    {
      name: "pk_date",
      data_type: "datetime",
    },
    {
      name: "quarter",
      data_type: "datetime",
    },
    {
      name: "quarter_name",
      data_type: "string",
    },
    {
      name: "quarter_of_half_year",
      data_type: "long",
    },
    {
      name: "quarter_of_half_year_name",
      data_type: "string",
    },
    {
      name: "quarter_of_year",
      data_type: "long",
    },
    {
      name: "quarter_of_year_name",
      data_type: "string",
    },
    {
      name: "reporting_day",
      data_type: "datetime",
    },
    {
      name: "reporting_day_lykey",
      data_type: "datetime",
    },
    {
      name: "reporting_day_name",
      data_type: "string",
    },
    {
      name: "reporting_day_of_half_year",
      data_type: "long",
    },
    {
      name: "reporting_day_of_half_year_name",
      data_type: "string",
    },
    {
      name: "reporting_day_of_month",
      data_type: "long",
    },
    {
      name: "reporting_day_of_month_name",
      data_type: "string",
    },
    {
      name: "reporting_day_of_quarter",
      data_type: "long",
    },
    {
      name: "reporting_day_of_quarter_name",
      data_type: "string",
    },
    {
      name: "reporting_day_of_week",
      data_type: "long",
    },
    {
      name: "reporting_day_of_week_name",
      data_type: "string",
    },
    {
      name: "reporting_day_of_year",
      data_type: "long",
    },
    {
      name: "reporting_day_of_year_name",
      data_type: "string",
    },
    {
      name: "reporting_half_year",
      data_type: "datetime",
    },
    {
      name: "reporting_half_year_lykey",
      data_type: "datetime",
    },
    {
      name: "reporting_half_year_name",
      data_type: "string",
    },
    {
      name: "reporting_half_year_of_year",
      data_type: "long",
    },
    {
      name: "reporting_half_year_of_year_name",
      data_type: "string",
    },
    {
      name: "reporting_month",
      data_type: "datetime",
    },
    {
      name: "reporting_month_lykey",
      data_type: "datetime",
    },
    {
      name: "reporting_month_name",
      data_type: "string",
    },
    {
      name: "reporting_month_name2",
      data_type: "string",
    },
    {
      name: "reporting_month_of_half_year",
      data_type: "long",
    },
    {
      name: "reporting_month_of_half_year_name",
      data_type: "string",
    },
    {
      name: "reporting_month_of_quarter",
      data_type: "long",
    },
    {
      name: "reporting_month_of_quarter_name",
      data_type: "string",
    },
    {
      name: "reporting_month_of_year",
      data_type: "long",
    },
    {
      name: "reporting_month_of_year_name",
      data_type: "string",
    },
    {
      name: "reporting_quarter",
      data_type: "datetime",
    },
    {
      name: "reporting_quarter_lykey",
      data_type: "datetime",
    },
    {
      name: "reporting_quarter_name",
      data_type: "string",
    },
    {
      name: "reporting_quarter_of_half_year",
      data_type: "long",
    },
    {
      name: "reporting_quarter_of_half_year_name",
      data_type: "string",
    },
    {
      name: "reporting_quarter_of_year",
      data_type: "long",
    },
    {
      name: "reporting_quarter_of_year_name",
      data_type: "string",
    },
    {
      name: "reporting_week",
      data_type: "datetime",
    },
    {
      name: "reporting_week_ctl",
      data_type: "datetime",
    },
    {
      name: "reporting_week_lykey",
      data_type: "datetime",
    },
    {
      name: "reporting_week_name",
      data_type: "string",
    },
    {
      name: "reporting_week_of_half_year",
      data_type: "long",
    },
    {
      name: "reporting_week_of_half_year_name",
      data_type: "string",
    },
    {
      name: "reporting_week_of_month",
      data_type: "long",
    },
    {
      name: "reporting_week_of_month_name",
      data_type: "string",
    },
    {
      name: "reporting_week_of_quarter",
      data_type: "long",
    },
    {
      name: "reporting_week_of_quarter_name",
      data_type: "string",
    },
    {
      name: "reporting_week_of_year",
      data_type: "long",
    },
    {
      name: "reporting_week_of_year_name",
      data_type: "string",
    },
    {
      name: "reporting_year",
      data_type: "datetime",
    },
    {
      name: "reporting_year_lykey",
      data_type: "datetime",
    },
    {
      name: "reporting_year_name",
      data_type: "string",
    },
    {
      name: "week",
      data_type: "datetime",
    },
    {
      name: "week_name",
      data_type: "string",
    },
    {
      name: "week_of_year",
      data_type: "long",
    },
    {
      name: "week_of_year_name",
      data_type: "string",
    },
    {
      name: "year",
      data_type: "datetime",
    },
    {
      name: "year_name",
      data_type: "string",
    },
  ],
});

const userToCountryMap: IYamlDataset = getDataset({
  unique_name: "User to Country Map",
  label: "User to Country Map",
  object_type: ObjectType.Dataset,
  connection_id: "Postgres",
  sql: "select 'France' as \"country\", 'joe' as \"username\"\nunion all\nselect 'United States' as \"country\", 'david' as \"username\"\nunion all\nselect 'Australia' as \"country\", 'joe' as \"username\"\nunion all\nselect 'Canada' as \"country\", 'david' as \"username\"\nunion all\nselect 'Germany' as \"country\", 'joe' as \"username\"\nunion all\nselect 'United Kingdom' as \"country\", 'joe' as \"username\"",
  columns: [
    {
      name: "country",
      data_type: "string",
    },
    {
      name: "username",
      data_type: "string",
    },
  ],
});

const dimGeoCity: IYamlDataset = getDataset({
  unique_name: "dim_geo_city",
  object_type: ObjectType.Dataset,
  label: "dim_geo_city",
  connection_id: "Postgres",
  table: "dim_geo_city",
  columns: [
    {
      name: "city",
      data_type: "string",
    },
    {
      name: "citystatekey",
      data_type: "string",
    },
    {
      name: "geographykey",
      data_type: "long",
    },
    {
      name: "statekey",
      data_type: "string",
    },
  ],
});

const dimGeoCountry: IYamlDataset = getDataset({
  unique_name: "dim_geo_country",
  object_type: ObjectType.Dataset,
  label: "dim_geo_country",
  connection_id: "Postgres",
  table: "dim_geo_country",
  columns: [
    {
      name: "country",
      data_type: "string",
    },
  ],
});

const dimGeoPostalcode: IYamlDataset = getDataset({
  unique_name: "dim_geo_postalcode",
  label: "dim_geo_postalcode",
  object_type: ObjectType.Dataset,
  connection_id: "Postgres",
  table: "dim_geo_postalcode",
  columns: [
    {
      name: "country",
      data_type: "string",
    },
    {
      name: "countrypostalcode",
      data_type: "string",
    },
    {
      name: "geographykey",
      data_type: "long",
    },
    {
      name: "postalcode",
      data_type: "string",
    },
  ],
});

const dimGeoState: IYamlDataset = getDataset({
  unique_name: "dim_geo_state",
  label: "dim_geo_state",
  object_type: ObjectType.Dataset,
  connection_id: "Postgres",
  table: "dim_geo_state",
  columns: [
    {
      name: "country",
      data_type: "string",
    },
    {
      name: "state",
      data_type: "string",
    },
    {
      name: "statekey",
      data_type: "string",
    },
  ],
});

const dimCustomer: IYamlDataset = getDataset({
  unique_name: "dimcustomer",
  label: "dimcustomer",
  object_type: ObjectType.Dataset,
  connection_id: "Postgres",
  table: "dimcustomer",
  columns: [
    {
      name: "customerkey",
      data_type: "long",
    },
    {
      name: "datefirstpurchase",
      data_type: "string",
    },
    {
      name: "firstname",
      data_type: "string",
    },
    {
      name: "fullname",
      data_type: "string",
    },
    {
      name: "gender",
      data_type: "string",
    },
    {
      name: "geographykey",
      data_type: "long",
    },
    {
      name: "lastname",
      data_type: "string",
    },
    {
      name: "occupation",
      data_type: "string",
    },
  ],
});

const dimProduct: IYamlDataset = getDataset({
  unique_name: "dimproduct",
  label: "dimproduct",
  object_type: ObjectType.Dataset,
  connection_id: "Postgres",
  table: "dimproduct",
  columns: [
    {
      name: "englishproductname",
      data_type: "string",
    },
    {
      name: "listprice",
      data_type: "double",
    },
    {
      name: "productkey",
      data_type: "long",
    },
    {
      name: "productline",
      data_type: "string",
    },
    {
      name: "productsubcategorykey",
      data_type: "long",
    },
    {
      name: "productsubcategoryname",
      data_type: "string",
    },
    {
      name: "startdate",
      data_type: "string",
    },
  ],
});

const factinternetsales: IYamlDataset = getDataset({
  unique_name: "factinternetsales",
  label: "factinternetsales",
  object_type: ObjectType.Dataset,

  connection_id: "Postgres",
  table: "factinternetsales",
  columns: [
    {
      name: "Calculated Tax",
      data_type: "double",
      sql: "salesamount*0.085",
      dialects: [
        {
          dialect: "Postgresql",
          sql: '"salesamount"*0.085',
        },
      ],
    },
    {
      name: "currencykey",
      data_type: "long",
    },
    {
      name: "customerkey",
      data_type: "long",
    },
    {
      name: "orderdate",
      data_type: "string",
    },
    {
      name: "orderdatekey",
      data_type: "long",
    },
    {
      name: "orderquantity",
      data_type: "long",
    },
    {
      name: "productkey",
      data_type: "long",
    },
    {
      name: "sales_reasons",
      data_type: "string",
    },
    {
      name: "salesamount",
      data_type: "double",
    },
    {
      name: "salesorderlinenumber",
      data_type: "long",
    },
    {
      name: "salesordernumber",
      data_type: "string",
    },
    {
      name: "shipdatekey",
      data_type: "long",
    },
    {
      name: "taxamt",
      data_type: "double",
    },
    {
      name: "unitprice",
      data_type: "double",
    },
    {
      name: "product_info",
      map: {
        field_terminator: ",",
        key_terminator: ":",
        key_type: "String",
        value_type: "String",
      },
    },
    {
      name: "color",
      data_type: "string",
      parent_column: "product_info",
    },
    {
      name: "size",
      data_type: "string",
      parent_column: "product_info",
    },
    {
      name: "style",
      data_type: "string",
      parent_column: "product_info",
    },
    {
      name: "weight",
      data_type: "decimal",
      parent_column: "product_info",
    },
  ],
});

const dimOrder: IYamlDataset = getDataset({
  unique_name: "dimorder",
  label: "dimorder",
  object_type: ObjectType.Dataset,

  connection_id: "Postgres",
  table: "dimorder",
  columns: [
    {
      name: "currency_name",
      data_type: "string",
    },
    {
      name: "currencykey",
      data_type: "long",
    },
    {
      name: "linename",
      data_type: "string",
    },
    {
      name: "ordername",
      data_type: "string",
    },
    {
      name: "ordernumberlinekey",
      data_type: "string",
    },
    {
      name: "salesorderlinenumber",
      data_type: "long",
    },
    {
      name: "salesordernumber",
      data_type: "string",
    },
    {
      name: "type",
      data_type: "string",
    },
  ],
});

const dimGender: IYamlDataset = getDataset({
  unique_name: "dimgender",
  label: "dimgender",
  object_type: ObjectType.Dataset,

  connection_id: "Postgres",
  table: "dimgender",
  columns: [
    {
      name: "genderkey",
      data_type: "string",
    },
    {
      name: "gendername",
      data_type: "string",
    },
  ],
});

const allDatasets = {
  dateCustom: dateCustom,
  userToCountryMap: userToCountryMap,
  dimGeoCity: dimGeoCity,
  dimGeoCountry: dimGeoCountry,
  dimGeoPostalcode: dimGeoPostalcode,
  dimGeoState: dimGeoState,
  dimCustomer: dimCustomer,
  dimProduct: dimProduct,
  factInternetSales: factinternetsales,
  dimOrder: dimOrder,
  dimGender: dimGender,
};

export const datasets = getAggregatedResult<IYamlDataset, typeof allDatasets>(allDatasets);
