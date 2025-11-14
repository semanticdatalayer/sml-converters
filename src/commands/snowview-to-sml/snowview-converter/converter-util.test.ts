import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { getColumnName, setDescription, getDataset } from "./converter-util";
import { SnowviewSynonymAndComment } from "../SnowviewModel";
import {
  SMLObjectType,
  SMLDataset,
  SMLConnection,
  SMLModel,
  SMLCatalog,
} from "sml-sdk";

describe("converter-util", () => {
  let mockLogger: Logger;
  let mockResult: SmlConverterResult;
  let customerDataset: SMLDataset;
  let productDataset: SMLDataset;
  let orderDataset: SMLDataset;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    customerDataset = {
      object_type: SMLObjectType.Dataset,
      unique_name: "customer",
      label: "customer",
      connection_id: "test_connection",
      table: "customer_table",
      columns: [
        { name: "CUSTOMER_ID", data_type: "NUMBER" },
        { name: "customer_name", data_type: "VARCHAR" },
        { name: "Email_Address", data_type: "VARCHAR" },
      ],
    };

    productDataset = {
      object_type: SMLObjectType.Dataset,
      unique_name: "PRODUCT",
      label: "PRODUCT",
      connection_id: "test_connection",
      table: "product_table",
      columns: [
        { name: "ProductID", data_type: "NUMBER" },
        { name: "product_name", data_type: "VARCHAR" },
        { name: "PRICE", data_type: "DECIMAL" },
      ],
    };

    orderDataset = {
      object_type: SMLObjectType.Dataset,
      unique_name: "order",
      label: "order",
      connection_id: "test_connection",
      table: "order_table",
      columns: [
        { name: "order_id", data_type: "NUMBER" },
        { name: "customer_id", data_type: "NUMBER" },
      ],
    };

    const mockConnection: SMLConnection = {
      object_type: SMLObjectType.Connection,
      unique_name: "test_connection",
      label: "test_connection",
      as_connection: "snowflake_conn",
      database: "test_db",
      schema: "test_schema",
    };

    const mockModel: SMLModel = {
      object_type: SMLObjectType.Model,
      unique_name: "test_model",
      label: "Test Model",
      relationships: [],
      dimensions: [],
      metrics: [],
    };

    const mockCatalog: SMLCatalog = {
      object_type: SMLObjectType.Catalog,
      unique_name: "test_catalog",
      label: "test_catalog",
      version: 1.0,
      aggressive_agg_promotion: false,
      build_speculative_aggs: false,
    };

    mockResult = {
      connections: [mockConnection],
      models: [mockModel],
      datasets: [customerDataset, productDataset, orderDataset],
      dimensions: [],
      measures: [],
      measuresCalculated: [],
      compositeModels: [],
      rowSecurity: [],
      catalog: mockCatalog,
    };
  });

  describe("getColumnName", () => {
    it("should return exact column name preserving original case when found", () => {
      const result = getColumnName(
        customerDataset.columns[0].name.toLowerCase(),
        customerDataset.unique_name,
        mockResult,
        mockLogger,
      );

      expect(result).toBe(customerDataset.columns[0].name);
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it("should perform case-insensitive search for both dataset and column", () => {
      const result = getColumnName(
        productDataset.columns[1].name.toUpperCase(),
        productDataset.unique_name.toLowerCase(),
        mockResult,
        mockLogger,
      );

      expect(result).toBe(productDataset.columns[1].name);
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it("should log warning and return original column when dataset not found", () => {
      const nonexistentDataset = "nonexistent_dataset";
      const columnName = "column_name";
      const result = getColumnName(
        columnName,
        nonexistentDataset,
        mockResult,
        mockLogger,
      );

      expect(result).toBe(columnName);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Dataset not found: ${nonexistentDataset}`,
      );
    });

    it("should log warning and return original column when column not found in dataset", () => {
      const nonexistentColumn = "nonexistent_column";
      const result = getColumnName(
        nonexistentColumn,
        customerDataset.unique_name,
        mockResult,
        mockLogger,
      );

      expect(result).toBe(nonexistentColumn);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Column not found: ${nonexistentColumn} in dataset ${customerDataset.unique_name}`,
      );
    });
  });

  describe("setDescription", () => {
    it("should return formatted string with both synonyms and comment", () => {
      const obj: SnowviewSynonymAndComment = {
        synonyms: ["customer", "client"],
        comment: "Customer table",
      };

      const result = setDescription(obj);

      expect(result).toBe(
        `{"synonyms": ${JSON.stringify(
          obj.synonyms,
        )},"comment": ${JSON.stringify(obj.comment)}}`,
      );
    });

    it("should return formatted string with only synonyms", () => {
      const obj: SnowviewSynonymAndComment = {
        synonyms: ["product", "item"],
      };

      const result = setDescription(obj);

      expect(result).toBe(`{"synonyms": ${JSON.stringify(obj.synonyms)}}`);
    });

    it("should return formatted string with only comment", () => {
      const obj: SnowviewSynonymAndComment = {
        comment: "Product dimension table",
      };

      const result = setDescription(obj);

      expect(result).toBe(`{"comment": ${JSON.stringify(obj.comment)}}`);
    });

    it("should return undefined when both synonyms and comment are missing", () => {
      const obj: SnowviewSynonymAndComment = {};

      const result = setDescription(obj);

      expect(result).toBeUndefined();
    });

    it("should return undefined when synonyms is empty array", () => {
      const obj: SnowviewSynonymAndComment = {
        synonyms: [],
      };

      const result = setDescription(obj);

      expect(result).toBeUndefined();
    });
  });

  describe("getDataset", () => {
    it("should return dataset object when unique_name matches case-insensitively", () => {
      const ds = getDataset("CUSTOMER", mockResult, mockLogger);

      expect(ds).toBe(customerDataset);
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it("should return undefined and log warning when dataset not found", () => {
      const ds = getDataset("nonexistent", mockResult, mockLogger);

      expect(ds).toBeUndefined();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Dataset not found: nonexistent",
      );
    });
  });
});
