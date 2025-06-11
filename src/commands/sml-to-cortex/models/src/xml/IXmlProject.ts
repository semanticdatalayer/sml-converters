import { IXmlCommonVisibleProperties, IXmlSimpleKeyReference } from "./IXmlCommonProjectProperties";
import { IXmlCube } from "./IXmlCube";
import { IXmlDataset } from "./IXmlDataset";
import { IXmlDimension } from "./IXmlDimension";
import { IXmlPerspective } from "./IXmlPerspective";
import { IXmlProjectAttribute } from "./IXmlProjectAttribute";
import { IXmlProjectAttributeKey } from "./IXmlProjectAttributeKey";
import { IXmlProjectCalculatedMember } from "./IXmlProjectCalculatedMember";
import { IXmlProjectKeyedAttribute } from "./IXmlProjectKeyedAttribute";

interface IXmlAggregateStore {
  connection: IXmlSimpleKeyReference;
  promotedAggRowCountLimit?: string;
  promotedAggsTotalRowCountLimit?: string;
}

export interface IXmlProjectAnnotation {
  name: string;
  value?: string;
}

export interface IXmlPreferredAggregateStores {
  aggregateStore: Array<IXmlAggregateStore>;
}

export interface IXmlProjectProperties extends IXmlCommonVisibleProperties {
  aggregatePrediction?: {
    speculativeAggregates: boolean;
  };
  aggressiveAggregatePromotion?: boolean;
  preferredAggregateStores?: IXmlPreferredAggregateStores;
}

export interface IXmlAttributesLists {
  attributeKey?: Array<IXmlProjectAttributeKey>;
  keyedAttribute?: Array<IXmlProjectKeyedAttribute>;
  attribute?: Array<IXmlProjectAttribute>;
}

export interface IXmlAttributes {
  attributeKey: IXmlProjectAttributeKey;
  keyedAttribute: IXmlProjectKeyedAttribute;
  attribute?: IXmlProjectAttribute;
}

export interface IXmlProjectMetadata {
  version: string;
  schema: string;
  schemaLocation: string;
  schemaInstance: string;
}

export default interface IXmlProject {
  name: string;
  projectMetadata: IXmlProjectMetadata;
  annotations: Array<IXmlProjectAnnotation>;
  properties: IXmlProjectProperties;
  datasets: Array<IXmlDataset>;
  cubes: Array<IXmlCube>;
  description?: string;

  attributes?: IXmlAttributesLists;
  dimensions?: Array<IXmlDimension>;
  calculatedMembers?: Array<IXmlProjectCalculatedMember>;
  perspectives?: Array<IXmlPerspective>;
}
