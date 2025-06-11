import { FILE_TYPE } from "../../FileType";
import { FileWithContent } from "../../IFile";
import { OriginType, PACKAGE_ROOT_NAME } from "../../SourceType";

export default class EnvFileBuilder {
  static fileName = ".env";
  static relativePath = `${EnvFileBuilder.fileName}`;

  static create(): EnvFileBuilder {
    return new EnvFileBuilder();
  }

  buildFile(): FileWithContent {
    return {
      compilationOutput: [],
      rawContent: "",
      type: FILE_TYPE.Environment,
      origin: OriginType.Root,
      relativePath: EnvFileBuilder.relativePath,
      packageName: PACKAGE_ROOT_NAME,
    };
  }
}
