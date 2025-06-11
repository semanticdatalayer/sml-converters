import YamlConnectionBuilder from "models/src/builders/YamlObjectBuilders/YamlConnectionBuilder";
import { Severity } from "models/src/IFileCompilationOutput";
import IYamlParsedFile from "models/src/IYamlParsedFile";
import { IYamlConnection } from "models/src/yaml/IYamlConnection";

import { YamlConnectionValidator } from "./YamlConnectionValidator";

const connectionValidator = new YamlConnectionValidator();
const connectionBuilder = YamlConnectionBuilder.create();
const checkedCombination = {
  as_connection: "BigQuery",
  database: "atscale-data-warehouse",
  schema: "Demo",
};
const buildElementsMap = (...elements: Array<IYamlParsedFile>): Map<string, IYamlParsedFile> => {
  const elementsMap = new Map<string, IYamlParsedFile>();
  elements.forEach((e) => {
    elementsMap.set(e.data.unique_name, e);
  });

  return elementsMap;
};

const getConnectionFile = (input: Partial<IYamlConnection> & Pick<IYamlConnection, "unique_name">) => {
  const result = connectionBuilder.with(input).buildYamlFile();
  result.relativePath = `${input.unique_name}.yml`;
  return result;
};

describe("YamlObjectsValidator", () => {
  it("Should not add warnings, if there are no duplicate connection combinations", () => {
    const firstTestConnectionYamlFile = getConnectionFile({ unique_name: "test" });
    const secondTestConnectionYamlFile = getConnectionFile({ ...checkedCombination, unique_name: "testMap" });
    connectionBuilder;
    const elementsMap = buildElementsMap(firstTestConnectionYamlFile, secondTestConnectionYamlFile);

    const file1Result = connectionValidator.validateObject(firstTestConnectionYamlFile, elementsMap);
    const secondFileResult = connectionValidator.validateObject(secondTestConnectionYamlFile, elementsMap);

    expect(file1Result.filesOutput).toHaveLength(0);
    expect(secondFileResult.filesOutput).toHaveLength(0);
  });

  it("Should add warning on every connection, with duplicate combination of properties", () => {
    const firstTestConnectionYamlFile = getConnectionFile({ ...checkedCombination, unique_name: "test" });
    const secondTestConnectionYamlFile = getConnectionFile({ ...checkedCombination, unique_name: "testMap" });
    const elementsMap = buildElementsMap(firstTestConnectionYamlFile, secondTestConnectionYamlFile);

    const firstValidation = connectionValidator.validateObject(firstTestConnectionYamlFile, elementsMap);
    const secondValidation = connectionValidator.validateObject(secondTestConnectionYamlFile, elementsMap);

    expect(firstValidation.filesOutput).toHaveLength(1);
    expect(firstValidation.filesOutput[0].compilationOutput[0].severity).toBe(Severity.Warning);

    expect(secondValidation.filesOutput).toHaveLength(1);
    expect(secondValidation.filesOutput[0].compilationOutput[0].severity).toBe(Severity.Warning);
  });
});
