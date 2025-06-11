import YamlDatasetColumnBuilder, { IYamlColumnBuilder } from "models/src/builders/YamlObjectBuilders/YamlColumnBuilder";
import YamlDatasetBuilder from "models/src/builders/YamlObjectBuilders/YamlDatasetBuilder";
import { Severity } from "models/src/IFileCompilationOutput";
import { IYamlFile } from "models/src/IYamlFile";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import { IYamlDataset, IYamlDatasetAlternateTable, YamlColumnDataType } from "models/src/yaml/IYamlDataset";

import ValidatorOutput from "../../../../ValidatorOutput/ValidatorOutput";
import IYamlCommonReferenceValidator from "../YamlCommonReferenceValidator/IYamlCommonReferenceValidator";
import { yamlDatasetErrors, YamlDatasetValidator } from "./YamlDatasetValidator";

const dataset = {
  d1: "dataset1",
  d2: "dataset2",
  d3: "dataset3",
};

const connection = {
  c1: "conn1",
  c2: "conn2",
};

const table = {
  t1: "table1",
  t2: "table2",
};

const getDatasetFile = (input: Partial<IYamlDataset>): IYamlFile<IYamlDataset> =>
  datasetBuilder.with(input).buildYamlFile();

const buildElementsMap = (...elements: Array<IYamlParsedFile>): Map<string, IYamlParsedFile> => {
  const elementsMap = new Map<string, IYamlParsedFile>();
  elements.forEach((e) => {
    elementsMap.set(e.data.unique_name, e);
  });

  return elementsMap;
};

let yamlCommonReferenceValidator: IYamlCommonReferenceValidator;
let yamlDatasetReferenceValidator: YamlDatasetValidator;
const datasetBuilder = YamlDatasetBuilder.create();

let referencedObjectIds = new Set<string>();

