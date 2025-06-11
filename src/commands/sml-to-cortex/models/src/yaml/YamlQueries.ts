import Guard from "utils/Guard";

import IYamlParsedFile from "../../src/IYamlParsedFile";
import { ObjectType } from "../../src/ObjectType";
import ValidationError from "../ValidationError";
import IXmlProject from "../xml/IXmlProject";
import YamlDimensionTypeGuard from "./guards/YamlDimensionTypeGuard";
import YamlModelTypeGuard from "./guards/YamlModelTypeGuard";
import { IYamlCompositeModel } from "./IYamlCompositeModel";
import { IYamlConnection } from "./IYamlConnection";
import { IYamlDataset } from "./IYamlDataset";
import {
  IYamlDimension,
  IYamlDimensionLevelAttribute,
  IYamlDimensionRelationship,
  IYamlEmbeddedRelationship,
  YamlDimensionRelationType,
} from "./IYamlDimension";
import { IYamlMeasure, IYamlMeasureCalculated } from "./IYamlMeasure";
import { IYamlModel, IYamlModelMetricsAndCalc, IYamlModelRelationship } from "./IYamlModel";
import { IYamlObject } from "./IYamlObject";
import IYamlQueries from "./IYamlQueries";
import { IYamlRowSecurity } from "./IYamlRowSecurity";

export type IndexedYamlMap<T extends IYamlObject> = Map<string, T>;

export interface IRepoObjectsIndex {
  models: IndexedYamlMap<IYamlModel>;
  datasets: IndexedYamlMap<IYamlDataset>;
  connections: IndexedYamlMap<IYamlConnection>;
  dimensions: IndexedYamlMap<IYamlDimension>;
  measures: IndexedYamlMap<IYamlMeasure>;
  calculations: IndexedYamlMap<IYamlMeasureCalculated>;
  rowSecurity: IndexedYamlMap<IYamlRowSecurity>;
  compositeModels: IndexedYamlMap<IYamlCompositeModel>;
}

const max_recursive_depth = 50;
export class YamlQueries implements IYamlQueries {
  sortYamlModels(yamlModels: IYamlParsedFile<IYamlObject>[]): IRepoObjectsIndex {
    const result: IRepoObjectsIndex = {
      connections: new Map(),
      datasets: new Map(),
      dimensions: new Map(),
      measures: new Map(),
      models: new Map(),
      calculations: new Map(),
      rowSecurity: new Map(),
      compositeModels: new Map(),
    };

    yamlModels.forEach((yamlFile) => {
      this.setYamlFileToRepoObjects(result, yamlFile);
    });

    return result;
  }

  getModelDimensions(dimensions: Array<string>, yamlDimensions: IndexedYamlMap<IYamlDimension>): Array<IYamlDimension> {
    const modelDimensions = this.getMapElementsByList(this.getUnique(dimensions), yamlDimensions);
    modelDimensions.forEach((dim) => {
      this.addEmbeddedDimensions(yamlDimensions, dim, modelDimensions);
    });

    return modelDimensions;
  }

  getModelRowSecurityList(
    rowSecurityList: Array<string>,
    yamlRowSecurityList: IndexedYamlMap<IYamlRowSecurity>
  ): Array<IYamlRowSecurity> {
    const modelDimensions = this.getMapElementsByList(this.getUnique(rowSecurityList), yamlRowSecurityList);

    return modelDimensions;
  }

  getCatalogUsedDimensions(parsedFiles: Array<IYamlParsedFile<IYamlObject>>): Array<IYamlParsedFile<IYamlObject>> {
    const usedDimensions: Array<IYamlDimension> = [];
    const objectIndex = this.sortYamlModels(this.getYamlFilesWithoutDetachedRelationships(parsedFiles));

    objectIndex.models.forEach((yamlModel) => {
      const relatedDimensions = this.getModelDimensions(
        yamlModel.relationships
          .filter(YamlModelTypeGuard.isRegularRelation)
          .map((r) => r.to.dimension)
          .concat(yamlModel.dimensions || []),
        objectIndex.dimensions
      );
      usedDimensions.push(...relatedDimensions);
    });

    const uniqueDimNamesSet = this.getUnique(usedDimensions.map((dim) => dim.unique_name));
    return parsedFiles.filter(({ data: { unique_name } }) => uniqueDimNamesSet.includes(unique_name));
  }

