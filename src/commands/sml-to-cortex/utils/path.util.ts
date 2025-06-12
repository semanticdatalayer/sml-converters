import { Guard } from "../../../shared/guard"
// import Guard from "./Guard";

const windowsPathSeparator = "\\";
const linuxPathSeparator = "/";
const allowedPathSeparators = [linuxPathSeparator, windowsPathSeparator];

class PathUtil {
  private _pathSeparator = "/";
  private _pathSeparatorChanged = false;

  get pathSeparator() {
    return this._pathSeparator;
  }
  set pathSeparator(value: string) {
    Guard.should(
      !this._pathSeparatorChanged,
      `Path separator is already changed to ${this._pathSeparator}. For protection it can be set only once.`
    );
    Guard.should(
      allowedPathSeparators.includes(value),
      `Cannot set pathSeparator to '${value}'. It is invalid. It should be one of: ${allowedPathSeparators.join(",")}`
    );
    this._pathSeparatorChanged = true;
    this._pathSeparator = value;
  }

  private joinTwo(path1: string, path2: string): string {
    if (path1 === "") {
      return path2;
    }

    if (path2 === "") {
      return path1;
    }

    const realPath1 = path1.endsWith(this.pathSeparator) ? path1.slice(undefined, path1.length - 1) : path1;
    const realPath2 = path2.startsWith(this.pathSeparator) ? path2.slice(1) : path2;

    return `${realPath1}${this.pathSeparator}${realPath2}`;
  }

  join(...paths: Array<string>): string {
    Guard.ensure(paths.length > 1, "Cannot join path for less than two paths");
    return paths.slice(1).reduce((acc, path) => this.joinTwo(acc, path), paths[0]);
  }

  areEqual(path1: string | undefined, path2: string | undefined): boolean {
    if (path1 === path2) {
      return true;
    }

    if (path1 === undefined || path2 === undefined) {
      return false;
    }

    //cut leading path separators
    let modifiedPath1 = path1.startsWith(this.pathSeparator) ? path1.substring(1) : path1;
    let modifiedPath2 = path2.startsWith(this.pathSeparator) ? path2.substring(1) : path2;

    //cut trailing separators
    if (modifiedPath1.endsWith(this.pathSeparator)) {
      modifiedPath1 = modifiedPath1.substring(0, modifiedPath1.length - 1);
    }
    if (modifiedPath2.endsWith(this.pathSeparator)) {
      modifiedPath2 = modifiedPath2.substring(0, modifiedPath2.length - 1);
    }

    return modifiedPath1 === modifiedPath2;
  }

  getExtensionFromPath(path: string): string | undefined {
    const lastPathIndex = path.lastIndexOf(this.pathSeparator);
    const fileStartIndex = lastPathIndex === -1 ? 0 : lastPathIndex + 1;
    const fileName = path.substring(fileStartIndex);
    const lastIndexOfDot = fileName.lastIndexOf(".");

    if (lastIndexOfDot === -1 || lastIndexOfDot === fileName.length - 1) {
      return undefined;
    }

    return fileName.substring(lastIndexOfDot + 1);
  }

  getFileNameFromPath(path: string): string {
    const lastSlashIndex = path.lastIndexOf(this.pathSeparator);

    if (lastSlashIndex !== -1) {
      return path.substring(lastSlashIndex + 1);
    }
    return path;
  }

  getFileNameFromPathWithoutExtension(path: string): string {
    const fileName = this.getFileNameFromPath(path);
    const extension = this.getExtensionFromPath(path);
    return !extension ? fileName : fileName.replace("." + extension, "");
  }

  isFileOnRootLevel(path: string): boolean {
    const lastSlashIndex = path.lastIndexOf(this.pathSeparator);

    if (lastSlashIndex === -1) {
      return true;
    }

    const filePath = path.substring(0, lastSlashIndex);
    if (!filePath.length) {
      return true;
    } else {
      return false;
    }
  }

  getPath(rootFolder: string, relativeFolder: string): string {
    const shouldStartWithSlash = this.pathSeparator === linuxPathSeparator;
    let path = `${rootFolder}${relativeFolder}`;

    if (rootFolder.endsWith(this.pathSeparator) && relativeFolder.startsWith(this.pathSeparator))
      path = `${rootFolder}${relativeFolder.slice(1)}`;
    if (!rootFolder.endsWith(this.pathSeparator) && !relativeFolder.startsWith(this.pathSeparator))
      path = `${rootFolder}${this.pathSeparator}${relativeFolder}`;

    if (shouldStartWithSlash && !path.startsWith(this.pathSeparator)) return `${this.pathSeparator}${path}`;

    return path;
  }

  getPathWithoutFileName(path: string): string {
    if (this.isFileOnRootLevel(path)) {
      return this.pathSeparator;
    }

    const lastPathSeparatorIndex = path.lastIndexOf(this.pathSeparator);
    return path.substring(0, lastPathSeparatorIndex);
  }

  rewriteFolderPath(oldFullPath: string, folderName: string): string {
    Guard.ensure(
      oldFullPath.startsWith(this.pathSeparator) && oldFullPath.endsWith(this.pathSeparator),
      "Path is not a folder path"
    );

    const pathArray = oldFullPath.split(this.pathSeparator).filter((path) => path !== "");
    const newArray = [...pathArray.slice(0, -1), folderName];

    return `${this.pathSeparator}${newArray.join(this.pathSeparator)}${this.pathSeparator}`;
  }

  getFolderPath(path: string, folderName: string) {
    return `${path}${folderName}${this.pathSeparator}`;
  }

  /**
   * Example:
   * @param path
   * file path: datasets/datecustom.yml;
   * folder path: datasets/
   * @returns
   * file path: datasets/;
   * folder path: [] // root
   */
  getFolders(path: string) {
    const isFolder = this.isFolderPath(path);

    const folders = path.split("/").filter((p) => p !== "");

    if (!isFolder) {
      return folders.slice(0, -1);
    }

    return folders;
  }

  isFolderPath(path: string) {
    return path.endsWith(this.pathSeparator);
  }

  getParentFolderPath(path: string) {
    const isFolder = this.isFolderPath(path);
    let folders = this.getFolders(path);
    folders = isFolder ? folders.slice(0, -1) : folders;

    return `${folders.join(this.pathSeparator)}${this.pathSeparator}`;
  }
}

const pathUtil = new PathUtil();

export default pathUtil;
