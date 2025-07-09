export enum OriginType {
  Root = "R",
  PackagesRoot = "PR",
  Package = "P",
}

export const PACKAGE_ROOT_NAME = "Root";

export interface IOriginType {
  origin: OriginType;
  packageName: string;
}
