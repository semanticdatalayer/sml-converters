import { IYamlObject } from "./IYamlObject";

export interface IYamlConnection extends IYamlObject {
  as_connection: string;
  database: string;
  schema: string;
  override?: boolean;
}
