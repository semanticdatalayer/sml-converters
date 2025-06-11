import { IYamlDatasetModelProps, IYamlDatasetProjectProps } from "./IYamlDataset";
import { IYamlObject } from "./IYamlObject";

export interface IYamlCatalog extends IYamlObject, IYamlDatasetsProperties {
  version: number;
  aggressive_agg_promotion: boolean;
  build_speculative_aggs: boolean;
}

export interface IYamlDatasetProperties {
  [dataset: string]: IYamlDatasetProjectProps | IYamlDatasetModelProps;
}

export interface IYamlDatasetsProperties {
  dataset_properties?: IYamlDatasetProperties;
}
