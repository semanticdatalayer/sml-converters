import IYamlParsedFile from "models/src/IYamlParsedFile";
import { ObjectType } from "models/src/ObjectType";
import YamlDimensionTypeGuard from "models/src/yaml/guards/YamlDimensionTypeGuard";
import YamlModelTypeGuard from "models/src/yaml/guards/YamlModelTypeGuard";
import { IYamlDimensionCalculationGroup } from "models/src/yaml/IYamlCalculationGroups";
import { IYamlDimension } from "models/src/yaml/IYamlDimension";
import { IYamlMeasure, IYamlMeasureCalculated } from "models/src/yaml/IYamlMeasure";
import { IYamlModel, IYamlModelAggregate } from "models/src/yaml/IYamlModel";
import { IYamlObject } from "models/src/yaml/IYamlObject";
import { ROLE_PLAY_DIMENSION_NAME_PLACEHOLDER } from "models/src/yaml/YamlConstants";
import { byUniqueName } from "utils/find/find.util";
import { isDefined } from "utils/is-defined.util";

import DimensionLevelUtil from "../utils/dimension-level.util";

export interface IQueryableItem {
  queryName: string;
  fullQueryName: string;
  uniqueName: string;
  label: string;
  description?: string;
}

export interface IModelQueryableItem<T extends IYamlObject = IYamlObject> extends IQueryableItem {
  file: IYamlParsedFile<T>;
  fileChain: Array<IYamlParsedFile>;
}

export enum ModelQueryableMetricType {
  Metric = "Metric",
  MetricCalc = "MetricCalc",
  DimensionalMetric = "DimensionalMetric",
}

export interface ModelQueryableSecondaryAttribute extends IQueryableItem {
  folder?: string;
  isHidden?: boolean;
}

export interface ModelQueryableLevel extends IQueryableItem {
  secondaryAttributes: Array<ModelQueryableSecondaryAttribute>;
  folder?: string;
  isHidden?: boolean;
}

export interface ModelQueryableHierarchy extends IQueryableItem {
  levels: Array<ModelQueryableLevel>;
  folder?: string;
}

export interface ModelQueryableCalculationGroup extends IQueryableItem {
  folder?: string;
  calculationMembers: Array<ModelQueryableCalculationMember>;
}

export interface ModelQueryableCalculationMember extends IQueryableItem {}

export type ModelQueryableDimension = IModelQueryableItem<IYamlDimension> & {
  hierarchies: Array<ModelQueryableHierarchy>;
  calculationGroups: Array<ModelQueryableCalculationGroup>;
};

export type ModelQueryableMetric = IModelQueryableItem<IYamlMeasure | IYamlMeasureCalculated> & {
  type: ModelQueryableMetricType;
  folder?: string;
};

export interface IModelQueryableItems {
  dimensions: Array<ModelQueryableDimension>;
  metrics: Array<ModelQueryableMetric>;
  aggregates: Array<IYamlModelAggregate>;
}

interface IItemQueryNameResolver {
  resolve(uniqueName: string): string;
  addRolePlay(rolePlay: string): IItemQueryNameResolver;
}

class DummyQueryNameResolver implements IItemQueryNameResolver {
  static create() {
    return new DummyQueryNameResolver();
  }
  resolve(uniqueName: string): string {
    return uniqueName;
  }

  addRolePlay(rolePlay: string): IItemQueryNameResolver {
    return RolePlayQueryNameResolver.for(rolePlay);
  }
}

class ModelOverrideQueryNameResolver implements IItemQueryNameResolver {
  public static for(model: IYamlModel) {
    return new ModelOverrideQueryNameResolver(model);
  }
  private constructor(private readonly model: IYamlModel) {}
  resolve(uniqueName: string): string {
    return (this.model.overrides || {})[uniqueName]?.query_name || uniqueName;
  }

  addRolePlay(rolePlay: string): IItemQueryNameResolver {
    return RolePlayQueryNameResolver.for(rolePlay);
  }
}

