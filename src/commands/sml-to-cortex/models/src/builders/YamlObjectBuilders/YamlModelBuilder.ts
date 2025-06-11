import { ObjectType } from "../../ObjectType";
import YamlDimensionTypeGuard from "../../yaml/guards/YamlDimensionTypeGuard";
import { IYamlDatasetProperties } from "../../yaml/IYamlCatalog";
import { IYamlDatasetModelProps, IYamlDatasetProjectProps } from "../../yaml/IYamlDataset";
import {
  IYamlModel,
  IYamlModelAggregate,
  IYamlModelDrillThrough,
  IYamlModelMetricsAndCalc,
  IYamlModelOverride,
  IYamlModelPartition,
  IYamlModelPerspective,
  IYamlModelRelationship,
  PartitionType,
} from "../../yaml/IYamlModel";
import YamlModelRelationBuilder from "./YamlModelRelationBuilder";
import { YamlObjectBuilder } from "./YamlObjectBuilder";
import YamlPerspectiveBuilder from "./YamlPerspectiveBuilder";

export default class YamlModelBuilder extends YamlObjectBuilder<IYamlModel, YamlModelBuilder> {
  static create(): YamlModelBuilder {
    const defaultValues: IYamlModel = {
      label: "no label",
      relationships: [],
      metrics: [],
      object_type: ObjectType.Model,
      unique_name: "no unique name",
    };

    return new YamlModelBuilder(defaultValues);
  }

  withRelationships(relationships: IYamlModelRelationship[]): YamlModelBuilder {
    return this.with({
      relationships,
    });
  }

  addEmptyRelationships(): YamlModelBuilder {
    return this.with({
      relationships: [],
    });
  }

  addEmptyPerspectives(): YamlModelBuilder {
    return this.with({
      perspectives: [],
    });
  }

  addRelationship(data: Partial<IYamlModelRelationship> = {}): YamlModelBuilder {
    const defaultData: IYamlModelRelationship = YamlModelRelationBuilder.create().build();

    return this.withRelationships([...(this.clonedData.relationships || []), Object.assign(defaultData, data)]);
  }

  addOrphanDataset(dataset_unique_name: string): YamlModelBuilder {
    return this.addRelationship({ from: { dataset: dataset_unique_name, join_columns: [] } });
  }

  addOrphanDimension(dim_unique_name: string): YamlModelBuilder {
    return this.addRelationship({ to: { dimension: dim_unique_name, level: "" } });
  }

  addDegenerateDimension(dimUniqueName: string): YamlModelBuilder {
    return this.with({ dimensions: [...(this.clonedData.dimensions || []), dimUniqueName] });
  }

  addDegenerateDimensions(dimensions: string[]): YamlModelBuilder {
    return this.with({ dimensions: [...(this.clonedData.dimensions || []), ...dimensions] });
  }

  addMetric(meticUniqueName: string): YamlModelBuilder {
    return this.with({ metrics: [...(this.clonedData.metrics || []), { unique_name: meticUniqueName }] });
  }

  addMetricsCollection(...metrics: Array<IYamlModelMetricsAndCalc>): YamlModelBuilder {
    return this.with({ metrics: [...this.clonedData.metrics, ...metrics] });
  }

  addMetrics(...metricUniqueNames: Array<string>): YamlModelBuilder {
    const addedMetrics: IYamlModelMetricsAndCalc[] = metricUniqueNames.map((m) => ({ unique_name: m }));
    return this.with({ metrics: [...this.clonedData.metrics, ...addedMetrics] });
  }

  removeMetric(meticUniqueName: string): YamlModelBuilder {
    const newMetricsList = this.clonedData.metrics.filter((metric) => metric.unique_name !== meticUniqueName);
    return this.with({ metrics: newMetricsList });
  }

  removeAggregate(aggUniqueName: string): YamlModelBuilder {
    const newAggregatesList = this.clonedData.aggregates?.filter((agg) => agg.unique_name !== aggUniqueName);
    return this.with({ aggregates: newAggregatesList });
  }

  removeDimension(dimensionUniqueName: string): YamlModelBuilder {
    const newDimensions = this.clonedData.dimensions?.filter((dimension) => dimension !== dimensionUniqueName);
    const newRelationships = this.clonedData.relationships?.filter((relationship) => {
      {
        if (
          YamlDimensionTypeGuard.isRegularRelation(relationship) &&
          YamlDimensionTypeGuard.isEmbeddedRelation(relationship)
        ) {
          return relationship.to.dimension !== dimensionUniqueName;
        }
      }
    });
    return this.with({ dimensions: newDimensions, relationships: newRelationships });
  }

  addPartition(partition: Partial<IYamlModelPartition> = {}): YamlModelBuilder {
    const defaultPartitionValues: IYamlModelPartition = {
      unique_name: "name",
      dimension: "dim",
      attribute: "attr",
      type: PartitionType.key,
    };

    const newPartition = Object.assign(defaultPartitionValues, partition);
    return this.with({ partitions: [...(this.clonedData.partitions || []), newPartition] });
  }

  addPerspective(perspective: Partial<IYamlModelPerspective>): YamlModelBuilder {
    const newPerspective = YamlPerspectiveBuilder.create().with(perspective).build();
    return this.with({ perspectives: [...(this.clonedData.perspectives || []), newPerspective] });
  }

  addDrillthrough(drillthrough: Partial<IYamlModelDrillThrough> = {}): YamlModelBuilder {
    const defaultDrillthrough: IYamlModelDrillThrough = {
      notes: "notes",
      metrics: [],
      attributes: [{ name: "level name", dimension: "dim name" }],
      unique_name: "no uniqueName",
    };

    const newDrillthrough = Object.assign(defaultDrillthrough, drillthrough);
    return this.with({ drillthroughs: [...(this.clonedData.drillthroughs || []), newDrillthrough] });
  }

  addAggregate(aggregate: Partial<IYamlModelAggregate> = {}): YamlModelBuilder {
    const defaultAggregate: IYamlModelAggregate = {
      attributes: [{ name: "dim name", dimension: "dim" }],
      metrics: ["metric"],
      label: "perspective name",
      unique_name: "no uniqueName",
    };

    const newAggregate = Object.assign(defaultAggregate, aggregate);
    return this.with({ aggregates: [...(this.clonedData.aggregates || []), newAggregate] });
  }

  updateAggregate(aggOriginalName: string, newAggregate: IYamlModelAggregate): YamlModelBuilder {
    // Replace the original agg, so the new order of the objects is the same
    const newAggregatesList = this.clonedData.aggregates?.map((agg) =>
      agg.unique_name === aggOriginalName ? newAggregate : agg
    );

    return this.with({ aggregates: newAggregatesList });
  }

  addCalculation(calcUniqueName: string): YamlModelBuilder {
    return this.with({ metrics: [...(this.clonedData.metrics || []), { unique_name: calcUniqueName }] });
  }

  withOverrides(overrides: IYamlModelOverride): YamlModelBuilder {
    return this.with({ overrides });
  }

  addDatasetProperties(
    datasetUniqueName: string,
    aggregatesSettings?: IYamlDatasetProjectProps | IYamlDatasetModelProps
  ): YamlModelBuilder {
    const defaultProperties: IYamlDatasetProperties = {};
    const defaultValues: IYamlDatasetProjectProps | IYamlDatasetModelProps = {
      allow_aggregates: true,
    };
    const newProperties = Object.assign(defaultValues, aggregatesSettings);

    defaultProperties[datasetUniqueName] = newProperties;

    return this.with({ dataset_properties: defaultProperties });
  }
}
