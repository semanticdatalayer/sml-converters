import { IXmlFlatProtoAttributeRef, IXmlSimpleKeyReference } from "./IXmlCommonProjectProperties";

export interface IXmlUnrelatedDimensionsEmpty {
  unrelatedDimensionsEmpty: string;
}
export interface IXmlUnrelatedDimensionsRepeat {
  unrelatedDimensionsRepeat: string;
}

export interface IXmlUnrelatedDimensionsError {
  unrelatedDimensionsError: string;
}

export type IXmlUnrelatedDimensions =
  | IXmlUnrelatedDimensionsEmpty
  | IXmlUnrelatedDimensionsRepeat
  | IXmlUnrelatedDimensionsError;

interface IXmlSubspace {
  aggregationFunction?: string;
  keyRef?: IXmlFlatProtoAttributeRef;
  attributeRef?: IXmlFlatProtoAttributeRef[];
}

interface IXmlAdditivity {
  subspace: IXmlSubspace;
}

export interface IXmlMeasureType {
  defaultAggregation: string;
  additivity?: IXmlAdditivity;
  unrelatedDimensions?: IXmlUnrelatedDimensions;
}

export interface IXmlCountDistinct {
  keyReference: IXmlSimpleKeyReference;
  approximate: boolean;
  unrelatedDimensions?: IXmlUnrelatedDimensions;
}

export interface IXmlSumDistinct {
  keyReference: IXmlSimpleKeyReference;
  unrelatedDimensions?: IXmlUnrelatedDimensions;
}

export interface IXmlCountType {
  keyReference: IXmlSimpleKeyReference;
  unrelatedDimensions?: IXmlUnrelatedDimensions;
}

export interface IXmlQuantileGroupType {
  attributeRef: IXmlSimpleKeyReference;
  compression: string;
}

export interface IXmlQuantileInstance {
  quantileGroupRef: IXmlSimpleKeyReference;
  quantileVal: string;
}
