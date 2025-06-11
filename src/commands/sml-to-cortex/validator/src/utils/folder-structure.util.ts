import { IFile } from "models/src/IFile";
import { IFolderStructure } from "models/src/IFolderStructure";

export default class FolderStructureUtil {
  static traverse<T extends IFile>(rootFolder: IFolderStructure<T>, func: (file: T) => void): void {
    //iterate files
    rootFolder.files.forEach(func);
    //iterate subfolders
    rootFolder.folders.flatMap((f) => this.traverse(f, func));
  }
}
