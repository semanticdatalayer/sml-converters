import { IXmlCubeAction } from "./IXmlAction";
import { IXmlAggregate } from "./IXmlAggregate";
import { IXmlAttributeAndKeyReferences, IXmlCommonVisibleProperties } from "./IXmlCommonProjectProperties";
import { IXmlDataSetRef } from "./IXmlDataset";
import { IXmlCubeDimensionReferences } from "./IXmlDimension";
import { IXmlAttributesLists } from "./IXmlProject";

interface IXmlCubeCommonProperties {
  name?: string;
  description?: string;
  notes?: string;
}

export interface IXmlCubeProperties extends IXmlCubeCommonProperties, IXmlCommonVisibleProperties {
  partitions?: Array<IXmlAttributeAndKeyReferences>;
}

export interface IXmlCalculatedMemberReference {
  id: string;
  yamlUniqueName: string;
  calculatedMemberRef?: string;
  default?: string;
}

export interface IXmlCube {
  id: string;
  name: string;
  description?: string;
  properties?: IXmlCubeProperties;
  attributes?: IXmlAttributesLists;
  dimensions?: IXmlCubeDimensionReferences;
  actions?: IXmlCubeAction;
  datasets?: Array<IXmlDataSetRef>;
  calculatedMembers?: Array<IXmlCalculatedMemberReference>;
  aggregates?: Array<IXmlAggregate>;
}
