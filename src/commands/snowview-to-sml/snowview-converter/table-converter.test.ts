import { Logger } from "../../../shared/logger";
import { SnowflakeCon } from "../snowflake-connect";
import {
  SnowviewTable,
  TableDescribe,
  SnowviewModel,
  SnowviewRelationship,
} from "../SnowviewModel";
import { SMLConnection, SMLDatasetColumn, SMLObjectType } from "sml-sdk";
import { SnowviewTableConverter } from "./table-converter";

describe("SnowviewTableConverter", () => {
  let converter: SnowviewTableConverter;
  let mockLogger: Logger;
  let mockSnowflakeCon: SnowflakeCon;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as unknown as Logger;

    mockSnowflakeCon = {
      getTableFromSnowflake: jest.fn(),
    } as unknown as SnowflakeCon;

    converter = new SnowviewTableConverter(mockLogger, mockSnowflakeCon);
  });

  describe("mapTableToSmlDataset", () => {
    const mockTableDescribe: TableDescribe = {
      columns: [
        { name: "col1", type: "VARCHAR", kind: "COLUMN" },
        { name: "col2", type: "NUMBER", kind: "COLUMN" },
      ],
    };

    const mockColumns: SMLDatasetColumn[] = [
      { name: "col1", data_type: "string" },
      { name: "col2", data_type: "number" },
    ];

    const createSnowviewTable = (
      overrides?: Partial<SnowviewTable>,
    ): SnowviewTable => ({
      name: "test_table",
      database: "test_db",
      schema: "test_schema",
      table: "TEST_TABLE",
      primary_key: [],
      comment: "Test table comment",
      ...overrides,
    });

    const createConnection = (
      overrides?: Partial<SMLConnection>,
    ): SMLConnection => ({
      object_type: SMLObjectType.Connection,
      unique_name: "con_test_db_test_schema",
      label: "con_test_db_test_schema",
      as_connection: "snowflake_conn",
      database: "test_db",
      schema: "test_schema",
      ...overrides,
    });

    beforeEach(() => {
      (mockSnowflakeCon.getTableFromSnowflake as jest.Mock).mockResolvedValue(
        mockTableDescribe,
      );
      jest.spyOn(converter, "mapColumns").mockReturnValue(mockColumns);
    });

    it("should return correct data when matching connection is found", async () => {
      const snowviewTable = createSnowviewTable();
      const connection = createConnection();
      const connections = [connection];

      const result = await converter.mapTableToSmlDataset(
        snowviewTable,
        connections,
      );

      expect(result).toEqual({
        object_type: SMLObjectType.Dataset,
        unique_name: snowviewTable.name,
        description: snowviewTable.comment,
        label: snowviewTable.name,
        columns: mockColumns,
        connection_id: connection.unique_name,
        table: snowviewTable.table,
      });
    });

    it("should throw error when connection is not found", async () => {
      const snowviewTable = createSnowviewTable({
        database: "missing_db",
        schema: "missing_schema",
      });
      const connection = createConnection();
      const connections = [connection];

      await expect(
        converter.mapTableToSmlDataset(snowviewTable, connections),
      ).rejects.toThrow(
        "Error generating test_table dataset, missing connection file for missing_db.missing_schema schema.",
      );
    });
  });

  describe("mapColumns", () => {
    it("should return correct columns when kind is COLUMN", () => {
      const tableDescribe: TableDescribe = {
        columns: [
          { name: "col1", type: "VARCHAR", kind: "COLUMN" },
          { name: "col2", type: "NUMBER", kind: "COLUMN" },
          { name: "col3", type: "TIMESTAMP", kind: "COLUMN" },
        ],
      };

      const result = converter.mapColumns(tableDescribe);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        name: "col1",
        data_type: expect.any(String),
      });
      expect(result[1]).toEqual({
        name: "col2",
        data_type: expect.any(String),
      });
      expect(result[2]).toEqual({
        name: "col3",
        data_type: expect.any(String),
      });
    });

    it("should skip columns with unknown kind and log warning", () => {
      const tableDescribe: TableDescribe = {
        columns: [
          { name: "col1", type: "VARCHAR", kind: "COLUMN" },
          { name: "col2", type: "NUMBER", kind: "UNKNOWN_KIND" },
          { name: "col3", type: "TIMESTAMP", kind: "COLUMN" },
        ],
      };

      const result = converter.mapColumns(tableDescribe);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("col1");
      expect(result[1].name).toBe("col3");
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Unknown column kind: UNKNOWN_KIND for column col2",
      );
    });
  });

  describe("identifyFactAndDimTables", () => {
    const createTable = (name: string): SnowviewTable => ({
      name,
      database: "test_db",
      schema: "test_schema",
      table: name,
      primary_key: [],
    });

    it("should correctly identify dimension and fact tables when relationships exist", () => {
      const table1 = createTable("orders");
      const table2 = createTable("customers");
      const table3 = createTable("products");

      const snowviewModel: SnowviewModel = {
        tables: [table1, table2, table3],
        relationships: [
          { ref_table: "customers" },
          { ref_table: "products" },
        ] as SnowviewRelationship[],
        facts: [],
        dimensions: [],
        metrics: [],
      };

      const result = converter.identifyFactAndDimTables(snowviewModel);

      expect(result.dimTables.size).toBe(2);
      expect(result.dimTables.has(table2)).toBe(true);
      expect(result.dimTables.has(table3)).toBe(true);
      expect(result.factTables.size).toBe(1);
      expect(result.factTables.has(table1)).toBe(true);
    });

    it("should treat all tables as fact tables when no relationships exist", () => {
      const table1 = createTable("orders");
      const table2 = createTable("customers");

      const snowviewModel: SnowviewModel = {
        tables: [table1, table2],
        relationships: [],
        facts: [],
        dimensions: [],
        metrics: [],
      };

      const result = converter.identifyFactAndDimTables(snowviewModel);

      expect(result.dimTables.size).toBe(0);
      expect(result.factTables.size).toBe(2);
      expect(result.factTables.has(table1)).toBe(true);
      expect(result.factTables.has(table2)).toBe(true);
    });
  });
});
