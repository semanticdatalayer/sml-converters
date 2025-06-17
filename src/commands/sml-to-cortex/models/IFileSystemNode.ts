import { IFile } from "./IFile";
import { IFolderStructure } from "./IFolderStructure";

export type IFileSystemNode = IFile | IFolderStructure<IFile>;
