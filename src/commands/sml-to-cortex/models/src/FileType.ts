// import { ObjectType } from "./ObjectType";

import {SMLObjectType} from "sml-sdk";

export const FILE_TYPE = {
  ...SMLObjectType,
  Unknown: "Unknown",
  Folder: "Folder",
  Text: "Text",
  Environment: "Environment",
} as const;

export const supportedTextFileExtensions = ["md", "gitignore"];
export const supportedEnvExtension = "env";

type ObjectValues<T> = T[keyof T];

export type FileType = ObjectValues<typeof FILE_TYPE>;

export const getDisplayName = (t: FileType): string => {
  switch (t) {
    case SMLObjectType.Model:
      return "Model";
    case SMLObjectType.CompositeModel:
      return "Composite model";
    case SMLObjectType.Catalog:
      return "Catalog";
    case SMLObjectType.Dimension:
      return "Dimension";
    case SMLObjectType.Dataset:
      return "Dataset";
    case SMLObjectType.Metric:
      return "Metric";
    case SMLObjectType.MetricCalc:
      return "Calculation";
    case SMLObjectType.Connection:
      return "Connection";
    case SMLObjectType.RowSecurity:
      return "Row Security";
    default:
      return "Unknown";
  }
};