class RolePlayQueryNameResolver implements IItemQueryNameResolver {
  public static for(rolePlay: string) {
    return new RolePlayQueryNameResolver([rolePlay]);
  }
  private constructor(private readonly rolePlays: Array<string>) {}
  resolve(uniqueName: string): string {
    return [...this.rolePlays].reverse().reduce((result, currentRolePlay) => {
      return currentRolePlay.replace(ROLE_PLAY_DIMENSION_NAME_PLACEHOLDER, result);
    }, uniqueName);
  }

  addRolePlay(rolePlay: string): IItemQueryNameResolver {
    return new RolePlayQueryNameResolver([...this.rolePlays, rolePlay]);
  }
}

export class FullQueryNameResolver {
  static create() {
    return new FullQueryNameResolver();
  }

  resolveMetric(queryName: string) {
    return `[Measures].[${queryName}]`;
  }

  resolveDimension(queryName: string) {
    return `[${queryName}]`;
  }

  resolveHierarchy(dimQueryName: string, hierarchyQueryName: string) {
    return `${this.resolveDimension(dimQueryName)}.[${hierarchyQueryName}]`;
  }

  resolveLevel(dimQueryName: string, hierarchyQueryName: string, levelQueryName: string) {
    return `${this.resolveHierarchy(dimQueryName, hierarchyQueryName)}.[${levelQueryName}]`;
  }

  resolveSecondaryAttribute(dimQueryName: string, secondaryAttributeQueryName: string) {
    return `${this.resolveDimension(dimQueryName)}.[${secondaryAttributeQueryName}].[${secondaryAttributeQueryName}]`;
  }

  resolveCalculationGroup(dimQueryName: string, calculationGroupQueryName: string) {
    return `${this.resolveDimension(dimQueryName)}.[${calculationGroupQueryName}]`;
  }

  resolveCalculationMember(
    dimQueryName: string,
    calculationGroupQueryName: string,
    calculationMemberQueryName: string
  ) {
    return `${this.resolveDimension(dimQueryName)}.[${calculationGroupQueryName}].[${calculationMemberQueryName}]`;
  }
}

export class YamlModelQueryNameResolver {
  private fullQueryNameResolver = FullQueryNameResolver.create();

  buildQueryableItems(
    modelFile: IYamlParsedFile<IYamlModel>,
    allItems: Map<string, IYamlParsedFile>
  ): IModelQueryableItems {
    const result: IModelQueryableItems = {
      dimensions: [],
      metrics: [],
      aggregates: [],
    };

    const model = modelFile.data;

    result.metrics = this.getModelMeasures(modelFile, allItems);

    model.dimensions?.forEach((degenDimUniqueName) => {
      this.populateDegenDimension(modelFile, degenDimUniqueName, result, allItems);
    });

    model.relationships
      ?.filter(YamlModelTypeGuard.isRegularRelation)
      .map((relation) => ({
        modelDimUniqueName: relation.to.dimension,
        level: relation.to.level,
        rolePlay: relation.role_play,
      }))
      .forEach(({ modelDimUniqueName, level, rolePlay }) => {
        this.populateModelRelationDimension(modelFile, modelDimUniqueName, level, rolePlay, result, allItems);
      });

    result.aggregates = model.aggregates || [];
    return result;
  }

  private getItem<T extends IYamlObject>(
    uniqueName: string,
    allItems: Map<string, IYamlParsedFile>
  ): IYamlParsedFile<T> | undefined {
    const item = allItems.get(uniqueName) as IYamlParsedFile<T> | undefined;
    return item;
  }

  private getQueryName(model: IYamlModel, uniqueName: string) {
    return (model.overrides || {})[uniqueName]?.query_name || uniqueName;
  }

