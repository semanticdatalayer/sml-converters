import TypeGuardUtil from "./guards/type-guard-util";

export const PACKAGE_FILE_NAME = "package.yml";

export interface IYamlPackage {
  name: string;
  url: string;
  branch: string;
  version: string; // "commit:sha" "latest" "tag:"
}

export interface IYamlPackageChange {
  name: string;
  commit: string;
}

export interface PackageVersionCommit {
  commitId: string;
}

export type PackageVersion = PackageVersionCommit;

export interface IYamlPackageFile {
  version: number;
  packages: Array<IYamlPackage>;
}

export const PackageVersionTypeGuard = {
  isCommit: (input: PackageVersion): input is PackageVersionCommit =>
    TypeGuardUtil.hasProps<PackageVersionCommit>(input, "commitId"),
};
