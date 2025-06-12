import { SMLObject } from "sml-sdk";

export interface IYamlSerializer {
  serialize: (input: SMLObject) => string;
}
