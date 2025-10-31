import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { SnowviewDimension } from "../SnowviewModel";
import { SnowviewDimensionConverter } from "./dimension-converter";
import {
  SMLObjectType,
  SMLDataset,
  SMLConnection,
  SMLModel,
  SMLCatalog,
  SMLDegenerateDimension,
} from "sml-sdk";
import * as converterUtil from "./converter-util";

describe("SnowviewDimensionConverter", () => {
  let converter: SnowviewDimensionConverter;
  let mockLogger: Logger;
  let mockResult: SmlConverterResult;
  let mockDataset: SMLDataset;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    mockDataset = {
      object_type: SMLObjectType.Dataset,
      unique_name: "test_dataset",
      label: "test_dataset",
      connection_id: "test_connection",
      table: "test_table",
      columns: [
        { name: "column1", data_type: "VARCHAR" },
        { name: "column2", data_type: "NUMBER" },
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
      datasets: [mockDataset],
      dimensions: [],
      measures: [],
      measuresCalculated: [],
      compositeModels: [],
      rowSecurity: [],
      catalog: mockCatalog,
    };

    converter = new SnowviewDimensionConverter(mockLogger);
  });

  describe("convertSecondaryAttribute", () => {
    let getDatasetSpy: jest.SpyInstance;
    let getColumnNameSpy: jest.SpyInstance;
    let setDescriptionSpy: jest.SpyInstance;

    beforeEach(() => {
      getDatasetSpy = jest
        .spyOn(converterUtil, "getDataset")
        .mockReturnValue({ unique_name: "resolved_dataset" } as any);
      getColumnNameSpy = jest
        .spyOn(converterUtil, "getColumnName")
        .mockReturnValue("resolved_column");
      setDescriptionSpy = jest
        .spyOn(converterUtil, "setDescription")
        .mockReturnValue("resolved_description");
    });

    afterEach(() => {
      getDatasetSpy.mockRestore();
      getColumnNameSpy.mockRestore();
      setDescriptionSpy.mockRestore();
    });

    const baseSnowviewDim = (
      overrides?: Partial<SnowviewDimension>,
    ): SnowviewDimension => ({
      name: "attr_name",
      parent_entity: "parent",
      table: "tbl",
      expression: "col",
      data_type: "VARCHAR",
      access_modifier: "PUBLIC",
      ...overrides,
    });

    const makeLevel = (secondaryAttributes?: any[]): any => ({
      unique_name: "level_unique",
      secondary_attributes: secondaryAttributes ?? [],
    });

    it("returns a new secondary attribute with resolved dataset and column when not existing", () => {
      const level = makeLevel([]);
      const snowDim = baseSnowviewDim();

      const attr = converter.convertSecondaryAttribute(
        snowDim,
        "any_dataset",
        "any_column",
        mockResult,
        level,
      );

      expect(attr).toBeDefined();
      expect(attr).toMatchObject({
        unique_name: snowDim.name,
        dataset: "resolved_dataset",
        key_columns: ["resolved_column"],
        label: snowDim.name,
        description: "resolved_description",
        name_column: "resolved_column",
      });
      // Pure: should not mutate the level's secondary_attributes
      expect(level.secondary_attributes).toHaveLength(0);
      expect((mockLogger.warn as jest.Mock).mock.calls.length).toBe(0);
    });

    it("returns undefined and warns when a matching secondary attribute already exists", () => {
      const existing = {
        unique_name: "existing",
        dataset: "resolved_dataset",
        key_columns: ["resolved_column"],
      } as any;
      const level = makeLevel([existing]);
      const snowDim = baseSnowviewDim();

      const result = converter.convertSecondaryAttribute(
        snowDim,
        "any_dataset",
        "any_column",
        mockResult,
        level,
      );

      expect(result).toBeUndefined();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it("sets is_hidden on returned attribute when access_modifier is PRIVATE", () => {
      const level = makeLevel([]);
      const snowDim = baseSnowviewDim({ access_modifier: "PRIVATE" });

      const attr = converter.convertSecondaryAttribute(
        snowDim,
        "any_dataset",
        "any_column",
        mockResult,
        level,
      );

      expect(attr?.is_hidden).toBe(true);
    });
  });

  describe("convertSnowviewDimensionToSmlDegenDim", () => {
    const createSnowviewDim = (
      expression: string,
      dataType: string = "VARCHAR",
    ): SnowviewDimension => ({
      name: "test_dim",
      parent_entity: "test_entity",
      table: "test_table",
      expression,
      data_type: dataType,
      access_modifier: "PUBLIC",
    });

    it("should call createDegenerateDimension with expression when isSimpleColumnExpr is true and referenceOtherTable is false", () => {
      const snowviewDim = createSnowviewDim("column1");
      const spy = jest.spyOn(converter, "createDegenerateDimension");

      converter.convertSnowviewDimensionToSmlDegenDim(
        snowviewDim,
        mockResult,
        true,
        false,
        mockDataset,
      );

      expect(spy).toHaveBeenCalledWith(
        snowviewDim,
        snowviewDim.expression,
        mockResult,
      );
    });

    it("should call createDegenerateDimension with dimension name when isSimpleColumnExpr is false and referenceOtherTable is false", () => {
      const snowviewDim = createSnowviewDim("SUM(column1)", "NUMBER");
      const spy = jest.spyOn(converter, "createDegenerateDimension");

      converter.convertSnowviewDimensionToSmlDegenDim(
        snowviewDim,
        mockResult,
        false,
        false,
        mockDataset,
      );

      expect(spy).toHaveBeenCalledWith(
        snowviewDim,
        snowviewDim.name,
        mockResult,
      );
    });

    it("should split expression and call createDegenerateDimension with column part when isSimpleColumnExpr is true and referenceOtherTable is true", () => {
      const otherTable = "other_table";
      const otherColumn = "other_column";
      const snowviewDim = createSnowviewDim(`${otherTable}.${otherColumn}`);
      const spy = jest.spyOn(converter, "createDegenerateDimension");

      converter.convertSnowviewDimensionToSmlDegenDim(
        snowviewDim,
        mockResult,
        true,
        true,
        mockDataset,
      );

      expect(spy).toHaveBeenCalledWith(snowviewDim, otherColumn, mockResult);
    });

    it("should log warning and return undefined when isSimpleColumnExpr is false and referenceOtherTable is true", () => {
      const snowviewDim = createSnowviewDim("COMPLEX(other_table.column)");

      const result = converter.convertSnowviewDimensionToSmlDegenDim(
        snowviewDim,
        mockResult,
        false,
        true,
        mockDataset,
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Unable to convert Snowview dimension ${snowviewDim.name} with expression ${snowviewDim.expression}. Complex expressions referencing other tables are not supported.`,
      );
      expect(result).toBeUndefined();
    });
  });
});
