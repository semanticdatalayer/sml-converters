export enum RepoType {
  Catalog = "catalog",
  GlobalSettings = "global_settings",
}

export interface IRepo {
  id: string;
  name: string;
  url: string;
  type: RepoType;
  canAccess?: boolean;
}
