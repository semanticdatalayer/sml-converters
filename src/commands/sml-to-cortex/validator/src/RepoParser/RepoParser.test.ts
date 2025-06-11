import YamlCatalogBuilder from "models/src/builders/YamlObjectBuilders/YamlCatalogBuilder";
import YamlMeasureBuilder from "models/src/builders/YamlObjectBuilders/YamlMeasureBuilder";
import { FILE_TYPE } from "models/src/FileType";
import { IFile } from "models/src/IFile";
import { IFolderStructure } from "models/src/IFolderStructure";
import { ObjectType } from "models/src/ObjectType";
import { OriginType } from "models/src/SourceType";
import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";
import { JestMocker } from "utils/service-builder/JestMocker";

import FileParser from "../FileParser/FileParser";
import FileTypeValidatorFactory from "../FileTypeValidator/FileTypeValidatorFactory";
import ValidatorOutput, { FileOutputAppender } from "../ValidatorOutput/ValidatorOutput";
import YamlObjectTypeExtractor from "../YamlObjectTypeExtractor/YamlObjectTypeExtractor";
import { RawContentFile, RepoParser } from "./RepoParser";

const mocker = JestMocker.create();
const fileTypeValidatorFactoryMocked = mocker.mockService(FileTypeValidatorFactory);
const fileParserMocked = mocker.mockService(FileParser);
const yamlObjectTypeExtractorMocked = mocker.mockService(YamlObjectTypeExtractor);

const repoParserTest = new RepoParser({
  fileTypeValidationFactory: fileTypeValidatorFactoryMocked,
  yamlObjectTypeExtractor: yamlObjectTypeExtractorMocked,
  fileParser: fileParserMocked,
});
const catalogBuilder = YamlCatalogBuilder.create();
const metricBuilder = YamlMeasureBuilder.create();

const catalogFile = catalogBuilder.buildYamlFile("catalog");
const atscaleFile = catalogBuilder.buildYamlFile("atscale");
const metricFile = metricBuilder.buildYamlFile("metrics/m1");
const catalogFileFromPackage = catalogBuilder.buildYamlFileForPackage("packages/shared/catalog");
const atscaleFileFromPackage = catalogBuilder.buildYamlFileForPackage("packages/shared/atscale");

const metricsFolder: IFolderStructure<IFile> = {
  path: "metrics/",
  folders: [],
  files: [metricFile],
  origin: OriginType.Root,
  packageName: "Root",
};

const getPackageFolder = (files: IFile[]): IFolderStructure<IFile> => {
  const metricFileFromPackage = metricBuilder.buildYamlFileForPackage("packages/shared/metrics/m2");
  const metricsFolderFromPackage: IFolderStructure<IFile> = {
    path: "packages/shared/metrics/",
    folders: [],
    files: [metricFileFromPackage],
    origin: OriginType.Package,
    packageName: "shared",
  };

  return {
    path: "packages/shared",
    folders: [metricsFolderFromPackage],
    files: [...files],
    origin: OriginType.Package,
    packageName: "shared",
  };
};

describe("RepoParser.extractYamlFiles", () => {
  it("Should ignore both catalog.yml and atscale.yml from packages", () => {
    const packageFolder = getPackageFolder([catalogFileFromPackage, atscaleFileFromPackage]);
    const rootFolder: IFolderStructure<IFile> = {
      path: "",
      folders: [metricsFolder, packageFolder],
      files: [catalogFile, atscaleFile],
      origin: OriginType.Root,
      packageName: "Root",
    };

    // act
    const result = repoParserTest.extractYamlFiles(rootFolder);

    // assert
    const catalogs = result.filter((f) => f.type === ObjectType.Catalog);
    expect(result.length).toBe(4);
    expect(catalogs.length).toBe(2);
    expect(catalogs[0].relativePath).toBe("catalog.yml");
    expect(catalogs[1].relativePath).toBe("atscale.yml");
  });
});

const validatorOutputMock = mocker.mockService(ValidatorOutput);
const fileOutputAppenderMock = mocker.mockService(FileOutputAppender);

const fileTypeValidator = {
  getErrors: jest.fn(),
};

const file = AnyObjectBuilder.fromPartial<IFile>({
  relativePath: "datasets/DateCustom.yaml",
  type: ObjectType.Dataset,
  rawContent: "",
});

