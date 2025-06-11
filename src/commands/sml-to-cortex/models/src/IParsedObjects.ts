import IYamlParsedFile from "./IYamlParsedFile";
import { IYamlConnection } from "./yaml/IYamlConnection";
import { IYamlDataset } from "./yaml/IYamlDataset";
import { IYamlDimension } from "./yaml/IYamlDimension";
import { IYamlMeasureBase } from "./yaml/IYamlMeasure";
import { IYamlModel } from "./yaml/IYamlModel";

export default interface IParsedObjects {
  connections: Array<IYamlParsedFile<IYamlConnection>>;
  datasets: Array<IYamlParsedFile<IYamlDataset>>;
  dimensions: Array<IYamlParsedFile<IYamlDimension>>;
  measures: Array<IYamlParsedFile<IYamlMeasureBase>>;
  models: Array<IYamlParsedFile<IYamlModel>>;
}
