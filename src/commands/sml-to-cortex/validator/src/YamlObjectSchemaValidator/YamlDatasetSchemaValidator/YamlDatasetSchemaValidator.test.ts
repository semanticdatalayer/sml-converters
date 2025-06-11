import YamlDatasetBuilder from "models/src/builders/YamlObjectBuilders/YamlDatasetBuilder";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import datasetSchema from "models/src/schemas/dataset.schema.json";
import {
  IYamlDataset,
  IYamlDatasetAlternateSql,
  IYamlDatasetAlternateTable,
  IYamlDatasetColumnMap,
  IYamlDatasetColumnSimple,
  IYamlDatasetSqlDialects,
  YamlColumnDataType,
} from "models/src/yaml/IYamlDataset";
import { ObjectInvalidSchemaGenerator } from "utils/ObjectInvalidSchemaGenerator";

import { IYamlObjectSchemaValidatorResponse } from "../IYamlObjectSchemaValidatorResponse";
import { SchemaValidatorWrapper } from "../SchemaValidatorWrapper/SchemaValidatorWrapper";
import YamlDatasetSchemaValidator from "./YamlDatasetSchemaValidator";

const getDataset = (dataset: Partial<IYamlDataset> = {}): IYamlParsedFile<IYamlDataset> => {
  dataset.sql = "sql";
  return YamlDatasetBuilder.create().with(dataset).buildYamlFile();
};

const validateAML = (parsedFile: IYamlParsedFile<IYamlDataset>): IYamlObjectSchemaValidatorResponse => {
  const schemaValidator = new SchemaValidatorWrapper({ allErrors: true });
  return new YamlDatasetSchemaValidator(schemaValidator, datasetSchema).validateAML(parsedFile);
};

