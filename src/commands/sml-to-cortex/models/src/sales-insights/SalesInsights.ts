import AnyYamlObjectBuilder from "../builders/YamlObjectBuilders/AnyYamlObjectBuilder";
import YamlCatalogBuilder from "../builders/YamlObjectBuilders/YamlCatalogBuilder";
import { deepFreeze } from "../deepFreeze";
import { IFile } from "../IFile";
import { IFolderStructure } from "../IFolderStructure";
import { IYamlFile } from "../IYamlFile";
import { SMLObjectType } from "sml-sdk";
import { OriginType, PACKAGE_ROOT_NAME } from "../SourceType";
import { SMLObject } from "sml-sdk";
import { calculations } from "./yaml-objects/calculations";
import { connections } from "./yaml-objects/connections";
import { datasets } from "./yaml-objects/datasets";
import { dimensions } from "./yaml-objects/dimensions";
import { metrics } from "./yaml-objects/metrics";
import { models } from "./yaml-objects/models";
import { row_securities } from "./yaml-objects/row_security";

const createYamlFiles = <T extends SMLObject>(objects: Array<T>): Array<IYamlFile> => {
  return objects.map((yamlObject) => Object.freeze(AnyYamlObjectBuilder.create(yamlObject).buildYamlFile()));
};

const files = {
  calculations: createYamlFiles(calculations.all),
  connections: createYamlFiles(connections.all),
  datasets: createYamlFiles(datasets.all),
  dimensions: createYamlFiles(dimensions.all),
  metrics: createYamlFiles(metrics.all),
  models: createYamlFiles(models.all),
  row_securities: createYamlFiles(row_securities.all),
};

const catalogBuilder = YamlCatalogBuilder.create().with({
  label: "Sales InsightsCatalog",
  unique_name: "Sales Insights Catalog",
});

const catalog = catalogBuilder.build();
const catalogFile = catalogBuilder.buildYamlFile();

const buildObjectTypeFolder = (type: SMLObjectType, files: Array<IYamlFile>): IFolderStructure<IFile> => {
  return {
    files,
    folders: [],
    origin: OriginType.Root,
    packageName: PACKAGE_ROOT_NAME,
    path: "",
  };
};

const rootFolder: IFolderStructure<IFile> = {
  files: [catalogFile],
  folders: [
    buildObjectTypeFolder(SMLObjectType.MetricCalc, files.calculations),
    buildObjectTypeFolder(SMLObjectType.Connection, files.connections),
    buildObjectTypeFolder(SMLObjectType.Dataset, files.datasets),
    buildObjectTypeFolder(SMLObjectType.Dimension, files.dimensions),
    buildObjectTypeFolder(SMLObjectType.Metric, files.metrics),
    buildObjectTypeFolder(SMLObjectType.Model, files.models),
    buildObjectTypeFolder(SMLObjectType.RowSecurity, files.row_securities),
  ],
  origin: OriginType.Root,
  packageName: PACKAGE_ROOT_NAME,
  path: "/",
};

const salesInsightsDef = {
  rootFolder,
  objects: {
    catalog,
    calculations,
    connections,
    datasets,
    dimensions,
    metrics,
    models,
    row_securities,
  },
  allFiles: [
    catalogFile,
    ...files.calculations,
    ...files.connections,
    ...files.datasets,
    ...files.dimensions,
    ...files.metrics,
    ...files.models,
    ...files.row_securities,
  ],
};

export const salesInsights: typeof salesInsightsDef = deepFreeze(salesInsightsDef);
