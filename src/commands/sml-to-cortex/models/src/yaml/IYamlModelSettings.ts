import { ObjectType } from "../ObjectType";

export const MODEL_SETTINGS_FILE_NAME = "model_settings.yml";

export interface ISetting {
  [key: string]: string | boolean | number;
}

export interface IModelSettings {
  [key: string]: ISetting;
}

export interface IYamlModelSettings {
  object_type: ObjectType;
  overrides?: IModelSettings;
}
