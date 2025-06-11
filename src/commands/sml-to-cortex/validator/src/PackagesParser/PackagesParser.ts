// import * as _ from "lodash";
import { ILogger } from "models/src/ILogger";
import { IYamlPackage, IYamlPackageFile, PACKAGE_FILE_NAME, PackageVersion } from "models/src/yaml/IYamlPackageFile";
import errorUtil from "utils/error.util";
import Guard from "utils/Guard";
import pathUtil from "utils/path.util";

import FileParser from "../FileParser/FileParser";
import { IFileService } from "../FileService/IFileService";
import { PackageDiffBuilder } from "./PackageDiffBuilder";

export interface IPackageDiff {
  added: Array<IYamlPackage>;
  modified: Array<IYamlPackage>;
  deleted: Array<IYamlPackage>;
}

export interface IPackageParser {
  parsePackageConfig(fileContent: string): IYamlPackageFile;
  getPackages(repoName: string): Promise<Array<IYamlPackage>>;
  getPackageRepoPath(repoName: string, moduleName: string): string;
  parseVersion(version: string): PackageVersion;
  getPackagesDiff(currentPackages: Array<IYamlPackage>, incomingPackages: Array<IYamlPackage>): IPackageDiff;
  arePackagesEqual(source: IYamlPackage, target: IYamlPackage): boolean;
  getNewCommitVersion(version: string): string;
}

export class PackageParser implements IPackageParser {
  constructor(
    private readonly fileService: IFileService,
    private readonly logger: ILogger
  ) {}

  parsePackageConfig(fileContent: string, throwOnError = false): IYamlPackageFile {
    const defaultResponse: IYamlPackageFile = {
      packages: [],
      version: 1,
    };
    try {
      const result = FileParser.create().parseRawContent<IYamlPackageFile>(fileContent, "yml");
      if (typeof result !== "object") {
        throw Error("Invalid package format.");
      }
      return result;
    } catch (error) {
      const message = `Error parsing packages config file. Original error: ${errorUtil.getErrorMessage(error)}`;
      this.logger.error(message);
      if (throwOnError) {
        throw Error(message);
      }
      return defaultResponse;
    }
  }

  async getPackages(repoName: string): Promise<Array<IYamlPackage>> {
    const packages: Array<IYamlPackage> = [];
    const pathToPackages = pathUtil.getPath(repoName, PACKAGE_FILE_NAME);
    const fileExists = await this.fileService.doesFileExist(pathToPackages);
    if (fileExists) {
      try {
        const file = await this.fileService.readFile(pathToPackages);
        const packageConfig = this.parsePackageConfig(file);
        return packageConfig.packages;
      } catch (error) {
        this.logger.error(`Error reading packages config file. Original error: ${errorUtil.getErrorMessage(error)}`);
        return packages;
      }
    }

    return packages;
  }

  getPackagesDiff(currentPackages: Array<IYamlPackage>, incomingPackages: Array<IYamlPackage>): IPackageDiff {
    const result = PackageDiffBuilder.create().build();

    // added
    incomingPackages.forEach((inPkg) => {
      const existing = currentPackages.find((p) => p.name === inPkg.name);
      if (!existing) {
        result.added.push(inPkg);
      }
    });
    // deleted
    currentPackages.forEach((pkg) => {
      const existing = incomingPackages.find((p) => p.name === pkg.name);

      if (!existing) {
        result.deleted.push(pkg);
      } else if (!this.arePackagesEqual(pkg, existing)) {
        // modified
        result.modified.push(existing);
      }
    });

    return result;
  }

  arePackagesEqual(source: IYamlPackage, target: IYamlPackage) {
    return (
      source.url === target.url &&
      source.branch === target.branch &&
      source.name === target.name &&
      source.version === target.version
    );
  }

  public getPackageRepoPath(repoName: string, moduleName: string) {
    const repo = repoName.replace(new RegExp("/", "g"), "").trim();

    return `/${repo}${moduleName}_package`;
  }

  parseVersion(version: string): PackageVersion {
    Guard.ensure(version.startsWith("commit:"), "invalid package version. Supported values: 'commit:sha'");
    return {
      commitId: version.replace("commit:", "").trim(),
    };
  }

  getNewCommitVersion(version: string): string {
    return `commit:${version}`;
  }
}