  private getModelMeasures(
    modelFile: IYamlParsedFile<IYamlModel>,
    allItems: Map<string, IYamlParsedFile>
  ): Array<ModelQueryableMetric> {
    return modelFile.data.metrics
      ? modelFile.data.metrics
          .map((modelMetric) => {
            const metricFile = this.getItem<IYamlMeasure | IYamlMeasureCalculated>(modelMetric.unique_name, allItems);

            if (!metricFile || ![ObjectType.MeasureCalc, ObjectType.Measure].includes(metricFile.data.object_type)) {
              return undefined;
            }

            const queryName = this.getQueryName(modelFile.data, modelMetric.unique_name);

            const type =
              metricFile.data.object_type === ObjectType.MeasureCalc
                ? ModelQueryableMetricType.MetricCalc
                : ModelQueryableMetricType.Metric;

            return {
              queryName,
              fullQueryName: this.fullQueryNameResolver.resolveMetric(queryName),
              uniqueName: modelMetric.unique_name,
              label: metricFile.data.label,
              description: metricFile.data.description,
              file: metricFile,
              fileChain: [],
              type,
              folder: modelMetric.folder,
            };
          })
          .filter(isDefined)
      : [];
  }

  private populateDegenDimension(
    modelFile: IYamlParsedFile<IYamlModel>,
    dimUniqueName: string,
    result: IModelQueryableItems,
    allItems: Map<string, IYamlParsedFile>
  ): void {
    this.populateDimension(
      modelFile,
      dimUniqueName,
      undefined,
      result,
      allItems,
      ModelOverrideQueryNameResolver.for(modelFile.data)
    );
  }

  private populateModelRelationDimension(
    modelFile: IYamlParsedFile<IYamlModel>,
    dimUniqueName: string,
    levelUniqueName: string,
    rolePlay: string | undefined,
    result: IModelQueryableItems,
    allItems: Map<string, IYamlParsedFile>
  ): void {
    const queryNameResolver = rolePlay ? RolePlayQueryNameResolver.for(rolePlay) : DummyQueryNameResolver.create();
    this.populateDimension(modelFile, dimUniqueName, levelUniqueName, result, allItems, queryNameResolver);
  }

