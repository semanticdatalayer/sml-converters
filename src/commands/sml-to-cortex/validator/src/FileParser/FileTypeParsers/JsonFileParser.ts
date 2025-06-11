import { IParsedFile } from "models/src/IParsedFile";
import IRawFile from "models/src/IRawFile";

import { IFileTypeParser } from "../IFileParser";

export default class JsonFileParser implements IFileTypeParser {
  static create(): IFileTypeParser {
    return new JsonFileParser();
  }

  parse(rawFile: IRawFile): IParsedFile<object> {
    return {
      ...rawFile,
      data: JSON.parse(rawFile.rawContent),
      compilationOutput: [],
    };
  }
}
