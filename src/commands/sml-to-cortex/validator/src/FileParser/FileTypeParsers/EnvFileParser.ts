import * as dotenv from "dotenv";
import { IParsedFile } from "models/src/IParsedFile";
import IRawFile from "models/src/IRawFile";

import { IFileTypeParser } from "../IFileParser";

export default class EnvFileParser implements IFileTypeParser {
  static create(): IFileTypeParser {
    return new EnvFileParser();
  }

  parse(rawFile: IRawFile): IParsedFile<object> {
    return {
      ...rawFile,
      data: dotenv.parse(rawFile.rawContent),
      compilationOutput: [],
    };
  }
}
