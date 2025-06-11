export enum FileServiceItemType {
  file = "file",
  folder = "folder",
}

export interface IFileServiceItem {
  name: string;
  fullPath: string;
  type: FileServiceItemType;
}
type RmDirInput = { repo: string; path: string } | string;
export interface IFileService {
  readFile(path: string): Promise<string>;

  createFolder(path: string): Promise<void>;

  getFiles(path: string): Promise<Array<string>>;

  getFileContent(repo: string, relativePath: string): Promise<string | null>;

  getFolders(path: string): Promise<Array<string>>;

  getItems(path: string): Promise<Array<IFileServiceItem>>;

  createFile(repo: string, relativePath: string, data: string): Promise<void>;

  updateFile(repo: string, relativePath: string, data: string): Promise<void>;

  rename(repo: string, oldFilepath: string, newFilepath: string): Promise<void>;

  rmDir(input: RmDirInput): Promise<void>;

  unlink(repo: string, path: string): Promise<void>;

  isFolderExist(folderPath: string): Promise<boolean>;

  doesFileExist(filePath: string): Promise<boolean>;
}
