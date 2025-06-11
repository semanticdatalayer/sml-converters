import { IYamlEmbeddedRelationship } from "../yaml/IYamlDimension";
import { IXmlCalculationGroup } from "./IXmlCalculationGroup";
import { IXmlCommonVisibleProperties, IXmlSimpleKeyReference } from "./IXmlCommonProjectProperties";
import { IXmlHierarchy } from "./IXmlHierarchy";
import { IXmlAttributesLists } from "./IXmlProject";

export interface IXmlDimensionProperties extends IXmlCommonVisibleProperties {
  description?: string;
  dimensionType?: string;
  name?: string;
  folder?: string;
}

interface IModelerMetadata {
  globalId: string;
  version: number;
  modified: boolean;
}

export interface IXmlCubeDimensionReferences {
  dimensionReferences?: Array<IXmlSimpleKeyReference>;
  dimension?: Array<IXmlDimension>;
}

export interface IXmlDimension {
  id: string;
  name: string;
  properties: IXmlDimensionProperties;
  hierarchies: Array<IXmlHierarchy>;
  calculationGroup?: Array<IXmlCalculationGroup>;
  modelerMetadata?: IModelerMetadata;
  embeddedRelationshipsMetadata?: Array<IYamlEmbeddedRelationship>;
}

export interface IXMLProjectDimensions {
  dimension: Array<IXmlDimension>;
}

export interface IXmlDimensionAllProps {
  attributes: IXmlAttributesLists;
  dimension: IXmlDimension;
}