  private populateDimension(
    modelFile: IYamlParsedFile<IYamlModel>,
    dimUniqueName: string,
    levelUniqueName: string | undefined,
    result: IModelQueryableItems,
    allItems: Map<string, IYamlParsedFile>,
    queryNameResolver: IItemQueryNameResolver,
    referencePath: Array<IYamlParsedFile> = []
  ): void {
    const dimFile = this.getItem<IYamlDimension>(dimUniqueName, allItems);

    if (!dimFile || dimFile.data.object_type !== ObjectType.Dimension) {
      return;
    }

    const dimQueryName = queryNameResolver.resolve(dimUniqueName);

    const hierarchies: Array<ModelQueryableHierarchy> = dimFile.data.hierarchies
      .filter((h) => {
        if (levelUniqueName === undefined) {
          return true;
        }

        return h.levels.find((l) => l.unique_name === levelUniqueName);
      })
      .map((h) => {
        const hierarchyQueryName = queryNameResolver.resolve(h.unique_name);

        return {
          queryName: hierarchyQueryName,
          fullQueryName: this.fullQueryNameResolver.resolveHierarchy(dimQueryName, hierarchyQueryName),
          uniqueName: h.unique_name,
          label: queryNameResolver.resolve(h.label),
          description: h.description,
          folder: h.folder,
          levels: h.levels.map((l) => {
            l.metrics?.forEach((metricalAttribute) => {
              const fullMetricQueryName = this.fullQueryNameResolver.resolveMetric(metricalAttribute.unique_name);

              result.metrics.push({
                file: {
                  data: {
                    calculation_method: metricalAttribute.calculation_method,
                  },
                } as IYamlParsedFile<IYamlMeasure | IYamlMeasureCalculated>,
                fileChain: [...referencePath],
                queryName: metricalAttribute.unique_name,
                fullQueryName: fullMetricQueryName,
                label: queryNameResolver.resolve(metricalAttribute.label),
                type: ModelQueryableMetricType.DimensionalMetric,
                uniqueName: metricalAttribute.unique_name,
                description: metricalAttribute.description,
                folder: metricalAttribute.folder,
              });
            });

            const levelAttribute = dimFile.data.level_attributes.find(byUniqueName(l.unique_name));
            const levelQueryName = queryNameResolver.resolve(l.unique_name);

            return {
              queryName: levelQueryName,
              fullQueryName: this.fullQueryNameResolver.resolveLevel(dimQueryName, hierarchyQueryName, levelQueryName),
              uniqueName: l.unique_name,
              label: levelAttribute?.label ? queryNameResolver.resolve(levelAttribute.label) : "",
              description: levelAttribute?.description,
              isHidden: levelAttribute && DimensionLevelUtil.isLevelHidden(l, levelAttribute),
              folder: levelAttribute?.folder,
              secondaryAttributes: (l.secondary_attributes || []).map((sa) => {
                const secondaryAttributeQueryName = queryNameResolver.resolve(sa.unique_name);

                return {
                  queryName: secondaryAttributeQueryName,
                  fullQueryName: this.fullQueryNameResolver.resolveSecondaryAttribute(
                    dimQueryName,
                    secondaryAttributeQueryName
                  ),
                  uniqueName: sa.unique_name,
                  label: queryNameResolver.resolve(sa.label),
                  description: sa.description,
                  folder: sa.folder,
                  isHidden: sa.is_hidden,
                } satisfies ModelQueryableSecondaryAttribute;
              }),
            } satisfies ModelQueryableLevel;
          }),
        } satisfies ModelQueryableHierarchy;
      });

    const calculationGroups = this.populateCalculationGroups(dimFile.data.calculation_groups, dimUniqueName);

    const fullDimQueryName = this.fullQueryNameResolver.resolveDimension(dimQueryName);

    // Add hierarchies to it's respective dimension if it does not already exists
    const existingDimension = result.dimensions.find((qd) => qd.fullQueryName === fullDimQueryName);
    if (existingDimension) {
      hierarchies.forEach((h) => {
        const hierarchyExists = existingDimension.hierarchies.some((qh) => qh.fullQueryName === h.fullQueryName);
        if (hierarchyExists) {
          return;
        }

        existingDimension.hierarchies.push(h);
      });
      return;
    }

    const dimensionQueryableItem: ModelQueryableDimension = {
      queryName: dimQueryName,
      fullQueryName: fullDimQueryName,
      uniqueName: dimUniqueName,
      label: queryNameResolver.resolve(dimFile.data.label),
      description: dimFile.data.description,
      hierarchies,
      file: dimFile,
      fileChain: [...referencePath],
      calculationGroups,
    };

    result.dimensions.push(dimensionQueryableItem);

    dimFile.data.relationships?.forEach((rel) => {
      if (YamlDimensionTypeGuard.isSecurityRelation(rel) || !YamlDimensionTypeGuard.isEmbeddedRelation(rel)) {
        return;
      }
      const resolver = rel.role_play ? queryNameResolver.addRolePlay(rel.role_play) : queryNameResolver;
      this.populateDimension(modelFile, rel.to.dimension, rel.to.level, result, allItems, resolver, [
        ...referencePath,
        dimFile,
      ]);
    });
  }

  private populateCalculationGroups(
    calculationGroups: Array<IYamlDimensionCalculationGroup> | undefined,
    dimUniqueName: string
  ) {
    if (!calculationGroups) {
      return [];
    }

    return calculationGroups.map((cg) => {
      const calculationMembers = cg.calculated_members.map((cm) => {
        return {
          uniqueName: cm.unique_name,
          queryName: cm.unique_name,
          fullQueryName: this.fullQueryNameResolver.resolveCalculationMember(
            dimUniqueName,
            cg.unique_name,
            cm.unique_name
          ),
          label: cm.unique_name,
          description: cm.description,
        } satisfies ModelQueryableCalculationMember;
      });

      return {
        uniqueName: cg.unique_name,
        queryName: cg.unique_name,
        fullQueryName: this.fullQueryNameResolver.resolveCalculationGroup(dimUniqueName, cg.unique_name),
        label: cg.label,
        folder: cg.folder,
        calculationMembers,
      } satisfies ModelQueryableCalculationGroup;
    });
  }
}