describe("YamlDatasetSchemaValidator", () => {
  it("Should return false, if object_type is not Connection", () => {
    const parsedFile = getDataset({ object_type: ObjectType.Connection });
    const result = validateAML(parsedFile);

    expect(result.isValid).toBe(false);
    expect(result.errors?.length).toBe(1);
  });

  ObjectInvalidSchemaGenerator.for(YamlDatasetBuilder.create().build())
    .generateCases()
    .forEach((testCase) => {
      it(`${testCase.condition} should be invalid`, () => {
        const parsedFile = getDataset(testCase.data);
        const result = validateAML(parsedFile);

        expect(result.isValid).toBe(false);
      });
    });

  describe("Should return true,", () => {
    it("if the json is valid", () => {
      const parsedFile = getDataset();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(true);
      expect(result.errors?.length).toBe(0);
    });

    it("if Columns props are valid", () => {
      const parsedFile = YamlDatasetBuilder.create().with({ sql: "sql" }).addColumn("column1").buildYamlFile();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(true);
      expect(result.errors?.length).toBe(0);
    });

    it("if Alternate props are valid", () => {
      const parsedFile = getDataset();
      const result = validateAML(parsedFile);

      expect(result.isValid).toBe(true);
      expect(result.errors?.length).toBe(0);
    });
  });

  describe("Columns Simple", () => {
    const defaultColumn: IYamlDatasetColumnSimple = {
      name: "name",
      data_type: YamlColumnDataType.String,
    };

    ObjectInvalidSchemaGenerator.for(defaultColumn)
      .generateCases()
      .forEach((testCase) => {
        it(`${testCase.condition} should be invalid`, () => {
          const parsedFile = getDataset({ columns: [...[testCase.data]] });
          const result = validateAML(parsedFile);
          expect(result.isValid).toBe(false);
          expect(result.errors?.length).toBeGreaterThan(0);
        });
      });

    describe("Dialects", () => {
      const defaultDialect: IYamlDatasetSqlDialects = {
        dialect: "Snowflake",
        sql: "sql",
      };

      ObjectInvalidSchemaGenerator.for(defaultDialect)
        .generateCases()
        .forEach((testCase) => {
          it(`${testCase.condition} should be invalid`, () => {
            const simpleColumnWithDialect: IYamlDatasetColumnSimple = {
              ...defaultColumn,
              dialects: [...[testCase.data]],
            };
            const parsedFile = getDataset({
              columns: [simpleColumnWithDialect],
            });
            const result = validateAML(parsedFile);

            expect(result.isValid).toBe(false);
            expect(result.errors?.length).toBe(1);
          });
        });
    });
  });

  describe("Map column", () => {
    const mapColumn: IYamlDatasetColumnMap = {
      name: "aaa",
      map: {
        field_terminator: ",",
        key_terminator: ":",
        key_type: "string",
        value_type: "string",
      },
    };

    it("Should not return error if valid", () => {
      const parsedFile = getDataset({
        columns: [mapColumn],
      });

      const result = validateAML(parsedFile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    ObjectInvalidSchemaGenerator.for(mapColumn)
      .generateCases()
      .forEach((testCase) => {
        it(`${testCase.condition} should be invalid`, () => {
          const parsedFile = getDataset({
            columns: [testCase.data],
          });
          const result = validateAML(parsedFile);

          expect(result.isValid).toBe(false);
          expect(result.errors?.length).toBeGreaterThan(0);
        });
      });
  });

  describe("Alternate", () => {
    describe("Should return true,", () => {
      it("if Sql has valid value and Table and connection_id are not specified", () => {
        const parsedFile = YamlDatasetBuilder.create().with({ sql: "sql" }).addAlternateSql().buildYamlFile();
        const result = validateAML(parsedFile);

        expect(result.isValid).toBe(true);
        expect(result.errors?.length).toBe(0);
      });

      it("if Table and connection_id have valid values and Sql is not specified", () => {
        const parsedFile = YamlDatasetBuilder.create().with({ sql: "sql" }).addAlternateTable().buildYamlFile();
        const result = validateAML(parsedFile);

        expect(result.isValid).toBe(true);
        expect(result.errors?.length).toBe(0);
      });
    });

    describe("Should return false,", () => {
      it("if Sql has valid value and Table are specified", () => {
        const parsedFile = YamlDatasetBuilder.create()
          .with({ sql: "sql" })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .addAlternateSql({ sql: "sql1", table: "table1" } as any)
          .buildYamlFile();
        const result = validateAML(parsedFile);

        expect(result.isValid).toBe(false);
        expect(result.errors?.length).toBe(3);
      });

      it("if Sql has valid value and connection_id are specified", () => {
        const parsedFile = YamlDatasetBuilder.create()
          .with({ sql: "sql" })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .addAlternateSql({ sql: "sql1", connection_id: "conId" } as any)
          .buildYamlFile();
        const result = validateAML(parsedFile);

        expect(result.isValid).toBe(false);
        expect(result.errors?.length).toBe(3);
      });

      it("if Sql has valid value and Table and connection_id are specified", () => {
        const parsedFile = YamlDatasetBuilder.create()
          .with({ sql: "sql" })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .addAlternateSql({ sql: "sql1", table: "table1", connection_id: "conId" } as any)
          .buildYamlFile();
        const result = validateAML(parsedFile);

        expect(result.isValid).toBe(false);
        expect(result.errors?.length).toBe(3);
      });
    });

    const defaultAlternateSql: IYamlDatasetAlternateSql = {
      type: "type1",
      sql: "sql",
    };

    ObjectInvalidSchemaGenerator.for(defaultAlternateSql)
      .generateCases()
      .forEach((testCase) => {
        it(`${testCase.condition} should be invalid`, () => {
          const parsedFile = getDataset({ alternate: { ...testCase.data } });
          const result = validateAML(parsedFile);

          expect(result.isValid).toBe(false);
          expect(result.errors?.length).toBeTruthy();
        });
      });

    const defaultAlternateTable: IYamlDatasetAlternateTable = {
      type: "type1",
      table: "table1",
      connection_id: "con_id",
    };

    ObjectInvalidSchemaGenerator.for(defaultAlternateTable)
      .generateCases()
      .forEach((testCase) => {
        it(`${testCase.condition} should be invalid`, () => {
          const parsedFile = getDataset({ alternate: { ...testCase.data } });
          const result = validateAML(parsedFile);

          expect(result.isValid).toBe(false);
          expect(result.errors?.length).toBeTruthy();
        });
      });
  });
});
