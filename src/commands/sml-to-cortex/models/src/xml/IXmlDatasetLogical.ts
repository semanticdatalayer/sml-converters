import { IXmlFlatProtoAttributeRef, IXmlSimpleKeyReference } from "./IXmlCommonProjectProperties";

export interface IXmlDatasetLogicalAttributeRef {
  id: string;
  complete: string;
  column: Array<string>;
}

export interface IXmlCubeLogicalRefPath {
  refNaming?: string;
  refId?: string;
  attributeId?: string;
  references?: Array<IXmlSimpleKeyReference>;
}

export interface IXmlDatasetLogicalKeyRef extends IXmlDatasetLogicalAttributeRef {
  unique: string;
  refPath?: IXmlCubeLogicalRefPath;
  yamlUniqueName?: string;
}

export interface IXmlIncrementalIndicator {
  keyRef?: IXmlFlatProtoAttributeRef;
  attributeRef?: IXmlFlatProtoAttributeRef;
  gracePeriod?: number;
}

export interface IXmlDatasetLogical {
  attributeRef: Array<IXmlDatasetLogicalAttributeRef>;
  keyRef?: Array<IXmlDatasetLogicalKeyRef>;
  incrementalIndicator?: IXmlIncrementalIndicator;
}
