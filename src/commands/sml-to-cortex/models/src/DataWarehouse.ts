export enum DataWarehouse {
  Snowflake = "snowflake",
  Bigquery = "bigquery",
  Databricks = "databrickssql",
  Iris = "iris",
  Postgresql = "postgresql",
  Redshift = "redshift",
}

export const getDataWarehouseFriendlyName = (key: DataWarehouse) => {
  if (key === DataWarehouse.Databricks) {
    return "Databricks SQL";
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
};
