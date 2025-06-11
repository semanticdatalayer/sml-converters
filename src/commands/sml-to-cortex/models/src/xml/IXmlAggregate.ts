import {
  IXmlAttributeAndKeyReferences,
  IXmlCommonProperties,
  IXmlFlatProtoAttributeRef,
} from "./IXmlCommonProjectProperties";

interface IXmlAggregatesCaching {
  engineMemory?: string;
}
interface IXmlAggregatesProperties extends IXmlCommonProperties {
  caching?: IXmlAggregatesCaching;
}

export interface IXmlAttributes {
  attributeRef?: Array<IXmlFlatProtoAttributeRef>;
  keyRef?: Array<IXmlFlatProtoAttributeRef>;
}
export interface IXmlAggregate {
  id: string;
  name: string;
  // targetConnection?: string; removed for now ATSCALE-21892
  properties: IXmlAggregatesProperties;
  attributes: IXmlAttributes;
  partitionReferences?: Array<IXmlAttributeAndKeyReferences>;
  distributionReferences?: Array<IXmlAttributeAndKeyReferences>;
}
