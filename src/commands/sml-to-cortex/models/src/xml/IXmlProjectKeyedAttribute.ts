import { CustomEmptyMemberInput } from "../yaml/IYamlDimension";
import {
  IXmlCountDistinct,
  IXmlCountType,
  IXmlMeasureType,
  IXmlQuantileGroupType,
  IXmlQuantileInstance,
  IXmlSumDistinct,
} from "./IXmlAttributeType";
import {
  IXmlCommonVisibleProperties,
  IXmlDynamicConstraint,
  IXmlSimpleKeyReference,
} from "./IXmlCommonProjectProperties";

export interface IXmlKeyedAttributeOrdering {
  sortKey: {
    order?: string;
    value?: string;
    keyRef?: IXmlSimpleKeyReference;
  };
}

interface IXmlAllowCalculationType {
  calculationType: Array<string>;
}

interface IXmlEmptyValue {
  value: CustomEmptyMemberInput | Array<CustomEmptyMemberInput>;
}

export interface IXmlAttributeFormatting {
  nameFormat?: string;
  formatString?: string;
}

export interface IXmlAttributeCalculatedMemberFormatting extends IXmlAttributeFormatting {
  useInputMeasureFormat?: boolean;
}

export interface IXmlAttributeType {
  measure?: IXmlMeasureType;
  enum?: string;
  count?: IXmlCountType;
  distinctCount?: IXmlCountDistinct;
  distinctSum?: IXmlSumDistinct;
  quantileGroup?: IXmlQuantileGroupType;
  quantileInstance?: IXmlQuantileInstance;
}

export interface IXmlBaseAttributeProperties extends IXmlCommonVisibleProperties {
  isAggregatable?: boolean;
  excludeFromDimensionalAgg?: boolean;
  excludeFromFactAgg?: boolean;
  emptyValues?: IXmlEmptyValue;
}

export interface IXmlProjectKeyedAttributeProperties extends IXmlBaseAttributeProperties {
  type: IXmlAttributeType;
  visible: boolean;
  folder?: string;
  formatting?: IXmlAttributeFormatting;
  unique?: boolean;
  highCardinality?: string;
  ordering?: IXmlKeyedAttributeOrdering;
  dynamicConstraint?: IXmlDynamicConstraint;
  description?: string;
  allowedCalculationType?: IXmlAllowCalculationType;
}

export interface IXmlProjectKeyedAttribute {
  id: string;
  name: string;
  properties: IXmlProjectKeyedAttributeProperties;
  keyRef: string;
  yamlNameColumn: string;
  dimensionName?: string;
}
