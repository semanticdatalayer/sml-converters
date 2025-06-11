import { DataWarehouse, getDataWarehouseFriendlyName } from "./DataWarehouse";

const input: { key: DataWarehouse; expected: string }[] = [
  { key: DataWarehouse.Snowflake, expected: "Snowflake" },
  { key: DataWarehouse.Bigquery, expected: "Bigquery" },
  { key: DataWarehouse.Databricks, expected: "Databricks SQL" },
  { key: DataWarehouse.Iris, expected: "Iris" },
  { key: DataWarehouse.Postgresql, expected: "Postgresql" },
  { key: DataWarehouse.Redshift, expected: "Redshift" },
];

describe("getDataWarehouseFriendlyName", () => {
  input.forEach((x) => {
    it(`Shoud return correct result for key -> ${x.key}`, () => {
      const result = getDataWarehouseFriendlyName(x.key);
      expect(result).toBe(x.expected);
    });
  });
});
