import fs from "fs/promises";

import { BaseFileService, IFileSystem } from "./BaseFileService";

export default class LocalFileService extends BaseFileService {
  getFileSystem(): IFileSystem {
    return fs;
  }
}
