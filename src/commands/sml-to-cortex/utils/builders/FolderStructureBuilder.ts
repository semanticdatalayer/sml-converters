import { FileType } from "../../models/src/FileType";
import { IFile } from "../../models/src/IFile";
import { IFolderStructure } from "../../models/src/IFolderStructure";
import { OriginType, PACKAGE_ROOT_NAME } from "../../models/src/SourceType";

import { IYamlFile } from "../../models/src/IYamlFile";
import pathUtil from "../path.util";
import { AnyObjectBuilder } from "./AnyObjectBuilder";

export const createEmptyFolder = (path = "", packageName = PACKAGE_ROOT_NAME): IFolderStructure<IFile> => {
  return {
    path: path,
    files: [],
    folders: [],
    origin: OriginType.Root,
    packageName,
  };
};

export const createEmptyFile = (path = "", type: FileType = "Unknown", packageName = PACKAGE_ROOT_NAME): IFile => {
  return {
    relativePath: path,
    origin: OriginType.Root,
    compilationOutput: [],
    type: type,
    packageName,
  };
};

export const createEmptyYamlFile = (
  path = "",
  type: FileType = "Unknown",
  packageName = PACKAGE_ROOT_NAME
): IYamlFile => {
  return {
    relativePath: path,
    origin: OriginType.Root,
    rawContent: "",
    data: {} as any,
    compilationOutput: [],
    type: type,
    packageName,
  };
};

export class YamlFileBuilder {
  static create(file?: Partial<IYamlFile>): YamlFileBuilder {
    const merged = Object.assign(createEmptyYamlFile(), { ...file });
    return new YamlFileBuilder(merged);
  }

  constructor(private file: IYamlFile) {}

  setOriginAsSubmodule(): YamlFileBuilder {
    Object.assign(this.file, { origin: OriginType.Package });

    return this;
  }

  build(): IYamlFile {
    return Object.assign({}, this.file);
  }
}

class FolderBuilder {
  constructor(private folder: IFolderStructure<IFile>) {}

  addFile(
    path: string,
    type: FileType = "Unknown",
    origin = OriginType.Root,
    packageName = PACKAGE_ROOT_NAME
  ): FolderBuilder {
    this.folder.files.push({
      type: type,
      compilationOutput: [],
      relativePath: path,
      rawContent: undefined,
      origin,
      packageName,
    });

    return this;
  }

  addFolder(path: string, origin = OriginType.Root, packageName = PACKAGE_ROOT_NAME): FolderBuilder {
    this.folder.folders.push({
      path,
      files: [],
      folders: [],
      origin,
      packageName,
    });

    return this;
  }

  addNestedFolder(folder: IFolderStructure<IFile>): FolderBuilder {
    this.folder.folders.push(new FolderBuilder(folder).create());

    return this;
  }

  create(): IFolderStructure<IFile> {
    return Object.assign({}, this.folder);
  }
}

export class FolderStructureBuilder extends AnyObjectBuilder<IFolderStructure<IFile>> {
  static create(rootPath: string, packageName = PACKAGE_ROOT_NAME): FolderStructureBuilder {
    return new FolderStructureBuilder({
      files: [],
      folders: [],
      origin: OriginType.Root,
      path: rootPath,
      packageName,
    });
  }

  folder(path: string, origin = OriginType.Root, packageName = PACKAGE_ROOT_NAME): FolderBuilder {
    if (path !== this.clonedData.path) {
      const newFolder = {
        path: path,
        files: [],
        folders: [],
        origin,
        packageName,
      };
      return new FolderBuilder(newFolder);
    } else {
      return new FolderBuilder(this.clonedData);
    }
  }

  addRootFile(path: string, type: FileType = "Unknown", rawContent?: string): FolderStructureBuilder {
    const newData = this.clonedData;
    newData.files.push({
      type: type,
      compilationOutput: [],
      relativePath: path,
      rawContent,
      origin: OriginType.Root,
      packageName: PACKAGE_ROOT_NAME,
    });

    return new FolderStructureBuilder(newData);
  }

  addFolder(folder: IFolderStructure<IFile>): FolderStructureBuilder {
    const newData = this.clonedData;
    newData.folders.push(folder);

    return new FolderStructureBuilder(newData);
  }

  addFile(path: string, type: FileType = "Unknown", origin = OriginType.Root): FolderStructureBuilder {
    const segments = path.split("/").filter((p) => p !== "");
    if (segments.length === 1) {
      //add to root
      return this.addRootFile(path, type);
    }

    //traverse the folders crate if nto existing
    const newData = this.clonedData;
    let currentFolder = newData;
    for (let index = 0; index < segments.length - 1; index++) {
      const folderName = segments[index];
      const existingFolder = currentFolder.folders.find(
        (f) => f.path === pathUtil.join(currentFolder.path, folderName)
      );
      if (existingFolder) {
        currentFolder = existingFolder;
      } else {
        const newFolder: IFolderStructure<IFile> = {
          files: [],
          folders: [],
          origin: origin,
          path: pathUtil.join(currentFolder.path, folderName),
          packageName: currentFolder.packageName,
        };
        currentFolder.folders.push(newFolder);
        currentFolder = newFolder;
      }
    }

    //Add the file in the end
    currentFolder.files.push({
      compilationOutput: [],
      origin: origin,
      relativePath: pathUtil.join(currentFolder.path, segments[segments.length - 1]),
      type,
      packageName: currentFolder.packageName,
    });

    return new FolderStructureBuilder(newData);
  }

  build(): IFolderStructure<IFile> {
    return this.clonedData;
  }
}