  addEmbeddedDimensions(
    yamlDimensionsIndex: Map<string, IYamlDimension>,
    currentDimension: IYamlDimension,
    modelDimensions: Array<IYamlDimension>,
    dimensionPath: Array<string> = [],
    currentDepth: number = 0
  ): void {
    if (currentDepth > max_recursive_depth) {
      throw new ValidationError(`Max recursive depth exceeded. Dimension Path: ${dimensionPath.join(" -> ")}`);
    }
    if (dimensionPath.includes(currentDimension.unique_name)) {
      //cycle dependency detected. Stop recursion
      return;
    }
    const children: Array<string> = [];

    currentDimension.relationships?.forEach((r) => {
      if (r.type === YamlDimensionRelationType.Embedded && YamlDimensionTypeGuard.isRegularRelation(r)) {
        children.push(r.to.dimension);
      }
    });

    if (children.length) {
      const yamlDimensionChildren = this.getMapElementsByList(children, yamlDimensionsIndex);

      yamlDimensionChildren.forEach((child) =>
        this.addEmbeddedDimensions(
          yamlDimensionsIndex,
          child,
          modelDimensions,
          [...dimensionPath, currentDimension.unique_name],
          currentDepth++
        )
      );

      yamlDimensionChildren.forEach((dim) => {
        const dimensionExist = modelDimensions.some((modelDim) => modelDim.unique_name === dim.unique_name);

        dimensionExist || modelDimensions.push(dim);
      });
    }
  }

  getMapElementsByList<T>(list: Array<string>, mapList: Map<string, T>, acceptMissingItems?: boolean): Array<T> {
    const result: Array<T> = [];

    return list.reduce((acc, itemId) => {
      const item = mapList.get(itemId);

      if (!acceptMissingItems) {
        Guard.exists(item, `Yaml Item "${itemId}" do not exist.`);
      }
      if (item) {
        acc.push(item);
      }

      return acc;
    }, result);
  }

  getMetricsByList<T>(
    list: Array<IYamlModelMetricsAndCalc>,
    mapList: Map<string, T>,
    acceptMissingItems?: boolean
  ): Array<T> {
    const result: Array<T> = [];

    return list.reduce((acc, m) => {
      const item = mapList.get(m.unique_name);

      if (!acceptMissingItems) {
        Guard.exists(item, `Yaml Item "${m.unique_name}" do not exist.`);
      }
      if (item) {
        acc.push(item);
      }

      return acc;
    }, result);
  }

  getModelDatasets(
    yamlDatasets: IndexedYamlMap<IYamlDataset>,
    relatedDimensions: Array<IYamlDimension>,
    relationships: Array<IYamlModelRelationship>,
    metrics: Array<IYamlMeasure>
  ): Array<IYamlDataset> {
    const allAttributes = relatedDimensions.reduce(
      (acc: Array<IYamlDimensionLevelAttribute>, dimFile: IYamlDimension) => [...acc, ...dimFile.level_attributes],
      []
    );

    const degenerateDimensionsDatasets = allAttributes
      .filter(YamlDimensionTypeGuard.isLevelFromOneDataset)
      .map(({ dataset }) => dataset);

    const sharedDegenerateDimensionsDatasets = allAttributes
      .filter(YamlDimensionTypeGuard.isLevelWithMultipleDatasets)
      .flatMap(({ shared_degenerate_columns }) => shared_degenerate_columns)
      .map(({ dataset }) => dataset);

    const datasetNames = [
      ...degenerateDimensionsDatasets,
      ...sharedDegenerateDimensionsDatasets,
      ...relationships.map((r) => r.from.dataset),
      ...metrics.map((m) => m.dataset),
    ];

    const uniqueNames = this.getUnique(datasetNames);

    return this.getMapElementsByList(uniqueNames, yamlDatasets);
  }

  getAllDatasets(yamlDatasets: IndexedYamlMap<IYamlDataset>): Array<IYamlDataset> {
    return Array.from(yamlDatasets.values());
  }

  getYamlFilesWithoutDetachedRelationships(
    parsedFiles: Array<IYamlParsedFile<IYamlObject>>
  ): Array<IYamlParsedFile<IYamlObject>> {
    return parsedFiles.map((yamlFile) => {
      const fileData = yamlFile.data as IYamlModel | IYamlDimension;

      return !fileData.relationships || fileData.relationships.length === 0
        ? yamlFile
        : {
            ...yamlFile,
            data: {
              ...fileData,
              relationships: this.filterRelationships(fileData.relationships as Array<IYamlDimensionRelationship>),
            },
          };
    });
  }

