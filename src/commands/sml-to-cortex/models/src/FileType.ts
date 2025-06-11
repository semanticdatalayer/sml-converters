import { ObjectType } from "./ObjectType";

export const FILE_TYPE = {
  ...ObjectType,
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
    case ObjectType.Model:
      return "Model";
    case ObjectType.CompositeModel:
      return "Composite model";
    case ObjectType.Catalog:
      return "Catalog";
    case ObjectType.Dimension:
      return "Dimension";
    case ObjectType.Dataset:
      return "Dataset";
    case ObjectType.Measure:
      return "Metric";
    case ObjectType.MeasureCalc:
      return "Calculation";
    case ObjectType.Connection:
      return "Connection";
    case ObjectType.RowSecurity:
      return "Row Security";
    default:
      return "Unknown";
  }
};
