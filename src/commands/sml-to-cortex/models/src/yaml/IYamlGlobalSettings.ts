import { IYamlObject } from "./IYamlObject";

export const GLOBAL_SETTINGS_FILE_NAME = "global_settings.yml";

export interface ISetting {
  [key: string]: string | boolean | number;
}

export interface IYamlGlobalSettings extends IYamlObject {
  overrides?: ISetting;
}
