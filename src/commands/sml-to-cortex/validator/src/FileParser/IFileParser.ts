import { IParsedFile } from "models/src/IParsedFile";
import IRawFile from "models/src/IRawFile";

export type FileParserFileType = "yaml" | "yml" | "json" | "env";

export interface IFileParser extends IFileTypeParser {
  parseRawContent<T extends object>(rawFileContent: string, type?: FileParserFileType): T;
}

export interface IFileTypeParser {
  parse: (rawFile: IRawFile) => IParsedFile;
}
