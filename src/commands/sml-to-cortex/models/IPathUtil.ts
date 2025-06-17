export interface IPathUtil {
  join(path1: string, path2: string): string;
  getExtensionFromPath(input: string): string;
}
