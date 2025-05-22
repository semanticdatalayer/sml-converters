import fs from "fs/promises";
import Guard from "./guard";
import { Stats } from "fs";

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
