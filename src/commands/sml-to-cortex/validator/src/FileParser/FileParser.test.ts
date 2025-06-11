import IRawFile from "models/src/IRawFile";

import FileParser, { FileTypeMapping } from "./FileParser";
import EnvFileParser from "./FileTypeParsers/EnvFileParser";
import JsonFileParser from "./FileTypeParsers/JsonFileParser";
import YamlFileParser from "./FileTypeParsers/YamlFileParser";

const yamlParser = YamlFileParser.create();

const defaultMapping: FileTypeMapping = {
  yaml: yamlParser,
  yml: YamlFileParser.create(),
  json: JsonFileParser.create(),
  env: EnvFileParser.create(),
};

const getFile = (file: Partial<IRawFile> = {}): IRawFile => {
  const defaultData: IRawFile = {
    rawContent: "test",
    relativePath: "test.yaml",
  };

  return Object.assign(defaultData, file);
};

describe("FileParser", () => {
  it("Should call the correct file type parser", () => {
    yamlParser.parse = jest.fn();
    const fileParser = new FileParser(defaultMapping);
    const file = getFile();

    fileParser.parse(file);

    expect(yamlParser.parse).toHaveBeenCalled();
  });

  it("Should call default parser in case of invalid extension type", () => {
    const file = getFile({ relativePath: "test.txt" });
    const fileParser = new FileParser(defaultMapping);
    fileParser.defaultParser = jest.fn().mockReturnValue({
      parse: jest.fn(),
    });

    fileParser.parse(file);

    expect(fileParser.defaultParser).toHaveBeenCalled();
  });

  it("Should call default parser in case of a missing extension", () => {
    const file = getFile({ relativePath: "noExtension" });
    const fileParser = new FileParser(defaultMapping);
    fileParser.defaultParser = jest.fn().mockReturnValue({
      parse: jest.fn(),
    });

    fileParser.parse(file);

    expect(fileParser.defaultParser).toHaveBeenCalled();
  });
});
