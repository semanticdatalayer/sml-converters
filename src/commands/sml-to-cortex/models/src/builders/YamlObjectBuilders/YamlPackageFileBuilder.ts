import { AnyObjectBuilder } from "../../../../utils/builders/AnyObjectBuilder";

import { FileWithContent } from "../../IFile";
import { OriginType, PACKAGE_ROOT_NAME } from "../../SourceType";
import { SMLPackage, SMLPackageFile, SML_PACKAGE_FILE_NAME } from "sml-sdk";
import YamlSerializer from "../../YamlSerializer/YamlSerizlizer";
import { IBuildYamlFileInput, isIBuildYamlFileInput } from "./YamlObjectBuilder";

export class YamlPackageFileBuilder extends AnyObjectBuilder<SMLPackageFile> {
  static create(): YamlPackageFileBuilder {
    const defaultData: SMLPackageFile = {
      version: 1,
      packages: [],
    };

    return new YamlPackageFileBuilder(defaultData);
  }

  public with(data: Partial<SMLPackageFile>): YamlPackageFileBuilder {
    return super.with(data) as YamlPackageFileBuilder;
  }

  /**
   * Intended use for test purposes, it does not sanitize the input
   * @param data package to add
   * @returns new builder
   */
  public addPackage(data: Partial<SMLPackage>): YamlPackageFileBuilder {
    return this.with({ packages: [...this.clonedData.packages, data as SMLPackage] });
  }

  public version(version: number): YamlPackageFileBuilder {
    return this.with({ version });
  }

  private getRelativePath(path?: string | IBuildYamlFileInput): string {
    if (path && isIBuildYamlFileInput(path)) {
      return path.relativePath;
    }

    let relativePath = path !== undefined ? path : `/${SML_PACKAGE_FILE_NAME}`;
    if (!relativePath.endsWith(".yml")) relativePath = `${relativePath}.yml`;
    return relativePath;
  }

  buildYamlFile(path?: string | IBuildYamlFileInput): FileWithContent {
    const data = this.clonedData;

    const relativePath = this.getRelativePath(path);

    const yamlSerializer = new YamlSerializer();

    return {
      compilationOutput: [],
      rawContent: yamlSerializer.serialize(data),
      type: "Text",
      origin: OriginType.Root,
      relativePath,
      packageName: PACKAGE_ROOT_NAME,
    };
  }
}