describe("YamlDatasetValidator", () => {
  beforeEach(() => {
    yamlCommonReferenceValidator = {
      validateAndGetReferencedObject: jest.fn().mockReturnValue({}),
      validateRelationships: jest.fn().mockReturnValue(new ValidatorOutput()),
      validateRelationshipsReferences: jest.fn().mockReturnValue(new ValidatorOutput()),
      validateAttributesReferences: jest.fn(),
      validateMetricReferences: jest.fn(),
    };
    yamlDatasetReferenceValidator = new YamlDatasetValidator(yamlCommonReferenceValidator);
    referencedObjectIds = new Set<string>();
  });

  it("Should call second time object and type validation logic with the correct params and add uniqueId to the collection, if dataset has alternate with connection_id and table", () => {
    const datasetYamlFile = datasetBuilder
      .with({
        connection_id: "connection1",
        alternate: { type: "testType", connection_id: "connection2", table: table.t1 },
      })
      .buildYamlFile();
    yamlDatasetReferenceValidator.validateObject(
      datasetYamlFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(yamlCommonReferenceValidator.validateAndGetReferencedObject).toHaveBeenCalledTimes(2);
    expect(yamlCommonReferenceValidator.validateAndGetReferencedObject).toHaveBeenLastCalledWith(
      (datasetYamlFile.data.alternate as IYamlDatasetAlternateTable)?.connection_id,
      expect.anything(),
      expect.anything(),
      ObjectType.Connection,
      expect.anything()
    );
    expect(referencedObjectIds).toContain(datasetYamlFile.data.connection_id);
    expect(referencedObjectIds).toContain((datasetYamlFile.data.alternate as IYamlDatasetAlternateTable).connection_id);
  });

  it("Should do nothing if there is an existing parent column", () => {
    const datasetYamlFile = datasetBuilder
      .with({
        connection_id: "connection1",
      })
      .addColumnWithParent("column1", "column3")
      .addColumn("column3")
      .buildYamlFile();
    const file = datasetYamlFile;

    const validatorOutput = yamlDatasetReferenceValidator.validateObject(
      file,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validatorOutput.hasErrors).toBe(false);
  });

  it("Should add an error for every invalid parent column", () => {
    const datasetYamlFile = datasetBuilder
      .with({
        connection_id: "connection1",
      })
      .addColumnWithParent("column1", "column3")
      .addColumnWithParent("column1", "column5")
      .addColumn("column3")
      .buildYamlFile();

    const validatorOutput = yamlDatasetReferenceValidator.validateObject(
      datasetYamlFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validatorOutput.hasErrors).toBe(true);
    expect(validatorOutput.hasFileErrorMessage(yamlDatasetErrors.parentColNotExist("column5"))).toBe(true);
  });

  it("Should add an error if a parent column is the same column", () => {
    const datasetYamlFile = datasetBuilder
      .with({
        connection_id: "connection1",
      })
      .addColumnWithParent("column1", "column1")
      .buildYamlFile();

    const validatorOutput = yamlDatasetReferenceValidator.validateObject(
      datasetYamlFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validatorOutput.hasFileErrorMessage(yamlDatasetErrors.parentColIsTheSame("column1"))).toBe(true);
  });

  it("Should add an error if a parent column has another parent column", () => {
    const datasetYamlFile = datasetBuilder
      .with({
        connection_id: "connection1",
      })
      .addColumnWithParent("column1", "column2")
      .addColumnWithParent("column2", "column3")
      .addColumn("column3")
      .buildYamlFile();

    const validatorOutput = yamlDatasetReferenceValidator.validateObject(
      datasetYamlFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(validatorOutput.hasFileErrorMessage(yamlDatasetErrors.parentColNoParent("column2"))).toBe(true);
  });

  it("Should validate parent column even if there is no referenced object", () => {
    const emptyCommonValidator: IYamlCommonReferenceValidator = {
      validateAndGetReferencedObject: jest.fn(),
      validateRelationships: jest.fn().mockReturnValue(new ValidatorOutput()),
      validateRelationshipsReferences: jest.fn().mockReturnValue(new ValidatorOutput()),
      validateAttributesReferences: jest.fn(),
      validateMetricReferences: jest.fn(),
    };
    const yamlReferenceValidator = new YamlDatasetValidator(emptyCommonValidator);
    const datasetYamlFile = datasetBuilder.addColumnWithParent("column1", "column3").buildYamlFile();
    const validatorOutput = yamlReferenceValidator.validateObject(
      datasetYamlFile,
      new Map<string, IYamlParsedFile>(),
      referencedObjectIds
    );

    expect(referencedObjectIds.size).toBe(0);
    expect(validatorOutput.filesOutput).toHaveLength(1);
    expect(validatorOutput.filesOutput[0].compilationOutput[0].severity).toBe(Severity.Error);
  });

  describe("Dataset table", () => {
    it("Should add NO warning if datasets point to a different table", () => {
      const datasetYamlFileOne = getDatasetFile({
        unique_name: dataset.d1,
        connection_id: connection.c1,
        table: table.t1,
      });
      const datasetYamlFileTwo = getDatasetFile({
        unique_name: dataset.d2,
        connection_id: connection.c1,
        table: table.t2,
      });
      const allFiles = buildElementsMap(datasetYamlFileOne, datasetYamlFileTwo);

      const validatorOutput = yamlDatasetReferenceValidator.validateObject(
        datasetYamlFileOne,
        allFiles,
        referencedObjectIds
      );

      expect(validatorOutput.filesOutput).toHaveLength(0);
    });

    it("Should add NO warning if datasets from different connections point to the same table", () => {
      const datasetYamlFileOne = getDatasetFile({
        unique_name: dataset.d1,
        connection_id: connection.c1,
        table: table.t1,
      });
      const datasetYamlFileTwo = getDatasetFile({
        unique_name: dataset.d2,
        connection_id: connection.c2,
        table: table.t1,
      });
      const allFiles = buildElementsMap(datasetYamlFileOne, datasetYamlFileTwo);

      const validatorOutput = yamlDatasetReferenceValidator.validateObject(
        datasetYamlFileOne,
        allFiles,
        referencedObjectIds
      );

      expect(validatorOutput.filesOutput).toHaveLength(0);
    });

    it("Should add one warning per dataset if two datasets point to the same table", () => {
      const datasetYamlFileOne = getDatasetFile({
        unique_name: dataset.d1,
        connection_id: connection.c1,
        table: table.t1,
      });
      const datasetYamlFileTwo = getDatasetFile({
        unique_name: dataset.d2,
        connection_id: connection.c1,
        table: table.t1,
      });
      const allFiles = buildElementsMap(datasetYamlFileOne, datasetYamlFileTwo);

      const validatorOutput = yamlDatasetReferenceValidator.validateObject(
        datasetYamlFileOne,
        allFiles,
        referencedObjectIds
      );

      const warningMsg = yamlDatasetErrors.datasetReferencesSameTable(dataset.d2, datasetYamlFileTwo.relativePath);
      const noWarningMsg = yamlDatasetErrors.datasetReferencesSameTable(dataset.d1, datasetYamlFileOne.relativePath);

      expect(validatorOutput.hasFileWarningMessage(warningMsg)).toBe(true);
      expect(validatorOutput.hasFileWarningMessage(noWarningMsg)).toBe(false);
    });

    it("Should add two warnings per dataset if three datasets point to the same table", () => {
      const datasetYamlFileOne = getDatasetFile({
        unique_name: dataset.d1,
        connection_id: connection.c1,
        table: table.t1,
      });
      const datasetYamlFileTwo = getDatasetFile({
        unique_name: dataset.d2,
        connection_id: connection.c1,
        table: table.t1,
      });
      const datasetYamlFileThree = getDatasetFile({
        unique_name: dataset.d3,
        connection_id: connection.c1,
        table: table.t1,
      });
      const allFiles = buildElementsMap(datasetYamlFileOne, datasetYamlFileTwo, datasetYamlFileThree);

      const validatorOutput = yamlDatasetReferenceValidator.validateObject(
        datasetYamlFileOne,
        allFiles,
        referencedObjectIds
      );

      const warningMsgOne = yamlDatasetErrors.datasetReferencesSameTable(dataset.d2, datasetYamlFileTwo.relativePath);
      const warningMsgTwo = yamlDatasetErrors.datasetReferencesSameTable(dataset.d3, datasetYamlFileThree.relativePath);
      const noWarningMsg = yamlDatasetErrors.datasetReferencesSameTable(dataset.d1, datasetYamlFileOne.relativePath);

      expect(validatorOutput.hasFileWarningMessage(warningMsgOne)).toBe(true);
      expect(validatorOutput.hasFileWarningMessage(warningMsgTwo)).toBe(true);
      expect(validatorOutput.hasFileWarningMessage(noWarningMsg)).toBe(false);
    });

    it("Should add an error for columns with duplicate name", () => {
      const column = "column_1";
      const datasetYamlFile = datasetBuilder
        .with({ connection_id: "connection1" })
        .addColumn(column)
        .addColumn(column, YamlColumnDataType.Int)
        .buildYamlFile();

      const validatorOutput = yamlDatasetReferenceValidator.validateObject(
        datasetYamlFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds
      );

      expect(validatorOutput.hasFileErrorMessage(yamlDatasetErrors.duplicateColumnName(column, 2))).toBe(true);
    });
  });

  describe("validateColumn", () => {
    const dataSetItem = YamlDatasetBuilder.create().buildYamlFile();
    const simpleColumnBuilder = YamlDatasetColumnBuilder.simple();

    const validateColumn = (columnBuilder: IYamlColumnBuilder) => {
      const column = columnBuilder.build();
      const validatorOutput = new ValidatorOutput();
      yamlDatasetReferenceValidator.validateColumn(dataSetItem, column, validatorOutput);
      return validatorOutput;
    };

    it("Should not add error if column is valid", () => {
      const validatorOutput = validateColumn(simpleColumnBuilder);
      expect(validatorOutput.hasErrors).toBe(false);
    });

    it("Should not add error if the column is with precision has no precision indicators", () => {
      const validatorOutput = validateColumn(simpleColumnBuilder.withDataType(YamlColumnDataType.Decimal));

      expect(validatorOutput.hasErrors).toBe(false);
    });

    it("Should not add error if the column is with precision has valid precision indicators", () => {
      const columnDataType = `${YamlColumnDataType.Decimal}(15,6)` as YamlColumnDataType;
      const validatorOutput = validateColumn(simpleColumnBuilder.withDataType(columnDataType));

      expect(validatorOutput.hasErrors).toBe(false);
    });

    it("Should add error if the column is without precision has valid precision indicators", () => {
      const columnDataType = `${YamlColumnDataType.Int}(15,6)` as YamlColumnDataType;
      const validatorOutput = validateColumn(simpleColumnBuilder.withDataType(columnDataType));

      expect(validatorOutput.hasErrors).toBe(true);
    });

    it("Should add error if the column is with precision has INVALID precision indicators", () => {
      const columnDataType = `${YamlColumnDataType.Decimal}(6)` as YamlColumnDataType;
      const validatorOutput = validateColumn(simpleColumnBuilder.withDataType(columnDataType));

      expect(validatorOutput.hasErrors).toBe(true);
    });
  });

  describe("validateColumn", () => {
    const dataSetItem = YamlDatasetBuilder.create().buildYamlFile();
    const simpleColumnBuilder = YamlDatasetColumnBuilder.simple();

    const validateColumn = (columnBuilder: IYamlColumnBuilder) => {
      const column = columnBuilder.build();
      const validatorOutput = new ValidatorOutput();
      yamlDatasetReferenceValidator.validateColumn(dataSetItem, column, validatorOutput);
      return validatorOutput;
    };

    it("Should not add error if column is valid", () => {
      const validatorOutput = validateColumn(simpleColumnBuilder);
      expect(validatorOutput.hasErrors).toBe(false);
    });

    it("Should not add error if the column is with precision has no precision indicators", () => {
      const validatorOutput = validateColumn(simpleColumnBuilder.withDataType(YamlColumnDataType.Decimal));

      expect(validatorOutput.hasErrors).toBe(false);
    });

    it("Should not add error if the column is with precision has valid precision indicators", () => {
      const columnDataType = `${YamlColumnDataType.Decimal}(15,6)` as YamlColumnDataType;
      const validatorOutput = validateColumn(simpleColumnBuilder.withDataType(columnDataType));

      expect(validatorOutput.hasErrors).toBe(false);
    });

    it("Should add error if the column is without precision has valid precision indicators", () => {
      const columnDataType = `${YamlColumnDataType.Int}(15,6)` as YamlColumnDataType;
      const validatorOutput = validateColumn(simpleColumnBuilder.withDataType(columnDataType));

      expect(validatorOutput.hasErrors).toBe(true);
    });

    it("Should add error if the column is with precision has INVALID precision indicators", () => {
      const columnDataType = `${YamlColumnDataType.Decimal}(6)` as YamlColumnDataType;
      const validatorOutput = validateColumn(simpleColumnBuilder.withDataType(columnDataType));

      expect(validatorOutput.hasErrors).toBe(true);
    });
  });

  describe("validateConnectionAndAddReferenceObjectId", () => {
    it("Should call common reference validator with the correct params and add uniqueId to the collection", () => {
      const datasetYamlFile = datasetBuilder.with({ connection_id: "connection1" }).buildYamlFile();

      yamlDatasetReferenceValidator.validateConnectionAndAddReferenceObjectId(
        datasetYamlFile.data.connection_id,
        datasetYamlFile,
        new Map<string, IYamlParsedFile>(),
        referencedObjectIds,
        ValidatorOutput.create()
      );

      expect(yamlCommonReferenceValidator.validateAndGetReferencedObject).toHaveBeenCalledWith(
        datasetYamlFile.data.connection_id,
        expect.anything(),
        expect.anything(),
        ObjectType.Connection,
        expect.anything()
      );
      expect(referencedObjectIds).toContain(datasetYamlFile.data.connection_id);
    });
  });

  describe("validateIncremental", () => {
    const orderDateColumn = "OrderDate";
    const datasetFile = datasetBuilder.addColumn(orderDateColumn).addColumn("Amount").buildYamlFile();

    it("Should NOT add error if all is ok", () => {
      const validatorOutput = ValidatorOutput.create();
      yamlDatasetReferenceValidator.validateIncremental(
        { column: orderDateColumn, grace_period: "16d" },
        datasetFile.data.columns,
        validatorOutput.file(datasetFile)
      );
      expect(validatorOutput.hasErrors).toBe(false);
    });

    it("Should add error if column does not exist", () => {
      const validatorOutput = ValidatorOutput.create();
      yamlDatasetReferenceValidator.validateIncremental(
        { column: "unknown column", grace_period: "16d" },
        datasetFile.data.columns,
        validatorOutput.file(datasetFile)
      );
      expect(validatorOutput.hasErrors).toBe(true);
      expect(validatorOutput.hasFileErrorMessage(yamlDatasetErrors.incrementColumnNotExist("unknown column"))).toBe(
        true
      );
    });

    it("Should add error if column is invalid type", () => {
      const datasetFileWithStringColumn = datasetBuilder
        .addColumn("datakey", YamlColumnDataType.String)
        .buildYamlFile();

      const validatorOutput = ValidatorOutput.create();
      yamlDatasetReferenceValidator.validateIncremental(
        { column: "datakey", grace_period: "16d" },
        datasetFileWithStringColumn.data.columns,
        validatorOutput.file(datasetFile)
      );
      expect(validatorOutput.hasErrors).toBe(true);
      expect(validatorOutput.hasFileErrorMessage(yamlDatasetErrors.incrementColumnInvalidColumnType("datakey"))).toBe(
        true
      );
    });

    it("Should add error if grace period is not in right format", () => {
      const validatorOutput = ValidatorOutput.create();
      yamlDatasetReferenceValidator.validateIncremental(
        { column: orderDateColumn, grace_period: "16days" },
        datasetFile.data.columns,
        validatorOutput.file(datasetFile)
      );
      expect(validatorOutput.hasErrors).toBe(true);
      const errors = validatorOutput
        .getFilesWithErrors()
        .flatMap((f) => f.compilationOutput.filter((o) => o.severity === Severity.Error));
      expect(errors.find((e) => e.message.startsWith(yamlDatasetErrors.invalidGracePeriod)));
    });

    it("Should not add error if grace period has zero value", () => {
      const validatorOutput = ValidatorOutput.create();
      yamlDatasetReferenceValidator.validateIncremental(
        { column: orderDateColumn, grace_period: "0w" },
        datasetFile.data.columns,
        validatorOutput.file(datasetFile)
      );

      expect(validatorOutput.hasErrors).toBe(false);
    });

    it("Should add error if grace period has negative value", () => {
      const validatorOutput = ValidatorOutput.create();
      yamlDatasetReferenceValidator.validateIncremental(
        { column: orderDateColumn, grace_period: "-0w" },
        datasetFile.data.columns,
        validatorOutput.file(datasetFile)
      );

      expect(validatorOutput.hasErrors).toBe(true);
      const errors = validatorOutput
        .getFilesWithErrors()
        .flatMap((f) => f.compilationOutput.filter((o) => o.severity === Severity.Error));
      expect(errors.find((e) => e.message.startsWith(yamlDatasetErrors.invalidGracePeriod)));
    });
  });
});