  getAllDataWarehouseConnectionsUsedInRepo(allObjects: IRepoObjectsIndex): Map<string, string[]> {
    const modelsList = new Map<string, Array<string>>();
    Array.from(allObjects.models.values()).forEach((model) => {
      if (model.unique_name) {
        const conIds = this.getAllConnectionUniqueNamesUsedInModel(model, allObjects)
          .map((connection_unique_name) => allObjects.connections.get(connection_unique_name))
          .filter(this.filterUndefined)
          .map((con) => con.as_connection);
        modelsList.set(model.unique_name, this.getUnique(conIds));
      }
    });

    return modelsList;
  }

  getAllEmbeddedRelationshipsFromProject(project: IXmlProject) {
    return (
      project.dimensions?.reduce((a, b) => {
        if (b.embeddedRelationshipsMetadata) {
          a.push(...b.embeddedRelationshipsMetadata);
        }
        return a;
      }, [] as IYamlEmbeddedRelationship[]) ?? []
    );
  }

  getModelDatasetsUniqueNamesUsedInAnyChildObject(model: IYamlModel, allObjects: IRepoObjectsIndex): Array<string> {
    //Get direct datasets unique_names
    const allDatasets = model.relationships.map((r) => r.from.dataset);

    //Get all dimensions
    const regularRelationships: Array<string> = [];
    const modelSecurityRelationships: Array<string> = [];

    model.relationships.forEach((r) => {
      if (YamlModelTypeGuard.isRegularRelation(r)) {
        regularRelationships.push(r.to.dimension);
      }
      if (YamlModelTypeGuard.isSecurityRelation(r)) {
        modelSecurityRelationships.push(r.to.row_security);
      }
    });
    const dimensionsChildDatasets = regularRelationships
      .map((dim_unique_name) => {
        return allObjects.dimensions.get(dim_unique_name);
      })
      .filter((dim): dim is IYamlDimension => dim !== undefined)
      .flatMap((dimension) => this.getDimensionDatasetUniqueNamesInAnyChildObject(dimension, allObjects));

    const modelRowSecurityDatasets = modelSecurityRelationships
      .map((rs_unique_name) => {
        return allObjects.rowSecurity.get(rs_unique_name);
      })
      .filter((rs): rs is IYamlRowSecurity => rs !== undefined)
      .flatMap((rowSecurity) => rowSecurity?.dataset);

    return this.getUnique([...allDatasets, ...dimensionsChildDatasets, ...modelRowSecurityDatasets]);
  }

  private filterRelationships = <T extends IYamlDimensionRelationship>(relationships?: Array<T>): Array<T> => {
    return (
      relationships?.filter((r) => {
        if (r.type === YamlDimensionRelationType.Snowflake) {
          return r.from.dataset.length > 0;
        }
        if (YamlDimensionTypeGuard.isRegularRelation(r)) {
          return r.from.dataset.length > 0 && r.to.dimension.length > 0;
        }
        if (YamlDimensionTypeGuard.isSecurityRelation(r)) {
          return r.from.dataset.length > 0 && r.to.row_security;
        }
      }) || []
    );
  };

  private setYamlFileToRepoObjects(result: IRepoObjectsIndex, yamlFile: IYamlParsedFile<IYamlObject>): void {
    const uniqueName = yamlFile.data.unique_name;
    Guard.ensure(
      !result.models.has(uniqueName),
      `${yamlFile.data.object_type} with uniqueName ${uniqueName} already exists`
    );

    switch (yamlFile.data.object_type) {
      case ObjectType.Connection:
        result.connections.set(uniqueName, yamlFile.data as IYamlConnection);
        break;
      case ObjectType.Dataset:
        result.datasets.set(uniqueName, yamlFile.data as IYamlDataset);
        break;
      case ObjectType.Dimension:
        result.dimensions.set(uniqueName, yamlFile.data as IYamlDimension);
        break;
      case ObjectType.RowSecurity:
        result.rowSecurity.set(uniqueName, yamlFile.data as IYamlRowSecurity);
        break;
      case ObjectType.Measure:
        result.measures.set(uniqueName, yamlFile.data as IYamlMeasure);
        break;
      case ObjectType.MeasureCalc:
        result.calculations.set(uniqueName, yamlFile.data as IYamlMeasureCalculated);
        break;
      case ObjectType.Model:
        result.models.set(uniqueName, yamlFile.data as IYamlModel);
        break;
      case ObjectType.CompositeModel:
        result.compositeModels.set(uniqueName, yamlFile.data as IYamlCompositeModel);
        break;
    }
  }

