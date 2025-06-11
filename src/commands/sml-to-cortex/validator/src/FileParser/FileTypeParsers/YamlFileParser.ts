import { JSON_SCHEMA, load } from "js-yaml";
import { IParsedFile } from "models/src/IParsedFile";
import IRawFile from "models/src/IRawFile";
import { IYamlObject } from "models/src/yaml/IYamlObject";

import { IFileTypeParser } from "../IFileParser";

/*
 *  JSON_SCHEMA is used, instead of the default one,
 *  because it does not parse the timestamps as objects.
 */

export default class YamlFileParser implements IFileTypeParser {
  static create(): IFileTypeParser {
    return new YamlFileParser();
  }

  parse(rawFile: IRawFile): IParsedFile<object> {
    const yamlObject = load(rawFile.rawContent, {
      schema: JSON_SCHEMA,
    }) as IYamlObject;

    return {
      ...rawFile,
      data: yamlObject,
      compilationOutput: [],
    };
  }
}
