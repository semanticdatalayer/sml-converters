import { ObjectType } from "../ObjectType";
import { IYamlDatasetsProperties } from "./IYamlCatalog";
import { YamlDimensionRelationType } from "./IYamlDimension";
// import { IReferenceableYamlObject, IUniqueNameObject, IYamlObject } from "./IYamlObject"; overriden

import { 
  SMLReferenceableObjectWithLabel, 
  SMLReferenceableObject, 
  SMLObject 
} from "sml-sdk";

export enum CachingType {
  engineMemory = "engine-memory",
}
interface IYamlQueryName {
  query_name: string;
}

export interface IYamlQueryNameWithObjectType extends SMLReferenceableObject, IYamlQueryName {
  object_type: ObjectType;
}

export type IYamlModelOverride = Record<string, IYamlQueryName>;

export interface IYamlModel extends SMLObject, IYamlDatasetsProperties {
  include_default_drillthrough?: boolean;
  relationships: Array<IYamlModelRelationship>;
  metrics: Array<IYamlModelMetricsAndCalc>;
  partitions?: Array<IYamlModelPartition>;
  dimensions?: Array<string>;
  description?: string;
  perspectives?: Array<IYamlModelPerspective>;
  drillthroughs?: Array<IYamlModelDrillThrough>;
  aggregates?: Array<IYamlModelAggregate>;
  overrides?: IYamlModelOverride;
}

export interface IYamlModelMetricsAndCalc extends SMLReferenceableObject {
  folder?: string;
}

export type IYamlModelRelationship = IYamlModelRegularRelationship | IYamlModelSecurityRelationship;

export interface IYamlModelRegularRelationship extends SMLReferenceableObject {
  from: {
    dataset: string;
    join_columns: Array<string>;
  };
  to: {
    dimension: string;
    level: string;
  };
  role_play?: string;
  type?: YamlDimensionRelationType;
}

export interface IYamlModelSecurityRelationship extends SMLReferenceableObject {
  from: {
    dataset: string;
    join_columns: Array<string>;
  };
  to: {
    row_security: string;
  };
  type?: YamlDimensionRelationType;
}

export interface IYamlModelPerspective extends Omit<SMLReferenceableObjectWithLabel, "label"> {
  metrics?: Array<string>;
  dimensions?: Array<IYamlPerspectiveDimension>;
}

export interface IYamlPerspectiveDimension {
  name: string;
  hierarchies?: Array<IYamlPerspectiveHierarchy>;
  secondary_attributes?: Array<string>;
  relationships_path?: Array<string>;
}

export interface IYamlPerspectiveHierarchy {
  name: string;
  levels?: Array<string>;
}

export interface IYamlModelDrillThrough extends Omit<SMLReferenceableObjectWithLabel, "label"> {
  metrics: Array<string>;
  notes?: string;
  attributes?: Array<IYamlAttributeReference>;
}

export interface IYamlAttributeReference {
  name: string;
  dimension: string;
  relationships_path?: Array<string>;
}

export interface IYamlModelAggregate extends SMLReferenceableObjectWithLabel {
  attributes?: Array<IYamlAggregateAttribute>;
  metrics?: Array<string>;
  caching?: CachingType;
}

export interface IYamlAggregateAttribute extends IYamlAttributeReference {
  partition?: PartitionType;
  distribution?: PartitionType;
}

export enum PartitionType {
  key = "key",
  name = "name",
  nameAndKey = "name+key",
}

export interface IYamlModelPartition extends SMLReferenceableObject {
  dimension: string;
  attribute: string;
  type: PartitionType;
  prefixes?: Array<string>;
}