describe("RepoParser.parseFile", () => {
  beforeEach(() => {
    mocker.moduleMocker.resetAllMocks();
    jest.resetAllMocks();

    fileParserMocked.parse.mockReturnValue({
      data: {},
      relativePath: "",
      rawContent: "",
      compilationOutput: [],
    });

    fileTypeValidatorFactoryMocked.getValidator.mockReturnValue(fileTypeValidator);
    validatorOutputMock.file.mockReturnValue(fileOutputAppenderMock);
    fileTypeValidator.getErrors.mockReturnValue([]);
  });

  it("Should return unknown file and add info when file has no valid extension", () => {
    const noValidExtensionFile = file.with({ relativePath: "datasets/DateCustom.unknown" }).build();

    const result = repoParserTest.parseFile(noValidExtensionFile, validatorOutputMock);

    expect(fileOutputAppenderMock.addInfo).toHaveBeenCalledWith(expect.stringContaining("File is not recognized"));
    expect(result.type).toEqual(FILE_TYPE.Unknown);
  });

  it("Should return env file and add 2 warnings when env file is not on root level and empty", () => {
    const envFile = file
      .with({
        relativePath: "datasets/.env",
        type: FILE_TYPE.Environment,
        rawContent: "",
      })
      .build();

    const result = repoParserTest.parseFile(envFile, validatorOutputMock);

    expect(fileOutputAppenderMock.addWarning).toHaveBeenNthCalledWith(1, "Environment files should be on root level");
    expect(fileOutputAppenderMock.addWarning).toHaveBeenNthCalledWith(2, "Environment file is empty");
    expect(result.type).toEqual(FILE_TYPE.Environment);
  });

  it("Should return unknown file and add info when file has no content and is unknown", () => {
    const unknownFile = file
      .with({
        relativePath: "datasets/unknownfile.dat",
        type: FILE_TYPE.Unknown,
        rawContent: "",
      })
      .build();

    const result = repoParserTest.parseFile(unknownFile, validatorOutputMock);

    expect(fileOutputAppenderMock.addInfo).toHaveBeenCalledWith(
      "File is not recognized as atscale file and will be skipped"
    );
    expect(result.type).toEqual(FILE_TYPE.Unknown);
  });

  it("Should return env file with undefined data and add errors when file has content but has errors", () => {
    const error = "error1";
    const envFile = file
      .with({
        relativePath: ".env",
        type: FILE_TYPE.Environment,
        rawContent: "first=first",
      })
      .build();

    fileTypeValidator.getErrors.mockReturnValue([error]);

    const result = repoParserTest.parseFile(envFile, validatorOutputMock);

    expect(result.type).toBe(FILE_TYPE.Environment);
    expect(result.data).toBe(undefined);
    expect(fileOutputAppenderMock.addError).toHaveBeenCalledWith(error);
  });

  it("Should return error when file has env var and file is not type connection", () => {
    const nonConnectionFileWithVars = file
      .with({
        relativePath: "datasets/Dataset.yaml",
        rawContent: `
          some_value: {{VARIABLE}}
        `,
        type: ObjectType.Dataset,
      })
      .build();

    const envVars = {
      VARIABLE: "some_value",
    };

    repoParserTest.parseFile(nonConnectionFileWithVars, validatorOutputMock, envVars);

    expect(fileOutputAppenderMock.addError).toHaveBeenCalledWith(
      "Variable placeholders (e.g., {{VARIABLE_NAME}}) were detected in a file that is not a connection file. Variable replacement is only supported for connection files. Please ensure that variables are only used within connection files, or update the file type accordingly."
    );
  });

  it("Should return text file when file has no content and has type text", () => {
    const noValidExtensionFile = file
      .with({
        relativePath: "README.md",
        type: FILE_TYPE.Text,
        rawContent: "",
      })
      .build();

    const result = repoParserTest.parseFile(noValidExtensionFile, validatorOutputMock);

    expect(result.type).toEqual(FILE_TYPE.Text);
  });

  it("Should return unknown file and add info when file has no content and is unknown", () => {
    const noValidExtensionFile = file
      .with({
        relativePath: "Unknown.md",
        type: FILE_TYPE.Unknown,
        rawContent: "",
      })
      .build();

    const result = repoParserTest.parseFile(noValidExtensionFile, validatorOutputMock);

    expect(result.type).toEqual(FILE_TYPE.Unknown);
  });

  it("Should return * file and add error when validator returns an error", () => {
    fileTypeValidator.getErrors.mockReturnValue(["error"]);
    const datasetFile = file
      .with({
        relativePath: "DataCustom.yml",
        type: FILE_TYPE.Unknown,
        rawContent: "content with error",
      })
      .build();

    const result = repoParserTest.parseFile(datasetFile, validatorOutputMock);

    expect(fileOutputAppenderMock.addError).toHaveBeenCalledWith("error");
    expect(result.type).toEqual(FILE_TYPE.Text);
  });

  it("Should return * file and add error when parse throws an error", () => {
    fileParserMocked.parse.mockImplementation(() => {
      throw new Error("Invalid json");
    });
    const datasetFile = file
      .with({
        relativePath: "DataCustom.yml",
        type: FILE_TYPE.Unknown,
        rawContent: "content with error",
      })
      .build();

    const result = repoParserTest.parseFile(datasetFile, validatorOutputMock);

    expect(fileOutputAppenderMock.addError).toHaveBeenCalledWith(
      "File content is invalid. It cannot be parsed. Invalid json"
    );
    expect(result.type).toEqual(FILE_TYPE.Text);
  });

  it("Should return * file when file has no object type", () => {
    yamlObjectTypeExtractorMocked.getType.mockReturnValue(undefined);
    const datasetFile = file
      .with({
        relativePath: "DataCustom.yml",
        type: FILE_TYPE.Unknown,
        rawContent: "content",
      })
      .build();

    const result = repoParserTest.parseFile(datasetFile, validatorOutputMock);

    expect(result.type).toEqual(FILE_TYPE.Text);
  });

  it("Should return yamlFile with type when file has object type", () => {
    yamlObjectTypeExtractorMocked.getType.mockReturnValue(FILE_TYPE.Dataset);
    const datasetFile = file
      .with({
        relativePath: "DataCustom.yml",
        type: FILE_TYPE.Unknown,
        data: {},
        rawContent: "content with error",
      })
      .build();

    const result = repoParserTest.parseFile(datasetFile, validatorOutputMock);

    expect(result.type).toEqual(FILE_TYPE.Dataset);
  });
});

