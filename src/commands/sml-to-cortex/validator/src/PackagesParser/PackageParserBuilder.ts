import { FunctionsAreAsync, ServiceBuilder } from "utils/service-builder/ServiceBuilder";

import { IPackageParser } from "./PackagesParser";

const asyncMetadata: FunctionsAreAsync<IPackageParser> = {
  getPackageRepoPath: false,
  getPackages: true,
  parsePackageConfig: false,
  parseVersion: false,
  getPackagesDiff: false,
  arePackagesEqual: false,
  getNewCommitVersion: false,
};

export class PackageParserBuilder extends ServiceBuilder<IPackageParser> {
  static create() {
    const defaultImplementation: IPackageParser = {
      getPackageRepoPath: jest.fn().mockReturnValue(""),
      getPackages: jest.fn().mockResolvedValue([]),
      parsePackageConfig: jest.fn().mockReturnValue({}),
      parseVersion: jest.fn().mockReturnValue({}),
      getPackagesDiff: jest.fn().mockReturnValue([]),
      arePackagesEqual: jest.fn().mockReturnValue(false),
      getNewCommitVersion: jest.fn().mockRejectedValue(""),
    };
    return new PackageParserBuilder(defaultImplementation, asyncMetadata).toBuilderWithServiceMethods();
  }
}
