import { FunctionsAreAsync, ServiceBuilder } from "utils/service-builder/ServiceBuilder";

import { IFileService } from "../FileService/IFileService";

const asyncMetadata: FunctionsAreAsync<IFileService> = {
  getItems: true,
  getFiles: true,
  getFileContent: true,
  getFolders: true,
  readFile: true,
  createFile: true,
  rename: true,
  updateFile: true,
  isFolderExist: true,
  doesFileExist: true,
  rmDir: true,
  unlink: true,
  createFolder: true,
};

export default class FileServiceBuilder extends ServiceBuilder<IFileService> {
  static create() {
    const defaultImplementation: IFileService = {
      getItems: jest.fn().mockResolvedValue([]),
      getFiles: jest.fn().mockResolvedValue([]),
      getFileContent: jest.fn().mockResolvedValue("Test"),
      getFolders: jest.fn().mockResolvedValue([]),
      readFile: jest.fn(),
      createFile: jest.fn(),
      rename: jest.fn(),
      updateFile: jest.fn(),
      isFolderExist: jest.fn().mockResolvedValue(false),
      doesFileExist: jest.fn().mockResolvedValue(false),
      rmDir: jest.fn().mockResolvedValue({}),
      unlink: jest.fn().mockResolvedValue({}),
      createFolder: jest.fn(),
    };
    return new FileServiceBuilder(defaultImplementation, asyncMetadata).toBuilderWithServiceMethods();
  }
}
