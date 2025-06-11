import yaml from "js-yaml";

import { IYamlParser } from "./IYamlParser";

export default class YamlParser implements IYamlParser {
  parse<T = unknown>(input: string): T {
    return yaml.load(input) as T;
  }
}
