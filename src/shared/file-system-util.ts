import fs from "fs/promises";
import Guard from "./guard";
import { Stats } from "fs";
import fileSystem from 'fs/promises';
import path from 'path';
import { Logger } from "./logger";
import { Command } from "@oclif/core";

export type convertInput = {
  sourcePath: string;
  outputPath: string;
  clean: boolean;
}

export async function parseInput(
    input: convertInput,
    logger: Logger,
    command: Command
  ): Promise<{
    absoluteSourcePath: string;
    absoluteOutputPath: string;
  }> {
    const absoluteSourcePath = path.resolve(input.sourcePath);
    const inputFolderExists = await fileSystemUtil.folderExists(
      absoluteSourcePath,
    );
    Guard.should(
      inputFolderExists,
      `The source folder (${absoluteSourcePath}) does not exists`,
    );

    const absoluteOutputPath = path.resolve(input.outputPath);

    const outputPathExists = await fileSystemUtil.folderExists(
      absoluteOutputPath,
    );

    if (outputPathExists) {
      const outputSubItems = await fs.readdir(absoluteOutputPath);
      const contents = outputSubItems.filter((n) => n !== ".git");
      const hasContents = contents.length > 0;

      // clear out the folder if user uses --clean
      if (hasContents) {
        const outputNotEmptyMsg = `Output folder "${absoluteOutputPath}" is not empty.`;
        if (!input.clean) {
          logger.error(outputNotEmptyMsg);
        } else {
          logger.warn(
            `${outputNotEmptyMsg}. --clean flag is provided to remove folder contents`,
          );
          await cleanUpOutputFolder(absoluteOutputPath, contents, logger);
          logger.info("Output folder contents deleted");
        }
      }
    } else {
      await fs.mkdir(absoluteOutputPath);
    }

    return {
      absoluteSourcePath,
      absoluteOutputPath,
    };
  }

export async function cleanUpOutputFolder(
    outputAbsolutePath: string,
    contents: Array<string>,
    logger: Logger,
  ): Promise<void> {
    for (const item of contents) {
      if (item === ".git") continue;

      const itemPath = path.join(outputAbsolutePath, item);
      const stat = await fs.lstat(itemPath);

      if (stat.isDirectory()) {
        logger.info(`${itemPath} - deleting folder and all its contents`);
        await fs.rm(itemPath, { recursive: true, force: true });
      } else {
        logger.info(`${itemPath} - deleting file`);
        await fs.unlink(itemPath);
      }
    }
  }

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

/**
 * Ensures that the specified directory exists. If the directory structure does not exist, it is created recursively.
 *
 * @param directory - The path of the directory to ensure exists.
 * @returns A promise that resolves when the directory exists or is created.
 * @throws Will throw an error if the directory cannot be created for reasons other than it already existing.
 */
export async function ensureDir(directory: string) {
  try {
    await fs.mkdir(directory, { recursive: true });
  } catch (error: any) {
    // Ignore error if directory already exists
    throw error;
  }
}
