import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { SnowviewRelationshipConverter } from "./relationship-converter";
import { SMLObjectType, SMLDataset } from "sml-sdk";

describe("SnowviewRelationshipConverter", () => {
  let converter: SnowviewRelationshipConverter;
  let mockLogger: Logger;
  let mockResult: SmlConverterResult;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as unknown as Logger;

    converter = new SnowviewRelationshipConverter(mockLogger);

    const orderDataset: SMLDataset = {
      object_type: SMLObjectType.Dataset,
      unique_name: "order",
      label: "order",
      columns: [{ name: "order_date", data_type: "DATE" }],
    } as SMLDataset;

    mockResult = {
      datasets: [orderDataset],
    } as SmlConverterResult;
  });

  describe("addRelationshipToTimeDimension", () => {
    const expectedResult = {
      unique_name: "order_Date Dimension_order_date",
      from: {
        dataset: "order",
        join_columns: ["order_date"],
      },
      to: {
        dimension: "Date Dimension",
        level: "DayMonth",
      },
      role_play: "order_date {0}",
    };

    it("should create a time dimension relationship when dimCol does not include .", () => {
      const result = converter.addRelationshipToTimeDimension(
        "order_date",
        "order",
        mockResult,
      );

      expect(result).toEqual(expectedResult);
    });

    it("should extract correctly column name when dimCol includes . (table.column format)", () => {
      const result = converter.addRelationshipToTimeDimension(
        "order_table.order_date",
        "order",
        mockResult,
      );

      expect(result).toEqual(expectedResult);
    });
  });
});
