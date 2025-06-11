import { IParsedFile } from "models/src/IParsedFile";
import IRawFile from "models/src/IRawFile";
import pathUtil from "utils/path.util";

import EnvFileParser from "./FileTypeParsers/EnvFileParser";
import JsonFileParser from "./FileTypeParsers/JsonFileParser";
import YamlFileParser from "./FileTypeParsers/YamlFileParser";
import { FileParserFileType, IFileParser, IFileTypeParser } from "./IFileParser";

export type FileTypeMapping = Record<FileParserFileType, IFileTypeParser>;

const defaultMapping: FileTypeMapping = {
  yaml: YamlFileParser.create(),
  yml: YamlFileParser.create(),
  json: JsonFileParser.create(),
  env: EnvFileParser.create(),
};

export default class FileParser implements IFileParser {
  constructor(private readonly mappings: FileTypeMapping = defaultMapping) {}

  static create(): IFileParser {
    return new FileParser();
  }
  parseRawContent<T extends object>(rawFileContent: string, type: FileParserFileType = "yaml"): T {
    const rawFile: IRawFile = {
      rawContent: rawFileContent,
      relativePath: `name.${type}`,
    };
    const parsedData = this.parse(rawFile);
    return parsedData.data as T;
  }
  parse(rawFile: IRawFile): IParsedFile {
    const extension = pathUtil.getExtensionFromPath(rawFile.relativePath);
    if (!extension) {
      return this.defaultParser().parse(rawFile);
    }

    const parser = this.mappings[extension as FileParserFileType] || this.defaultParser();

    return parser.parse(rawFile);
  }

  defaultParser(): IFileParser {
    return {
      parse(rawFile: IRawFile): IParsedFile {
        return { ...rawFile, data: rawFile.rawContent, compilationOutput: [] };
      },
      parseRawContent<T>(rawFileContent: string) {
        return rawFileContent as T;
      },
    };
  }
}
