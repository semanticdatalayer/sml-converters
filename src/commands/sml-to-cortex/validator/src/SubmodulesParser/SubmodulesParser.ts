import pathUtil from "utils/path.util";

import { IFileService } from "../FileService/IFileService";

export interface SubmoduleInfo {
  name: string;
  url: string;
  branch?: string;
}

const SUBMODULES_CONFIG_FILE = ".gitmodules";

export interface ISubmodulesParser {
  parseSubmodulesConfig(fileContent: string): SubmoduleInfo[];
  getSubmodules(rootFolder: string | undefined): Promise<Array<SubmoduleInfo>>;
  getSubmoduleRepoPath(repoName: string, moduleName: string): string;
}

export class SubmodulesParser implements ISubmodulesParser {
  constructor(private readonly fileService: IFileService) {}

  public parseSubmodulesConfig(fileContent: string): SubmoduleInfo[] {
    const submodules = new Array<SubmoduleInfo>();
    const submodulesConfig = fileContent.split("[submodule").filter((s) => s.length > 0);

    for (const config of submodulesConfig) {
      const lines = config.split("\n");

      const name = lines[1].split("=")[1].trim();
      const url = lines[2].split("=")[1].trim();
      let branch = "";
      if (lines.length > 2) {
        branch = lines[3].split("=")[1].trim();
      }

      if (!name) {
        throw new Error("submodule branch name not specified");
      }

      if (!url) {
        throw new Error("submodule branch url not specified");
      }

      submodules.push({
        name,
        url,
        branch,
      });
    }

    return submodules;
  }

  public async getSubmodules(rootFolder: string | undefined): Promise<Array<SubmoduleInfo>> {
    try {
      if (!rootFolder) return [];
      const path = pathUtil.getPath(rootFolder, SUBMODULES_CONFIG_FILE);

      const file = await this.fileService.readFile(path);
      const content = this.parseSubmodulesConfig(file);

      return content;
    } catch (err) {
      return [];
    }
  }

  public getSubmoduleRepoPath(repoName: string, moduleName: string) {
    return `/${repoName}${moduleName}_submodule`;
  }
}
