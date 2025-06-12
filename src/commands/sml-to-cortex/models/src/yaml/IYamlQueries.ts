import {
  SMLDataset,
  SMLDimension,
  SMLMetric,
  SMLModel,
  SMLModelMetricsAndCalc,
  SMLModelRelationship,
  SMLObject,
  SMLRowSecurity
} from "sml-sdk"

import IYamlParsedFile from "../IYamlParsedFile";
// import { IYamlDataset } from "./IYamlDataset";
// import { IYamlDimension } from "./IYamlDimension";
// import { IYamlMeasure } from "./IYamlMeasure";
// import { IYamlModel, IYamlModelMetricsAndCalc, IYamlModelRelationship } from "./IYamlModel";
// import { IYamlObject } from "./IYamlObject";
// import { IYamlRowSecurity } from "./IYamlRowSecurity";
import { IndexedYamlMap, IRepoObjectsIndex } from "./YamlQueries";

export default interface IYamlQueries {
  sortYamlModels(yamlModels: IYamlParsedFile<SMLObject>[]): IRepoObjectsIndex;
  getModelDimensions(dimensions: Array<string>, yamlDimensions: IndexedYamlMap<SMLDimension>): Array<SMLDimension>;
  getModelDatasets(
    yamlDatasets: IndexedYamlMap<SMLDataset>,
    relatedDimensions: Array<SMLDimension>,
    relationships: Array<SMLModelRelationship>,
    metrics: Array<SMLMetric>
  ): Array<SMLDataset>;
  getAllDatasets(yamlDatasets: IndexedYamlMap<SMLDataset>): Array<SMLDataset>;
  getMapElementsByList<T>(list: Array<string>, mapList: Map<string, T>, acceptMissing?: boolean): Array<T>;
  getYamlFilesWithoutDetachedRelationships(
    parsedFiles: Array<IYamlParsedFile<SMLObject>>
  ): Array<IYamlParsedFile<SMLObject>>;
  getAllDataWarehouseConnectionsUsedInRepo(allObjects: IRepoObjectsIndex): Map<string, string[]>;
  getModelRowSecurityList(
    rowSecurityList: Array<string>,
    yamlRowSecurityList: IndexedYamlMap<SMLRowSecurity>
  ): Array<SMLRowSecurity>;
  getCatalogUsedDimensions(parsedFiles: Array<IYamlParsedFile<SMLObject>>): Array<IYamlParsedFile<SMLObject>>;
  getMetricsByList<T>(
    list: Array<SMLModelMetricsAndCalc>,
    mapList: Map<string, T>,
    acceptMissingItems?: boolean
  ): Array<T>;
  getModelDatasetsUniqueNamesUsedInAnyChildObject(model: SMLModel, allObjects: IRepoObjectsIndex): Array<string>;
}