  private getDimensionDatasetUniqueNamesInAnyChildObject(
    dimension: IYamlDimension,
    allObjects: IRepoObjectsIndex,
    fileChain: Array<IYamlDimension> = [],
    depth = 1
  ): Array<string> {
    if (fileChain.some((dim) => dim.unique_name === dimension.unique_name)) {
      //dimension was already visited. Stop iterating ATSCALE-24341
      return [];
    }
    if (depth > max_recursive_depth) {
      return [];
    }
    const directDatasets = this.filterUndefinedArray(dimension.relationships?.map((r) => r.from.dataset));

    const relationDatasets: Array<string> = [];
    const relationDimensions: Array<string> = [];
    const relationRowSecurities: Array<string> = [];
    (dimension.relationships || []).forEach((r) => {
      relationDatasets.push(r.from.dataset);
      if (YamlDimensionTypeGuard.isRegularRelation(r) && YamlDimensionTypeGuard.isEmbeddedRelation(r)) {
        relationDimensions.push(r.to.dimension);
      }
      if (YamlDimensionTypeGuard.isSecurityRelation(r)) {
        relationRowSecurities.push(r.to.row_security);
      }
    });

    const childDimensionDatasets = relationDimensions
      .map((dim_unique_name) => allObjects.dimensions.get(dim_unique_name))
      .filter(this.filterUndefined)
      .flatMap((dim) =>
        this.getDimensionDatasetUniqueNamesInAnyChildObject(dim, allObjects, [...fileChain, dimension], depth++)
      );

    const childRowSecurityDatasets = relationRowSecurities
      .map((unique_name) => allObjects.rowSecurity.get(unique_name))
      .filter(this.filterUndefined)
      .flatMap((rs) => rs.dataset);

    const hierarchyDatasetUniqueNames = dimension.hierarchies.flatMap((hierarchy) => {
      return hierarchy.levels.flatMap((hierarchyLevel) => {
        const levelDefinition = dimension.level_attributes.find((la) => la.unique_name === hierarchyLevel.unique_name);

        const levelDatasets = levelDefinition
          ? YamlDimensionTypeGuard.isLevelWithMultipleDatasets(levelDefinition)
            ? levelDefinition.shared_degenerate_columns.map(({ dataset }) => dataset)
            : [levelDefinition.dataset]
          : [];

        const aliasesDatasets = this.filterUndefinedArray(hierarchyLevel.aliases?.map((alias) => alias.dataset));

        const secondaryAttributesDatasets = this.filterUndefinedArray(
          hierarchyLevel.secondary_attributes?.map((sa) => sa.dataset)
        );

        const metricalAttributesDatasets = this.filterUndefinedArray(hierarchyLevel.metrics?.map((m) => m.dataset));

        return this.filterUndefinedArray([
          ...levelDatasets,
          ...aliasesDatasets,
          ...secondaryAttributesDatasets,
          ...metricalAttributesDatasets,
          ...childRowSecurityDatasets,
        ]);
      });
    });

    return this.getUnique([
      ...directDatasets,
      ...hierarchyDatasetUniqueNames,
      ...relationDatasets,
      ...childDimensionDatasets,
    ]);
  }

  private getAllConnectionUniqueNamesUsedInModel(model: IYamlModel, allObjects: IRepoObjectsIndex): Array<string> {
    return this.getUnique(
      this.getModelDatasetsUniqueNamesUsedInAnyChildObject(model, allObjects)
        .map((dataset_unique_name) => allObjects.datasets.get(dataset_unique_name))
        .filter(this.filterUndefined)
        .map((dataset) => dataset.connection_id)
    );
  }

  private filterUndefinedArray<T>(values: Array<T | undefined> | undefined): Array<T> {
    if (values === undefined) {
      return [];
    }
    return values.filter(this.filterUndefined);
  }

  private filterUndefined<T>(value: T | undefined): value is T {
    return value !== undefined;
  }

  private getUnique<T>(array: Array<T>): Array<T> {
    return Array.from(new Set(array));
  }
}
