import { IXmlCommonVisibleProperties, IXmlSimpleKeyReference } from "./IXmlCommonProjectProperties";

export interface IXmlFlatAttributeRef {
  id: string;
  properties: IXmlCommonVisibleProperties;
  flatRefs?: Array<IXmlSimpleKeyReference>;
}

export interface IXmlFlatLevelRef {
  primaryAttributeId: string;
  properties: IXmlCommonVisibleProperties;
}

export interface IXmlFlatHierarchyRef {
  id: string;
  properties: IXmlCommonVisibleProperties;
  flatLevelRef?: Array<IXmlFlatLevelRef>;
}

export interface IXmlFlatDimensionRef extends IXmlFlatAttributeRef {
  flatHierarchyRef?: Array<IXmlFlatHierarchyRef>;
}

export interface IXmlFlatDimensionRefs {
  flatDimensionRef: Array<IXmlFlatDimensionRef>;
}

export interface IXmlCalculatedMemberRef {
  id: string;
  properties: IXmlCommonVisibleProperties;
}

interface IXmlPermission {
  name: string;
  restricted: string;
}

interface IXmlSecureGroups {
  id: string;
  permission: Array<IXmlPermission>;
  username?: string;
}

interface IXmlSecureUser extends IXmlSecureGroups {
  username: string;
}

export interface IXmlPrincipal {
  group?: Array<IXmlSecureGroups>;
  user?: Array<IXmlSecureUser>;
}

interface IXmlPerspectiveSecurity {
  principals: IXmlPrincipal;
}

interface IXmlPerspectiveProperties {
  perspectiveSecurity: IXmlPerspectiveSecurity;
}

export interface IXmlPerspective {
  id: string;
  name: string;
  cubeRef: string;
  flatAttributeRef?: Array<IXmlFlatAttributeRef>;
  flatDimensionRef?: Array<IXmlFlatDimensionRef>;
  calculatedMemberRefs?: Array<IXmlCalculatedMemberRef>;
  perspectiveProperties?: IXmlPerspectiveProperties;
}
