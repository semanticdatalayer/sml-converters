import { FileType } from "./FileType";
import { ICompilationOutput } from "./IFileCompilationOutput";
import { IOriginType, OriginType } from "./SourceType";

import { SMLObject } from "sml-sdk";

export interface IFile extends IOriginType {
  relativePath: string;
  compilationOutput: Array<ICompilationOutput>;
  type: FileType;
  data?: Partial<SMLObject> | EnvFileData;
  rawContent?: string;
}

export type BaseFileData = { unique_name: string };

export type EnvFileData = { [key: string]: string };

export const isFileReadOnly = (structure: Pick<IOriginType, "origin">): boolean => {
  return structure?.origin === OriginType.Package || isFolderPackagesRoot(structure);
};

export const isFolderPackagesRoot = (structure: Pick<IOriginType, "origin">): boolean => {
  return structure?.origin === OriginType.PackagesRoot;
};

export type FileWithContent = IFile & { rawContent: string };
