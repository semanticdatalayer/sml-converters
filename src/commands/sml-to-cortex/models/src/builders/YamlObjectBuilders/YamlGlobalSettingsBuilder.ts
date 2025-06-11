import { IYamlFile } from "../../IYamlFile";
import { ObjectType } from "../../ObjectType";
import { GLOBAL_SETTINGS_FILE_NAME, IYamlGlobalSettings } from "../../yaml/IYamlGlobalSettings";
import { IBuildYamlFileInput, YamlObjectBuilder } from "./YamlObjectBuilder";

export class YamlGlobalSettingsBuilder extends YamlObjectBuilder<IYamlGlobalSettings, YamlGlobalSettingsBuilder> {
  static create(): YamlGlobalSettingsBuilder {
    const defaultData = {
      object_type: ObjectType.GlobalSettings,
    };

    return new YamlGlobalSettingsBuilder(defaultData as IYamlGlobalSettings);
  }

  buildYamlFile(path?: string | IBuildYamlFileInput): IYamlFile<IYamlGlobalSettings> {
    return super.buildYamlFile(path || GLOBAL_SETTINGS_FILE_NAME);
  }
}
