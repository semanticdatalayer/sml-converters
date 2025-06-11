import jsyaml, { YAMLException } from "js-yaml";
import errorUtil from "utils/error.util";

import { IFileTypeValidator } from "../model";

export default class YamlFileTypeValidator implements IFileTypeValidator {
  getErrors(content: string): string[] {
    const result: Array<string> = [];
    try {
      jsyaml.load(content);
    } catch (e) {
      if (e instanceof YAMLException) {
        result.push(e.message);
      } else {
        result.push(`Unknown yaml parsing error: ${errorUtil.getErrorMessage(e)}`);
      }
    }
    return result;
  }
}
