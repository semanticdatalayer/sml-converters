import { AnyObjectBuilder } from "../../../../utils/builders/AnyObjectBuilder";

import {
  SMLObjectType,
  SMLModelSettings,
  SML_MODEL_SETTINGS_FILE_NAME
} from "sml-sdk";

import { IYamlPartialFile } from "../../IYamlFile";
// import { ObjectType } from "../../ObjectType";
import { OriginType, PACKAGE_ROOT_NAME } from "../../SourceType";
// import { IYamlModelSettings, MODEL_SETTINGS_FILE_NAME } from "../../yaml/IYamlModelSettings";
import YamlSerializer from "../../YamlSerializer/YamlSerizlizer";
import { IBuildYamlFileInput, isIBuildYamlFileInput } from "./YamlObjectBuilder";

export class YamlModelSettingsBuilder extends AnyObjectBuilder<SMLModelSettings> {
  static create(): YamlModelSettingsBuilder {
    const defaultData: SMLModelSettings = {
      object_type: SMLObjectType.ModelSettings,
    };

    return new YamlModelSettingsBuilder(defaultData);
  }

  public with(data: Partial<SMLModelSettings>): YamlModelSettingsBuilder {
    return super.with(data) as YamlModelSettingsBuilder;
  }

  private getRelativePath(path?: string | IBuildYamlFileInput): string {
    if (path && isIBuildYamlFileInput(path)) {
      return path.relativePath;
    }

    let relativePath = path !== undefined ? path : `${SML_MODEL_SETTINGS_FILE_NAME}`;
    if (!relativePath.endsWith(".yml")) relativePath = `${relativePath}.yml`;
    return relativePath;
  }

  buildYamlFile(path?: string | IBuildYamlFileInput): IYamlPartialFile<SMLModelSettings> {
    const data = this.clonedData;

    const relativePath = this.getRelativePath(path);

    const yamlSerializer = new YamlSerializer();

    return {
      compilationOutput: [],
      data,
      rawContent: yamlSerializer.serialize(data),
      type: SMLObjectType.ModelSettings,
      origin: OriginType.Root,
      relativePath,
      packageName: PACKAGE_ROOT_NAME,
    };
  }
}