describe("RepoParser.handleEnvironmentVariableInFile", () => {
  let mockEnvironmentVariables: { [key: string]: string };

  beforeEach(() => {
    mockEnvironmentVariables = {
      CONNECTION_ID: "con1",
    };
    mocker.moduleMocker.clearAllMocks();
  });

  describe("handleEnvironmentVariableInFile", () => {
    const connectionFile = file
      .with({
        relativePath: "connections/Postgres.yaml",
        type: ObjectType.Connection,
        rawContent: `
        as_connection: {{CONNECTION_ID}}
      `,
      })
      .build();

    it("should replace environment variables in the connection file", () => {
      const result = repoParserTest.handleEnvironmentVariableInFile(
        connectionFile as RawContentFile,
        mockEnvironmentVariables
      );
      expect(result.rawContent).toBe(`
        as_connection: con1
      `);
    });

    it("should throw an error if no environment variables are provided", () => {
      expect(() => {
        repoParserTest.handleEnvironmentVariableInFile(connectionFile as RawContentFile);
      }).toThrowError(
        "Referenced variables were detected, but the .env file is absent. Please create the .env file with the necessary variables."
      );
    });

    it("should throw an error if an undefined variable is used", () => {
      const connectionFileWithUndefinedVar = file
        .with({
          relativePath: "connections/Postgres.yaml",
          rawContent: `
          as_connection: {{UNDEFINED_VAR}}
        `,
        })
        .build();

      expect(() => {
        repoParserTest.handleEnvironmentVariableInFile(
          connectionFileWithUndefinedVar as RawContentFile,
          mockEnvironmentVariables
        );
      }).toThrowError(
        'The variable {{UNDEFINED_VAR}} used in the connection file is not defined in the .env file. Please add UNDEFINED_VAR="your_value_here" to the .env file to resolve this issue.'
      );
    });
  });

  describe("replaceVariablesInRawContent", () => {
    it("should replace valid variables in the connection file", () => {
      const rawContent = `
        as_connection: {{CONNECTION_ID}}
      `;
      const result = repoParserTest["replaceVariablesInRawContent"](rawContent, mockEnvironmentVariables);
      expect(result).toBe(`
        as_connection: con1
      `);
    });

    it("should throw an error if variables are used in 'unique_name'", () => {
      const rawContent = `
        unique_name: {{CONNECTION_ID}}
      `;
      expect(() => {
        repoParserTest["replaceVariablesInRawContent"](rawContent, mockEnvironmentVariables);
      }).toThrowError('Variables cannot be used in the "unique_name" field. Please provide a fixed value.');
    });

    it("should throw an error if variables are used in 'object_type'", () => {
      const rawContent = `
        object_type: {{CONNECTION_ID}}
      `;
      expect(() => {
        repoParserTest["replaceVariablesInRawContent"](rawContent, mockEnvironmentVariables);
      }).toThrowError('Variables cannot be used in the "object_type" field. Please provide a fixed value.');
    });
  });

  describe("replaceVariablesInString", () => {
    it("should compile and replace variables in the string", () => {
      const rawContent = "as_connection: {{CONNECTION_ID}}";
      const result = repoParserTest["replaceVariablesInString"](rawContent, mockEnvironmentVariables);
      expect(result).toBe("as_connection: con1");
    });
  });

  describe("hasVariables", () => {
    it("should return true when the template has variables", () => {
      const rawContent = "as_connection: {{CONNECTION_ID}}";
      const result = repoParserTest["hasVariables"](rawContent);
      expect(result).toBe(true);
    });

    it("should return false when the template has no variables", () => {
      const rawContent = "as_connection: con1";
      const result = repoParserTest["hasVariables"](rawContent);
      expect(result).toBe(false);
    });
  });
});
