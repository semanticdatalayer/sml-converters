export enum ObjectType {
  Catalog = "catalog",
  Model = "model",
  ModelSettings = "model_settings",
  GlobalSettings = "global_settings",
  Dimension = "dimension",
  Dataset = "dataset",
  Measure = "metric",
  MeasureCalc = "metric_calc",
  Connection = "connection",
  RowSecurity = "row_security",
  CompositeModel = "composite_model",
}

export const NODE_TYPE_FOLDER = "Folder";

export type NodeType = ObjectType | typeof NODE_TYPE_FOLDER;
