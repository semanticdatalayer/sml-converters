import IYamlParsedFile from "../IYamlParsedFile";
import { IYamlDataset } from "./IYamlDataset";
import { IYamlDimension } from "./IYamlDimension";
import { IYamlMeasure } from "./IYamlMeasure";
import { IYamlModel, IYamlModelMetricsAndCalc, IYamlModelRelationship } from "./IYamlModel";
import { IYamlObject } from "./IYamlObject";
import { IYamlRowSecurity } from "./IYamlRowSecurity";
import { IndexedYamlMap, IRepoObjectsIndex } from "./YamlQueries";

export default interface IYamlQueries {
  sortYamlModels(yamlModels: IYamlParsedFile<IYamlObject>[]): IRepoObjectsIndex;
  getModelDimensions(dimensions: Array<string>, yamlDimensions: IndexedYamlMap<IYamlDimension>): Array<IYamlDimension>;
  getModelDatasets(
    yamlDatasets: IndexedYamlMap<IYamlDataset>,
    relatedDimensions: Array<IYamlDimension>,
    relationships: Array<IYamlModelRelationship>,
    metrics: Array<IYamlMeasure>
  ): Array<IYamlDataset>;
  getAllDatasets(yamlDatasets: IndexedYamlMap<IYamlDataset>): Array<IYamlDataset>;
  getMapElementsByList<T>(list: Array<string>, mapList: Map<string, T>, acceptMissing?: boolean): Array<T>;
  getYamlFilesWithoutDetachedRelationships(
    parsedFiles: Array<IYamlParsedFile<IYamlObject>>
  ): Array<IYamlParsedFile<IYamlObject>>;
  getAllDataWarehouseConnectionsUsedInRepo(allObjects: IRepoObjectsIndex): Map<string, string[]>;
  getModelRowSecurityList(
    rowSecurityList: Array<string>,
    yamlRowSecurityList: IndexedYamlMap<IYamlRowSecurity>
  ): Array<IYamlRowSecurity>;
  getCatalogUsedDimensions(parsedFiles: Array<IYamlParsedFile<IYamlObject>>): Array<IYamlParsedFile<IYamlObject>>;
  getMetricsByList<T>(
    list: Array<IYamlModelMetricsAndCalc>,
    mapList: Map<string, T>,
    acceptMissingItems?: boolean
  ): Array<T>;
  getModelDatasetsUniqueNamesUsedInAnyChildObject(model: IYamlModel, allObjects: IRepoObjectsIndex): Array<string>;
}
