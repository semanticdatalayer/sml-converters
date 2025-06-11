import { IYamlCatalog } from "./yaml/IYamlCatalog";
import { IYamlCompositeModel } from "./yaml/IYamlCompositeModel";
import { IYamlConnection } from "./yaml/IYamlConnection";
import { IYamlDataset } from "./yaml/IYamlDataset";
import { IYamlDimension } from "./yaml/IYamlDimension";
import { IYamlMeasure, IYamlMeasureCalculated } from "./yaml/IYamlMeasure";
import { IYamlModel } from "./yaml/IYamlModel";
import { IYamlRowSecurity } from "./yaml/IYamlRowSecurity";

export interface IConverterResult {
  connections: Array<IYamlConnection>;
  models: Array<IYamlModel>;
  datasets: Array<IYamlDataset>;
  dimensions: Array<IYamlDimension>;
  measures: Array<IYamlMeasure>;
  measuresCalculated: Array<IYamlMeasureCalculated>;
  catalog: IYamlCatalog;
  rowSecurity: Array<IYamlRowSecurity>;
  compositeModels: Array<IYamlCompositeModel>;
}
