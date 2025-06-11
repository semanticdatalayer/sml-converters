import EnvFileTypeValidator from "./env/EnvFileTypeValidator";
import JsonFileTypeValidator from "./json/JsonFileTypeValidator";
import { IFileTypeValidator, IFileTypeValidatorFactory } from "./model";
import YamlFileTypeValidator from "./yaml/YamlFileTypeValidator";

const defaultMappings: Record<string, IFileTypeValidator> = {
  yml: new YamlFileTypeValidator(),
  yaml: new YamlFileTypeValidator(),
  json: new JsonFileTypeValidator(),
  env: new EnvFileTypeValidator(),
};

export default class FileTypeValidatorFactory implements IFileTypeValidatorFactory {
  constructor(private readonly mappings: Record<string, IFileTypeValidator> = defaultMappings) {}

  getValidator(path: string): IFileTypeValidator {
    const extension = this.getExtensionFromPath(path);
    if (!extension) {
      return this.dummyValidator();
    }
    const validator = this.mappings[extension];

    return validator || this.dummyValidator();
  }

  private dummyValidator(): IFileTypeValidator {
    return { getErrors: () => [] };
  }

  getExtensionFromPath(path: string): string | undefined {
    const lastPathIndex = path.lastIndexOf("/");
    const fileStartIndex = lastPathIndex === -1 ? 0 : lastPathIndex + 1;
    const fileName = path.substring(fileStartIndex);
    const lastIndexOfDot = fileName.lastIndexOf(".");

    if (lastIndexOfDot === -1 || lastIndexOfDot === fileName.length - 1) {
      return undefined;
    }

    return fileName.substring(lastIndexOfDot + 1);
  }
}
