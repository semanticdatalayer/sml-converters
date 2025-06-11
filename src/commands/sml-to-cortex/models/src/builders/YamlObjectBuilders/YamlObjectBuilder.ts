import { AnyObjectBuilder } from "utils/builders/AnyObjectBuilder";

import { IYamlFile } from "../../IYamlFile";
import { OriginType, PACKAGE_ROOT_NAME } from "../../SourceType";
import { IYamlObject } from "../../yaml/IYamlObject";
import YamlSerializer from "../../YamlSerializer/YamlSerizlizer";

export interface IBuildYamlFileInput {
  relativePath: string;
}

export const isIBuildYamlFileInput = (input: unknown): input is IBuildYamlFileInput => {
  return !!(input as IBuildYamlFileInput).relativePath;
};
export class YamlObjectBuilder<T extends IYamlObject, Builder extends AnyObjectBuilder<T>> extends AnyObjectBuilder<T> {
  with(data: Partial<T>): Builder {
    return super.with(data) as Builder;
  }

  uniqueName(unique_name: string): Builder {
    return this.with({ unique_name } as Partial<T>) as Builder;
  }

  private getRelativePath(path?: string | IBuildYamlFileInput): string {
    if (path && isIBuildYamlFileInput(path)) {
      return path.relativePath;
    }

    const data = this.clonedData;
    const defaultPath = `${data.object_type}/`;

    let folderPath = path !== undefined ? path : `${defaultPath}${data.unique_name}`;
    if (!folderPath.endsWith(".yml")) folderPath = `${folderPath}.yml`;
    return folderPath;
  }

  buildYamlFile(path?: string | IBuildYamlFileInput, packageName: string = PACKAGE_ROOT_NAME): IYamlFile<T> {
    const data = this.clonedData;

    const relativePath = this.getRelativePath(path);

    const yamlSerializer = new YamlSerializer();

    return {
      compilationOutput: [],
      data,
      rawContent: yamlSerializer.serialize(data),
      type: data.object_type,
      origin: OriginType.Root,
      relativePath,
      packageName,
    };
  }
  buildYamlFileForPackage(path?: string): IYamlFile<T> {
    return { ...this.buildYamlFile(path), origin: OriginType.Package, packageName: "Shared" };
  }
}
