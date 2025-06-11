import { YAMLException } from "js-yaml";

export interface IYamlParser {
  parse: <T = unknown>(input: string) => T;
}

export type YamlParserException = YAMLException;
