import { YamlQueries } from "models/src/yaml/YamlQueries";
import { JestMocker } from "utils/service-builder/JestMocker";
import { FunctionsAreAsync, ServiceBuilder } from "utils/service-builder/ServiceBuilder";

const asyncMetadata: FunctionsAreAsync<YamlQueries> = {
  sortYamlModels: false,
  getModelDimensions: false,
  getMapElementsByList: false,
  getModelDatasets: false,
  getAllDatasets: false,
  addEmbeddedDimensions: false,
  getYamlFilesWithoutDetachedRelationships: false,
  getMetricsByList: false,
  getAllDataWarehouseConnectionsUsedInRepo: false,
  getModelRowSecurityList: false,
  getCatalogUsedDimensions: false,
  getAllEmbeddedRelationshipsFromProject: false,
  getModelDatasetsUniqueNamesUsedInAnyChildObject: false,
};

export class YamlQueriesBuilder extends ServiceBuilder<YamlQueries> {
  static create() {
    const defaultImplementation = JestMocker.create().mockService(YamlQueries);
    return new YamlQueriesBuilder(defaultImplementation, asyncMetadata)
      .toBuilderWithServiceMethods()
      .getMetricsByList.result([]);
  }
}
