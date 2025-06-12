import {
  SMLReferenceableObject,
  SMLReferenceableObjectWithLabel,
  SMLObject,
  SMLDimensionCalculationGroup,
  SMLCalculationMethod,
  SMLUnrelatedDimensionsHandling,
  SMLRowSecurityIdType,
  SMLRowSecurityScope
} from "sml-sdk";

import { IAttributeData, IAttributeRole, ICommonAttributeProps, IFormatting } from "./ISharedProps";
// import { IYamlDimensionCalculationGroup } from "./IYamlCalculationGroups";
// import { CalculationMethod, UnrelatedDimensionsHandling } from "./IYamlMeasure";
// import { IReferenceableYamlObject, IUniqueNameObject, IYamlObject } from "./IYamlObject";
// import { YamlRowSecurityIdType, YamlRowSecurityScope } from "./IYamlRowSecurity";

export enum YamlHierarchyEmptyField {
  Yes = "yes",
  No = "no",
  Always = "always",
}

export interface IYamlDimensionLevel extends SMLReferenceableObject {
  is_hidden?: boolean;
  secondary_attributes?: Array<IYamlDimensionSecondaryAttribute>;
  aliases?: Array<IYamlLevelAliasAttribute>;
  metrics?: Array<IYamlDimensionMetric>;
  parallel_periods?: Array<IYamlLevelParallelPeriod>;
}

export interface IYamlDimensionHierarchy extends ICommonAttributeProps, SMLReferenceableObjectWithLabel {
  levels: Array<IYamlDimensionLevel>;
  unique_name: string;
  filter_empty?: YamlHierarchyEmptyField;
  default_member?: IDefaultMember;
}

export type CustomEmptyMemberInput = string | number | boolean;

export interface IYamlCustomEmptyMember {
  key: Array<CustomEmptyMemberInput>;
  name: CustomEmptyMemberInput;
  sort_name?: CustomEmptyMemberInput;
}

interface IDefaultMember {
  expression: string;
  apply_only_when_in_query?: boolean;
}

interface IAllowedCalcsForDMA {
  allowed_calcs_for_dma?: Array<string>;
}

interface IKeyColumn {
  key_columns: Array<string>;
}
interface IBasicDimensionalAttribute extends IAttributeData, IBasicLevelAliasAttribute {}

interface IBasicLevelAliasAttribute extends IAttributeData {
  name_column: string;
  sort_column?: string;
}

interface ICustomEmptyMember {
  custom_empty_member?: IYamlCustomEmptyMember;
}

interface IDataHandling extends ICustomEmptyMember, IFormatting {
  exclude_from_dim_agg?: boolean;
  exclude_from_fact_agg?: boolean;
  is_aggregatable?: boolean;
}

export interface ILevelDatasetInfo extends IBasicDimensionalAttribute, IKeyColumn {
  is_unique_key?: boolean;
}

interface IBaseLevel extends SMLReferenceableObjectWithLabel, IDataHandling, IAllowedCalcsForDMA, ICommonAttributeProps {
  contains_unique_names?: boolean;
}

export interface IYamlLevelFromOneDataset extends ILevelDatasetInfo, IBaseLevel, IAttributeRole {
  time_unit?: YamlDimensionTimeUnit;
}

export interface IYamlLevelWithMultipleDatasets extends IBaseLevel, IAttributeRole {
  time_unit?: YamlDimensionTimeUnit;
  shared_degenerate_columns: Array<ILevelDatasetInfo>;
}

export type IYamlDimensionLevelAttribute = IYamlLevelFromOneDataset | IYamlLevelWithMultipleDatasets;

export interface IYamlDimensionSecondaryAttribute extends IBasicDimensionalAttribute, IBaseLevel, Partial<IKeyColumn> {
  is_unique_key?: boolean;
  is_hidden?: boolean;
}

export type IDimensionalAttribute = IYamlDimensionLevelAttribute | IYamlDimensionSecondaryAttribute;

export interface IYamlDimensionMetric
  extends SMLReferenceableObjectWithLabel,
    IDataHandling,
    IAllowedCalcsForDMA,
    IAttributeData,
    ICommonAttributeProps {
  calculation_method: SMLCalculationMethod;
  column: string;
  unrelated_dimensions_handling?: SMLUnrelatedDimensionsHandling;
}

export interface IYamlLevelAliasAttribute
  extends IBasicLevelAliasAttribute,
    SMLReferenceableObjectWithLabel,
    IDataHandling,
    ICommonAttributeProps,
    IAttributeRole {}

export interface IYamlLevelParallelPeriod {
  level: string;
  key_columns: Array<string>;
}

export enum IYamlDimensionType {
  Time = "time",
  Standard = "standard",
}

export const isTimeDimension = (type: IYamlDimensionType): boolean => {
  return type === IYamlDimensionType.Time;
};

export enum YamlDimensionTimeUnit {
  Year = "year",
  HalfYear = "halfyear",
  Trimester = "trimester",
  Quarter = "quarter",
  Month = "month",
  Week = "week",
  Day = "day",
  Hour = "hour",
  Minute = "minute",
  Second = "second",
  Undefined = "undefined",
}

export interface IYamlSnowflakeRelationship {
  from: {
    dataset: string;
    join_columns: Array<string>;
  };
  to: {
    level: string;
  };
  type: YamlDimensionRelationType.Snowflake;
}

export type IYamlDimensionRegularRelationship = IYamlSnowflakeRelationship | IYamlEmbeddedRelationship;
export type IYamlDimensionRelationship = IYamlDimensionRegularRelationship | IYamlSecurityRelationship;

export interface IYamlEmbeddedRelationship extends SMLReferenceableObject {
  from: {
    dataset: string;
    join_columns: Array<string>;
    hierarchy: string;
    level: string;
  };
  to: {
    level: string;
    dimension: string;
  };
  type: YamlDimensionRelationType.Embedded;
  role_play?: string;
}

export interface IYamlSecurityRelationship extends SMLReferenceableObject {
  from: {
    dataset: string;
    join_columns: Array<string>;
    hierarchy: string;
    level: string;
  };
  to: {
    row_security: string;
  };
  type: YamlDimensionRelationType.Embedded;
}

export enum YamlDimensionRelationType {
  Embedded = "embedded",
  Snowflake = "snowflake",
}

export interface IYamlDimensionSecurityProps {
  filter_key_column: string;
  ids_column: string;
  id_type: SMLRowSecurityIdType;
  scope: SMLRowSecurityScope;
  use_filter_key?: boolean;
  secure_totals?: boolean;
}

interface IYamlBaseDimension extends SMLObject {
  is_degenerate?: boolean;
  hierarchies: Array<IYamlDimensionHierarchy>;
  description?: string;
  type?: IYamlDimensionType;
  relationships?: Array<IYamlDimensionRelationship>;
  calculation_groups?: Array<SMLDimensionCalculationGroup>;
}

export interface IYamlNormalDimension extends IYamlBaseDimension {
  is_degenerate?: false;
  level_attributes: Array<IYamlLevelFromOneDataset>;
}

export interface IYamlDegenerateDimension extends IYamlBaseDimension {
  is_degenerate: true;
  level_attributes: Array<IYamlLevelFromOneDataset | IYamlLevelWithMultipleDatasets>;
}

export type IYamlDimension = IYamlNormalDimension | IYamlDegenerateDimension;
