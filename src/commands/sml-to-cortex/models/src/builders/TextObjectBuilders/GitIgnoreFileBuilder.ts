import { AnyObjectBuilder } from "../../../../utils/builders/AnyObjectBuilder";

import { FILE_TYPE } from "../../FileType";
import { FileWithContent, IFile } from "../../IFile";
import { IYamlFile } from "../../IYamlFile";
import { OriginType, PACKAGE_ROOT_NAME } from "../../SourceType";
import EnvFileBuilder from "./EnvFileBuilder";

export default class GitIgnoreFileBuilder extends AnyObjectBuilder<IFile> {
  static fileName = ".gitignore";
  static relativePath = `${GitIgnoreFileBuilder.fileName}`;

  static create(file?: IFile) {
    const defaultFile = {
      compilationOutput: [],
      rawContent: "",
      type: FILE_TYPE.Text,
      origin: OriginType.Root,
      relativePath: GitIgnoreFileBuilder.relativePath,
      packageName: PACKAGE_ROOT_NAME,
    };

    return new GitIgnoreFileBuilder(file || defaultFile);
  }

  contentWithEnvFile(): GitIgnoreFileBuilder {
    return this.addToContent(EnvFileBuilder.fileName);
  }

  private addToContent(text: string): GitIgnoreFileBuilder {
    const newLineMaybe = this.clonedData.rawContent === "" ? "" : "\n";

    return this.mutate((f) => ((f.rawContent = `${f.rawContent}${newLineMaybe}${text}`), f)) as GitIgnoreFileBuilder;
  }

  buildFile(): FileWithContent {
    return this.build() as FileWithContent;
  }

  buildFileForUpdate(): IYamlFile {
    return this.build() as IYamlFile;
  }
}
