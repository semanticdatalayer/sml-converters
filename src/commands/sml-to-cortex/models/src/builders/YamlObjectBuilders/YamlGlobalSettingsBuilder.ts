import { IYamlFile } from "../../IYamlFile";
import { 
  SMLObjectType,
  SML_GLOBAL_SETTINGS_FILE_NAME,
  SMLGlobalSettings
} from "sml-sdk";
// import { GLOBAL_SETTINGS_FILE_NAME, IYamlGlobalSettings } from "../../yaml/IYamlGlobalSettings";
import { IBuildYamlFileInput, YamlObjectBuilder } from "./YamlObjectBuilder";

export class YamlGlobalSettingsBuilder extends YamlObjectBuilder<SMLGlobalSettings, YamlGlobalSettingsBuilder> {
  static create(): YamlGlobalSettingsBuilder {
    const defaultData = {
      object_type: SMLObjectType.GlobalSettings,
    };

    return new YamlGlobalSettingsBuilder(defaultData as SMLGlobalSettings);
  }

  buildYamlFile(path?: string | IBuildYamlFileInput): IYamlFile<SMLGlobalSettings> {
    return super.buildYamlFile(path || SML_GLOBAL_SETTINGS_FILE_NAME);
  }
}
