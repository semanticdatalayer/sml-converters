import path from "path";
import Guard from "utils/Guard";
import pathUtil from "utils/path.util";

import { FileServiceItemType, IFileService, IFileServiceItem } from "./IFileService";

const excludePaths = [".git"];

export interface IFileSystem {
  readFile(path: string, options: { encoding: "utf8" }): Promise<string | Uint8Array>;
  writeFile(filepath: string, data: Uint8Array | string, options?: { mode: number; encoding: "utf8" }): Promise<void>;
  readdir(folderPath: string): Promise<string[]>;
  stat(path: string): Promise<{ isFile: () => boolean; isDirectory: () => boolean }>;
  rename(oldFilepath: string, newFilepath: string): Promise<void>;
  rmdir(filepath: string, options: undefined, cb: (err: Error) => void): void;
  unlink(filepath: string, cb?: (err: Error) => void): void;
  mkdir(filepath: string, options?: { mode: number; encoding: "utf8" }): Promise<void>;
}

type RmDirInput = { repo: string; path: string } | string;

export abstract class BaseFileService implements IFileService {
  abstract getFileSystem(): IFileSystem;

  readFile(path: string): Promise<string> {
    return this.getFileSystem().readFile(path, { encoding: "utf8" }) as unknown as Promise<string>;
  }

  async createFolder(path: string): Promise<void> {
    const fileSystem = this.getFileSystem();

    await fileSystem.mkdir(path, {
      mode: 0o777,
      encoding: "utf8",
    });
  }

  private getFolderPath(segments: string[], index: number): string {
    const folder = segments.slice(0, index).join("/");
    return `/${folder}`;
  }

  async isFolderExist(folderPath: string): Promise<boolean> {
    try {
      await this.getFileSystem().stat(folderPath);
      return true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return false;
      }
      throw error;
    }
  }

  async doesFileExist(filePath: string): Promise<boolean> {
    try {
      const stat = await this.getFileSystem().stat(filePath);
      return stat.isFile();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return false;
      }
      throw error;
    }
  }

  async createFile(repo: string, relativePath: string, data: string): Promise<void> {
    const fileSystem = this.getFileSystem();
    const path = `/${repo}/${relativePath}`;

    const segments = path.split("/").filter((p) => p !== "");
    for (let i = 1; i < segments.length; i++) {
      const folder = this.getFolderPath(segments, i);
      const isFolderExists = await this.isFolderExist(folder);
      if (!isFolderExists) {
        await fileSystem.mkdir(folder, {
          mode: 0o777,
          encoding: "utf8",
        });
      }
    }

    return await fileSystem.writeFile(path, data, {
      mode: 0o777,
      encoding: "utf8",
    });
  }

  updateFile(repo: string, relativePath: string, data: string): Promise<void> {
    return this.createFile(repo, relativePath, data);
  }

  async getFiles(path: string): Promise<string[]> {
    Guard.notEmpty(path, "getFiles requires none empty path");
    const allItems = await this.getItems(path);
    return allItems.filter((item) => item.type === FileServiceItemType.file).map((item) => item.name);
  }

  async getFileContent(fullPath: string): Promise<string | null> {
    try {
      const blob = await this.getFileSystem().readFile(fullPath, { encoding: "utf8" });

      if (typeof blob === "string") {
        return blob; // already a UTF-8 string
      }

      return Buffer.from(blob).toString("utf8");
    } catch (error) {
      return null;
    }
  }

  async getFolders(path: string): Promise<string[]> {
    Guard.notEmpty(path, "getFolders requires none empty path");
    const allItems = await this.getItems(path);
    return allItems.filter((item) => item.type === FileServiceItemType.folder).map((item) => item.name);
  }

  async getItems(folderPath: string): Promise<IFileServiceItem[]> {
    Guard.notEmpty(folderPath, "getItems requires none empty path");
    const items: IFileServiceItem[] = [];
    const directoryItems = await this.getFileSystem().readdir(folderPath);

    for (const directoryItem of directoryItems) {
      if (excludePaths.includes(directoryItem)) {
        continue;
      }

      const fullPath = path.join(folderPath, directoryItem);
      const stats = await this.getFileSystem().stat(fullPath);

      if (!stats.isDirectory() && !stats.isFile()) {
        continue;
      }

      const item: IFileServiceItem = {
        name: directoryItem,
        fullPath,
        type: stats.isDirectory() ? FileServiceItemType.folder : FileServiceItemType.file,
      };
      items.push(item);
    }

    return items;
  }

  async rename(repo: string, oldFilepath: string, newFilepath: string): Promise<void> {
    return this.getFileSystem().rename(`/${repo}/${oldFilepath}`, `/${repo}/${newFilepath}`);
  }

  async rmDir(input: RmDirInput): Promise<void> {
    if (typeof input === "string") {
      await this.rmDirInternal(input);
    } else {
      await this.rmDirInternal(pathUtil.join(input.repo, input.path));
    }
  }

  protected async rmDirInternal(path: string) {
    try {
      const entries = await this.getFileSystem().readdir(path);

      for (const entry of entries) {
        const entryPath = pathUtil.join(path, entry);
        const stat = await this.getFileSystem().stat(entryPath);

        if (stat.isDirectory()) {
          await this.rmDirInternal(entryPath);
        } else {
          this.getFileSystem().unlink(entryPath);
        }
      }

      return this.getFileSystem().rmdir(path, undefined, (error) => {
        console.log(error);
      });
    } catch (error) {
      console.log(error);
    }
  }

  async unlink(repo: string, path: string): Promise<void> {
    return this.getFileSystem().unlink(`/${repo}/${path}`);
  }
}
