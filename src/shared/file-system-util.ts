import fs from "fs/promises";
import Guard from "./guard";
import { Stats } from "fs";
import fileSystem from 'fs/promises';
import path from 'path';

const getPathExistsFun = (typeGuard: (stat: Stats) => void) => {
  return async (path: string) => {
    try {
      const stat = await fs.stat(path);
      typeGuard(stat);
      return true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return false;
      }
      throw error;
    }
  };
};

export const fileSystemUtil = {
  folderExists: getPathExistsFun((stat) =>
    Guard.should(stat.isDirectory(), `The path should be a folder`),
  ),
  fileExists: getPathExistsFun((stat) =>
    Guard.should(stat.isFile(), `The path should be a file`),
  ),
};

export const getFilesAndFolders = async (
    // copied from dbt-parser.ts
    folderPath: string
  ): Promise<{ 
    folders: Array<string>;
    files: Array<string>;
  }> => {
    const filesOrFolders = await fileSystem.readdir(folderPath);

    const result: {
      folders: Array<string>;
      files: Array<string>;
    } = {
      folders: [],
      files: [],
    };
    const statPromises = filesOrFolders
      .filter((x) => !x.startsWith("."))
      .map(async (x) => {
        const filePath = path.join(folderPath, x);
        const statResult = await fileSystem.stat(filePath);
          return {
              name: x,
              statResult,
          };
      });

    const stats = await Promise.all(statPromises);
    stats.forEach((fileOrFolder) => {
      if (fileOrFolder.statResult.isDirectory()) {
        result.folders.push(fileOrFolder.name);
      } else if (fileOrFolder.statResult.isFile()) {
        result.files.push(fileOrFolder.name);
      }
    });

    return result;
}