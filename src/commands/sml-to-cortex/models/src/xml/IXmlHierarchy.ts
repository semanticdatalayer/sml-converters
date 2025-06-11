import { IXmlCommonVisibleProperties } from "./IXmlCommonProjectProperties";

export interface IXmlParallelPeriod {
  levelReference: string;
  keyReference: string;
}

interface IYamlUniqueName {
  yamlUniqueName: string;
}

export enum XmlLevelTimeUnit {
  Years = "TimeYears",
  HalfYears = "TimeHalfYears",
  Trimester = "TimeTrimester",
  Quarters = "TimeQuarters",
  Months = "TimeMonths",
  Weeks = "TimeWeeks",
  Days = "TimeDays",
  Hours = "TimeHours",
  Minutes = "TimeMinutes",
  Seconds = "TimeSeconds",
  Undefined = "TimeUndefined",
}

export interface IXmlLevelProperties extends IXmlCommonVisibleProperties {
  uniqueInParent: boolean;
  levelType?: string;
  folder?: string;
  refNaming?: string;
  parallelPeriods?: Array<IXmlParallelPeriod>;
}

export interface IXmlLevelKeyedAttributeRolePlay {
  newRef: {
    refId: string;
    refNaming: string;
  };
}
export interface IXmlLevelKeyedAttributeRefProperties {
  naming?: string;
  multiplicity?: string;
  equivalentAttributeRef?: {
    attributeId: string;
  };
  dateFilter?: string;
  refPath?: IXmlLevelKeyedAttributeRolePlay;
}

export interface IXmlLevelKeyedAttributeRef extends IYamlUniqueName {
  attributeId: string;
  properties: IXmlLevelKeyedAttributeRefProperties;
  refId?: string;
}

export interface IXmlSecondaryAttributeReference extends IXmlLevelKeyedAttributeRef {
  unique?: string;
  complete?: string;
  columns?: Array<string>;
}

export interface IXmlLevel extends IYamlUniqueName {
  primaryAttribute: string;
  attributeReference?: Array<IXmlSecondaryAttributeReference>;
  properties?: IXmlLevelProperties;
  keyedAttributeRef?: Array<IXmlLevelKeyedAttributeRef>;
}

interface IXmlDefaultMember {
  allMember?: string;
  literalMember?: string;
  applyOnlyWhenInQuery?: boolean;
}

export enum XmlHierarchyEmptyField {
  Yes = "Yes",
  No = "No",
  Always = "Always",
}

export interface IXmlHierarchyProperties extends IXmlCommonVisibleProperties {
  caption?: string;
  folder?: string;
  description?: string;
  filterEmpty?: XmlHierarchyEmptyField;
  defaultMember?: IXmlDefaultMember;
}

export interface IXmlHierarchy {
  id: string;
  name: string;
  properties: IXmlHierarchyProperties;
  levels: Array<IXmlLevel>;
}
