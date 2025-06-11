import { IYamlObject } from "../yaml/IYamlObject";

export interface IYamlSerializer {
  serialize: (input: IYamlObject) => string;
}
