import { IOriginType } from "./SourceType";

export interface IFolderStructure<T> extends IOriginType {
  path: string;
  folders: Array<IFolderStructure<T>>;
  files: Array<T>;
}
